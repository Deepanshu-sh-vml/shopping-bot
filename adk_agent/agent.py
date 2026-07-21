# agent.py
import os
import sys
from dotenv import load_dotenv
from google.adk import Agent
# from google.adk.models.lite_llm import LiteLlm
# 1. Import the toolset
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
# 2. Import the connection params from the session_manager submodule
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
# 3. Import StdioServerParameters from the core 'mcp' library (NOT google.adk)
from mcp import StdioServerParameters

load_dotenv()

# path to server.py
mcp_server_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'server.py')
)
print(f"[agent.py] Resolved MCP Server Path: {mcp_server_path}")
print(f"[agent.py] Path exists: {os.path.exists(mcp_server_path)}")

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
    # model=LiteLlm(
    #     model=os.getenv("OPENROUTER_MODEL","openrouter/openai/gpt-4o-mini" ),
    #     api_key=os.getenv("OPENROUTER_API_KEY"),
    #     api_base=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1"),
    # ),
    instruction="""
    You are a helpful clothing shopping assistant.
    Your job is to help users find clothes (like shirts, pants, hoodies).
    
    CRITICAL FLOW:
    1. If a user asks for an item but doesn't specify its 'size', must check if they have provided their size previously in this conversation. If they have, use that previous size. If they haven't provided a size, YOU MUST politely ask them for it.
    2. if user searching shirts, T-shirts, etc for any specifice gender (like men) then must go in previous conversation and check, is he give size ?
    3. If a user asks for an item but doesn't specify its 'color', YOU MUST politely ask them to clarify. Do not make assumptions.
    4. If a user asks for an item but doesn't specify 'gender', YOU MUST politely ask them to clarify. Do not make assumptions.
    5. Once you have the clothing type (mapped to 'item_type'), size, and color, you must call the 'search_inventory' tool.
    5. If the item is available, present the details to the user and offer to buy.
    6. If they agree to buy, use the 'add_to_cart' tool and then the 'process_payment' tool.
    """,
    tools=[inventory_mcp, add_to_cart, process_payment]
)
