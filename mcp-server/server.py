import json
import os
import sys
from mcp.server.stdio import stdio_server
from mcp.server import Server
from mcp.types import Tool, TextContent
from typing import Any
import re

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

def normalize_item_type(raw: str) -> str:
    """Lowercase, strip spaces/dashes, and singularize -> 'T-Shirts' becomes 'tshirt'."""
    clean = str(raw).lower().strip().replace("-", "").replace(" ", "")
    if clean.endswith("s") and clean not in ["pants", "jeans"]:
        clean = clean[:-1]
    return clean

# Collapse compound / synonym colors to a single distinctive token
COLOR_ALIASES = {
    "navy blue": "navy",
    "dark blue": "navy",
    "sky blue": "sky",
    "light blue": "blue",
    "off white": "off-white",
    "off-white": "off-white",
    "olive green": "olive",
    "red": "red",
    # add more as your inventory grows (maroon, olive, teal, etc.)
}

def normalize_color(color_str: str) -> str:
    clean = color_str.lower().strip()
    return COLOR_ALIASES.get(clean, clean)

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
                    "color": {"type": "string", "description": "The color, e.g., 'blue', 'red', 'black'."},
                    "gender": {"type": "string", "description": "The gender or target audience, e.g., 'men', 'women'."}
                },
                "required": ["item_type", "size", "color", "gender"]
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

    # ---- Clean / normalize inputs ----
    item_type_clean = normalize_item_type(arguments.get("item_type", ""))
    size = normalize_size(str(arguments.get("size", "")))
    color = normalize_color(str(arguments.get("color", "")))   # "navy blue" -> "navy"
    gender = str(arguments.get("gender", "")).lower().strip()

    print(f"\n📢 [MCP TOOL CALLED]", file=sys.stderr, flush=True)
    print(f"  -> Generated item_type: '{item_type_clean}'", file=sys.stderr, flush=True)
    print(f"  -> Generated size:      '{size}'", file=sys.stderr, flush=True)
    print(f"  -> Generated color:     '{color}'", file=sys.stderr, flush=True)
    print(f"  -> Generated gender:     '{gender}'", file=sys.stderr, flush=True)

    inventory = load_inventory()
    matches = []

    for item in inventory:
        # Normalize the inventory category EXACTLY like the query
        inv_category_clean = normalize_item_type(item.get("category", ""))

        inv_name  = str(item.get("productName", "")).lower()
        inv_color = str(item.get("color", "")).lower()
        inv_sizes = [s.upper() for s in item.get("sizes", [])]
        inv_gender = str(item.get("gender", "")).lower()

        color_haystack = f"{inv_name} {inv_color}"

        # ---- Matching ----
        # Category: EXACT match so "shirt" != "tshirt"
        category_match = (item_type_clean == inv_category_clean)

        # Color: whole-word match on the normalized token
        if color:
            color_match = re.search(rf"\b{re.escape(color)}\b", color_haystack) is not None
        else:
            color_match = True

        size_match = (size in inv_sizes) if size else True
        gender_match = (gender in inv_gender) if gender else True

        if category_match and color_match and size_match and gender_match:
            matches.append(item)

    if not matches:
        spec_str = f"size {size} " if size else ""
        spec_str += f"{color} " if color else ""
        return [TextContent(
            type="text",
            text=f"Sorry, we don't have any {spec_str}{item_type_clean}s for {gender} in stock."
        )]

    result_text = "Found the following matching items in inventory:\n"
    for item in matches:
        result_text += (
            f"- {item['productName']} by {item['brand']} "
            f"- INR {item['price']} (MRP: {item['mrp']})\n"
        )
    return [TextContent(type="text", text=result_text)]
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())