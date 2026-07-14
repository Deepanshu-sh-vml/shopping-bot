from google.adk import Agent
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
import os

mcp_server_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'server.py'))

inventory_mcp = McpToolset(
    # pyrefly: ignore [unexpected-keyword]
    command="python",
    # pyrefly: ignore [unexpected-keyword]
    args=[mcp_server_path]
)

def add_to_cart(item_name: str) -> str:
    """Adds a named item to the shopping cart."""
    return f"Added {item_name} to cart."

def process_payment(amount: float) -> str:
    """Processes a dummy payment."""
    return f"Successfully processed payment of ${amount}."

agent = Agent(
    name="ShoppingBot",
    model="gemini-1.5-pro",
    # pyrefly: ignore [unexpected-keyword]
    instructions="""
    You are a helpful shopping assistant.
    Your job is to help users find clothes like shirts or pants.
    If a user asks for an item but doesn't specify 'size' and 'color', YOU MUST ask them for those details before searching.
    Once you have the item type, size, and color, you should use the 'search_inventory' tool to check availability.
    If the user wants to buy an item, use the 'add_to_cart' tool and then the 'process_payment' tool.
    """,
    tools=[inventory_mcp, add_to_cart, process_payment]
)
