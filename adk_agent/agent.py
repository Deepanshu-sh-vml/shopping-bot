# agent.py
import os
import sys
from google.adk import Agent
# 1. Import the toolset
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
# 2. Import the connection params from the session_manager submodule
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
# 3. Import StdioServerParameters from the core 'mcp' library (NOT google.adk)
from mcp import StdioServerParameters

# path to server.py
mcp_server_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'server.py')
)

# 2. Get the exact running Python executable path (fixes Windows/virtualenv execution)
# python_executable = sys.executable

# for the MCP connection
inventory_mcp = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command=sys.executable,
            args=[mcp_server_path]
        ),
        timeout=30
    )
)

def add_to_cart(item_name: str) -> str:
    """Adds a named item to the shopping cart."""
    return f"Added {item_name} to cart."

def process_payment(amount: float) -> str:
    """Processes a dummy payment."""
    return f"Successfully processed payment of ${amount}."

# Define your agent as 'root_agent' so 'adk web' can auto-discover it
root_agent = Agent(
    name="ShoppingBot",
    model="gemini-2.5-flash",
    instruction="""
    You are a helpful clothing shopping assistant.
    Your job is to help users find clothes (like shirts, pants, hoodies).
    
    CRITICAL FLOW:
    1. If a user asks for an item but doesn't specify its 'size' and 'color', YOU MUST politely ask them to clarify those details before searching. Do not make assumptions.
    2. Once you have the clothing type (mapped to 'item_type'), size, and color, you must call the 'search_inventory' tool.
    3. If the item is available, present the details to the user and offer to buy.
    4. If they agree to buy, use the 'add_to_cart' tool and then the 'process_payment' tool.
    """,
    tools=[inventory_mcp, add_to_cart, process_payment]
)

