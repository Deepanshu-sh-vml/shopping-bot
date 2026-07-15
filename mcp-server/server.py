import json
import os
import sys
from mcp.server.stdio import stdio_server
from mcp.server import Server
from mcp.types import Tool, TextContent
from typing import Any

# Initialize the server
app = Server("shopping-inventory")

# ---- force absolute path so it works when launched as a subprocess ----
inventory_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "inventory.json")

# Diagnostic to STDERR
print(f"[server.py] Looking for inventory at: {inventory_file}", file=sys.stderr, flush=True)
print(f"[server.py] File exists: {os.path.exists(inventory_file)}", file=sys.stderr, flush=True)

def load_inventory():
    if os.path.exists(inventory_file):
        with open(inventory_file, 'r', encoding="utf-8") as f:
            data = json.load(f)
            print(f"[server.py] Loaded {len(data)} items from inventory.", file=sys.stderr, flush=True)
            return data
    print("[server.py] ERROR: inventory.json NOT FOUND.", file=sys.stderr, flush=True)
    return []

# Dictionary helper to normalize and match standard size terms
def normalize_size(size_str: str) -> str:
    clean = size_str.upper().strip()
    mapping = {
        "MEDIUM": "M",
        "SMALL": "S",
        "LARGE": "L",
        "EXTRA LARGE": "XL"
    }
    return mapping.get(clean, clean)

@app.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="search_inventory",
            description="Search the inventory for clothing items by type, size, and color. Use this to check if an item is available.",
            inputSchema={
                "type": "object",
                "properties": {
                    "item_type": {"type": "string", "description": "The type of clothing, e.g., 'shirt' or 'pants'."},
                    "size": {"type": "string", "description": "The size, e.g., 'M', 'S', 'L', 'medium', 'small'."},
                    "color": {"type": "string", "description": "The color, e.g., 'blue', 'red', 'black'."}
                },
                "required": ["item_type", "size", "color"]
            }
        )
    ]

@app.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, Any] | None) -> list[TextContent]:
    """Handle tool execution requests."""
    if name != "search_inventory":
        raise ValueError(f"Unknown tool: {name}")
    if not arguments:
        raise ValueError("Missing arguments")

    # Clean inputs
    item_type = str(arguments.get("item_type", "")).lower().strip()
    size = normalize_size(str(arguments.get("size", "")))
    color = str(arguments.get("color", "")).lower().strip()

    print(f"[server.py] Search called with: type={item_type}, size={size}, color={color}", file=sys.stderr, flush=True)

    inventory = load_inventory()
    matches = []
    
    for item in inventory:
        # Match Category/Type (e.g. category "Tshirts" matching "tshirt")
        inv_category = str(item.get("category", "")).lower().strip()
        
        # Match Color (checked against the product name or explicit metadata)
        inv_name = str(item.get("productName", "")).lower()
        
        # Match Size (checks if size is inside the sizes array)
        inv_sizes = [s.upper() for s in item.get("sizes", [])]
        
        # Checking matches
        category_match = (item_type in inv_category) or (inv_category in item_type)
        color_match = color in inv_name
        size_match = size in inv_sizes

        if category_match and color_match and size_match:
            matches.append(item)

    if not matches:
        return [TextContent(type="text", text=f"Sorry, we don't have any size {size} {color} {item_type}s in stock.")]

    result_text = "Found the following matching items in inventory:\n"
    for item in matches:
        result_text += f"- {item['productName']} by {item['brand']} - INR {item['price']} (MRP: {item['mrp']})\n"
    return [TextContent(type="text", text=result_text)]

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())