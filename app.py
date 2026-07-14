# app.py
import os
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

class ChatRequest(BaseModel):
    message: str
    state: dict | None = None  # We will keep this in the schema so the React frontend doesn't break

@app.get("/api/health")
def health_check():
    # ADK uses GOOGLE_API_KEY
    if not os.getenv("GOOGLE_API_KEY"):
        return {"status": "error", "message": "Missing GOOGLE_API_KEY"}
    return {"status": "ok"}

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
            "cart_updated": cart_updated
        }
    except Exception as e:
        print(f"Error executing agent run: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cart")
def get_cart():
    return shopping_cart

@app.post("/api/checkout")
def checkout_endpoint(payload: dict):
    global shopping_cart
    shopping_cart = []  # Clear cart
    return {
        "status": "success",
        "message": "Payment Success! Simulated checkout completed."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
