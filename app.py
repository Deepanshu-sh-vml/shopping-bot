# app.py
import json
import os
import re  # Added for regex cleaning
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google.adk.runners import InMemoryRunner
from google.genai import types

# Import your configured ADK agent
from adk_agent.agent import root_agent

load_dotenv()

app = FastAPI(title="Shopping Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock databases
shopping_cart = []
agent_runner = InMemoryRunner(agent=root_agent, app_name="shopping_bot")
USER_ID = "web-user"
INVENTORY_FILE = os.path.join(os.path.dirname(__file__), "mcp-server", "inventory.json")

class ChatRequest(BaseModel):
    message: str
    state: dict | None = None  # We will keep this in the schema so the React frontend doesn't break

class AddToCartRequest(BaseModel):
    item_id: int | None = None
    item_name: str | None = None
    quantity: int = 1

def load_inventory():
    with open(INVENTORY_FILE, "r", encoding="utf-8") as inventory:
        return json.load(inventory)

def find_products_in_text(text: str):
    if not text:
        return []
    
    lowered_text = text.lower()
    print(lowered_text)
    products = []
    
    for item in load_inventory():
        product_name = item["productName"].lower().strip()
        brand = item["brand"].lower().strip()
        
        # Match if the bot mentions the product name or its brand in the text
        if product_name in lowered_text or brand in lowered_text:
            # Format the output so our frontend doesn't break
            # We map nested values flatly to prevent frontend runtime crashes
            formatted_item = {
                "id": item["productId"],
                "name": item["productName"],
                "brand": item["brand"],
                "price": f"INR {item['price']}",
                "color": item.get("gender", "Unisex"), # Fallback attribute mapping
                "size": ", ".join(item["sizes"]),
                "quality": f"Rating: {item.get('rating', 'N/A')}⭐",
                "image_url": item["images"][0]["src"] if item.get("images") else ""
            }
            if formatted_item not in products:
                products.append(formatted_item)
                
    return products

def find_inventory_item(item_id: int | None = None, item_name: str | None = None):
    for item in load_inventory():
        if item_id is not None and item["productId"] == item_id:
            return {
                "id": item["productId"],
                "name": item["productName"],
                "price": f"INR {item['price']}",
                "image_url": item["images"][0]["src"] if item.get("images") else ""
            }
        if item_name and item["productName"].lower() == item_name.lower():
            return {
                "id": item["productId"],
                "name": item["productName"],
                "price": f"INR {item['price']}",
                "image_url": item["images"][0]["src"] if item.get("images") else ""
            }
    return None
# New helper function to clean OpenRouter thinking/reasoning blocks
# def clean_openrouter_thoughts(text: str) -> str:
#     if not text:
#         return ""
    
#     # 1. Remove XML style thinking tags if OpenRouter/model wraps them:
#     text = re.sub(r'', '', text, flags=re.DOTALL)
    
#     # 2. Remove reasoning prefixes like "User wants a shirt. We need size and color. Must ask. Sure! ..."
#     # This matches common patterns like "User wants... Must ask." or "Thought:..." at the very start
#     patterns_to_remove = [
#         r"^User wants.*?(?:Must ask\.|Must search\.|Should ask\.)\s*",
#         r"^Thought:.*?\n",
#         r"^Reasoning:.*?\n",
#     ]
#     for pattern in patterns_to_remove:
#         text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
#     # 3. Clean up any accidental leading punctuation or whitespace left from stripping
#     text = text.strip()
#     if text.startswith('.') or text.startswith(','):
#         text = text[1:].strip()
        
#     return text

@app.get("/api/health")
def health_check():
    if not os.getenv("GEMINI_API_KEY"):
        return {"status": "error", "message": "Missing GEMINI_API_KEY"}
    return {"status": "200 ok"}

def _event_text(event) -> str:
    if not event.content or not event.content.parts:
        return ""
    return "".join(part.text or "" for part in event.content.parts)

@app.post("/api/chat")
async def chat_with_agent(payload: ChatRequest):
    """
    Exposes your ADK agent to your React Frontend's api.js.
    """
    try:
        session_id = (payload.state or {}).get("session_id") or str(uuid4())
        session = await agent_runner.session_service.get_session(
            app_name=agent_runner.app_name,
            user_id=USER_ID,
            session_id=session_id,
        )
        if session is None:
            await agent_runner.session_service.create_session(
                app_name=agent_runner.app_name,
                user_id=USER_ID,
                session_id=session_id,
            )

        print("\n" + "🚀 [LLM INPUT DIAGNOSTIC]" + "="*40)
        print(f"User Session ID: {session_id}")
        print(f"Raw Input Text:  '{payload.message}'")
        print("="*65 + "\n", flush=True)

        new_message = types.Content(
            role="user",
            parts=[types.Part(text=payload.message)],
        )
        response_text = ""
        async for event in agent_runner.run_async(
            user_id=USER_ID,
            session_id=session_id,
            new_message=new_message,
        ):
            if event.is_final_response():
                response_text = _event_text(event)
        
        # Determine if an add_to_cart function was invoked based on text clues
        cart_updated = "Added" in response_text and "cart" in response_text.lower()
        if cart_updated:
            shopping_cart.append({"item": payload.message, "qty": 1})
            
        return {
            "text": response_text,
            "state": {"session_id": session_id},
            "cart_updated": cart_updated,
            "products": find_products_in_text(response_text),
        }
    except Exception as e:
        print(f"Error executing agent run: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cart")
def get_cart():
    return shopping_cart

@app.post("/api/cart/add")
def add_to_cart_endpoint(payload: AddToCartRequest):
    item = find_inventory_item(payload.item_id, payload.item_name)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    quantity = max(payload.quantity, 1)
    cart_item = {
        "id": item["id"],
        "name": item["name"],
        "price": item["price"],
        "image_url": item["image_url"],
        "qty": quantity,
    }
    shopping_cart.append(cart_item)
    return {"status": "success", "cart_item": cart_item, "cart": shopping_cart}

@app.post("/api/checkout")
def checkout_endpoint(payload: dict):
    global shopping_cart
    shopping_cart = []  # Clear cart
    return {
        "status": "success",
        "message": "Payment Success! Simulated checkout completed."
    }

@app.post("/api/cart/remove")
def remove_from_cart_endpoint(payload: dict):
    """
    Removes an item from the shopping cart by matching either 'id' or 'productId'.
    """
    global shopping_cart
    item_id = payload.get("item_id")
    
    if item_id is None:
        raise HTTPException(status_code=400, detail="Missing item_id parameter")

    # Debug helper printed to your terminal console
    print(f"[DEBUG] Attempting to remove item with ID: {item_id}", flush=True)

    # Clean filtering loop: match BOTH possible ID keys to prevent empty-clearing bugs
    new_cart = []
    for item in shopping_cart:
        # Check both 'id' and 'productId' dynamically
        curr_id = item.get("id") or item.get("productId")
        
        # Keep the item ONLY if its ID does not match the target item_id
        if curr_id != item_id:
            new_cart.append(item)
            
    shopping_cart = new_cart
    return {"status": "success", "cart": shopping_cart}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8100, reload=True)