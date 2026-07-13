import json
import os
import mcp.server.stdio
from mcp.server import Server
from mcp.types import Tool, TextContent
from typing import Any

# Initialize the server
app = Server("shopping-inventory")

# Load inventory data
inventory_file = os.path.join(os.path.dirname(__file__), "inventory.json")
def load_inventory():
    if os.path.exists(inventory_file):
        with open(inventory_file, 'r') as f:
            return json.load(f)
    return []

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
                    "item_type": {
                        "type": "string",
                        "description": "The type of clothing, e.g., 'shirt' or 'pants'."
                    },
                    "size": {
                        "type": "string",
                        "description": "The size of the clothing, e.g., 'small', 'medium', 'large'."
                    },
                    "color": {
                        "type": "string",
                        "description": "The color of the clothing, e.g., 'blue', 'red', 'black'."
                    }
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

    item_type = arguments.get("item_type", "").lower()
    size = arguments.get("size", "").lower()
    color = arguments.get("color", "").lower()

    inventory = load_inventory()
    
    # Filter inventory based on criteria
    matches = []
    for item in inventory:
        if (item.get("type", "").lower() == item_type and 
            item.get("size", "").lower() == size and 
            item.get("color", "").lower() == color):
            matches.append(item)

    if not matches:
        return [TextContent(type="text", text=f"Sorry, we don't have any {size} {color} {item_type}s in stock.")]

    result_text = "Found the following matching items in inventory:\n"
    for item in matches:
        result_text += f"- {item['name']} ({item['quality']} quality) - ${item['price']}\n"
    
    return [TextContent(type="text", text=result_text)]

async def main():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
