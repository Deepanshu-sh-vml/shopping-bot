# Shopping Bot with MCP Server Implementation Plan

We will build an intelligent shopping assistant chatbot that helps users find clothing, checks inventory via an MCP (Model Context Protocol) server, handles missing information by asking counter-questions, and provides options to add items to a cart and check out using a payment gateway.

## Goal Description
Create a shopping bot application using the Agent Development Kit (ADK) and Python. The system will consist of:
1. **Inventory MCP Server (Python)**: An MCP server that reads from a local inventory file (e.g., CSV or JSON) and exposes tools to query available clothing items (by type, size, color, etc.).
2. **ADK Agent**: An intelligent agent built with the ADK that interacts with the user via the ADK web UI. It will determine if required information (like size or color) is missing, ask counter-questions if necessary, and use the MCP server to fetch product details.
3. **Dummy Payment Gateway**: A mock implementation integrated into the agent's flow to handle checkout and "Add to Cart" functionality via conversational interaction or built-in ADK UI components.

> [!IMPORTANT]
> ## User Review Required
> Please review the updated architecture below. I have incorporated your choices: Python, ADK Web UI, and a dummy payment gateway. If this looks good, we can proceed with execution.

## Proposed Architecture

### 1. The Inventory MCP Server
- **Technology**: Python (using the official Python MCP SDK).
- **Data Source**: `inventory.json` containing a list of products (e.g., shirts, pants) with properties like `id`, `name`, `type`, `size`, `color`, `quality`, and `price`.
- **Exposed Tools**: 
  - `search_inventory(type, size, color)`: Returns matching products or indicates what is out of stock.

### 2. The ADK Agent Application
- **Technology**: Agent Development Kit (ADK) in Python.
- **Frontend**: Standard ADK Web UI. No custom frontend code is needed.
- **Agent Logic**: 
  - Analyzes user requests for clothing items.
  - Checks if required parameters (`size`, `color`) are provided. If not, asks counter-questions.
  - If parameters are provided, calls the `search_inventory` tool from the MCP server.
  - Handles an `add_to_cart` conversational flow.
  - Uses a `process_payment` tool that simulates a dummy payment gateway.
## Proposed Changes

### Setup and Configuration
#### [NEW] `mcp-server/package.json`
Dependencies for the MCP SDK.

#### [NEW] `mcp-server/inventory.json`
The dummy database with sample shirts and other clothing items.

#### [NEW] `mcp-server/server.py`
The MCP server implementation exposing the inventory tools.

<!-- ### Web Application
#### [NEW] `webapp/...`
Initialization of a modern web application (e.g., Next.js) with:
- Chat interface UI.
- Agentic logic to interact with the LLM and the MCP server.
- Cart state management.
- Payment flow UI. -->

## Verification Plan

### Automated/Local Testing
- Start the MCP server locally and verify its tools via an MCP inspector.
- Run the web application development server.

### Manual Verification
- Chat with the bot: say "I want a shirt".
- Verify the bot asks: "What size and color are you looking for?"
- Respond with "Large, Blue".
- Verify the bot fetches the large blue shirt from the inventory and displays a product card.
- Click "Add to Cart" and verify the cart updates.
- Click "Checkout" and verify the payment gateway screen appears.
