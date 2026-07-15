**🛍️ Intelligent AI Shopping Assistant**
An intelligent, full-stack clothing shopping chatbot built with the Agent Development Kit (ADK) and Python, powered by OpenRouter (Gemini/OpenAI).

The application utilizes the Model Context Protocol (MCP) to search a live product inventory database, handles missing information (like sizes and colors) through active counter-questions, and features a dynamic React frontend complete with a shopping cart, a full-screen image zoom lightbox, and a secure mock checkout payment gateway.



**🏗️ Architecture Overview**
The system is decoupled into three primary components:


```python
+-------------------------------------------+
        React Frontend (Vite / SPA)        |
+--------------------+----------------------+
                    |
            HTTP / CORS Requests
                    |
+--------------------+----------------------+
        FastAPI Backend (app.py)          |
+--------------------+----------------------+
                    |
        Stdio Subprocess Pipes (JSON-RPC)
                    |
+--------------------+----------------------+
|     MCP Inventory Server (server.py)      |
+--------------------+----------------------+
                    |
            Reads & Parses
                    |
       [ mcp-server/inventory.json ]

```


***The MCP Inventory Server (server.py): ***

A low-level Python-based Model Context Protocol (MCP) server that runs as a subprocess. It exposes a search_inventory tool and parses Myntra-style e-commerce products based on category, color, and sizes.

***The FastAPI Backend (app.py): ***
Connects the ADK Agent (using LiteLlm over OpenRouter) with session tracking, filters thoughts/planning output from OpenRouter, handles cart additions/deletions, and coordinates payments.

***The React Frontend: ***
A custom responsive chat widget supporting:
Welcome starter suggestion chips.

Dynamic product cards in bubbles (showing images, specs, price, and cart button).

Double-tap/Click full-screen image zoom.

Stateful side-panel Cart (with custom item removal).

Integrated payment billing gateway view with form validation.

**🚀 Getting Started**

**1. Prerequisites**
Ensure you have the following installed on your machine:

Python 3.10 or higher
Node.js (v18+) & npm


**2. Backend Setup**

**Clone the project and navigate to the project directory:**


   cd "shopping bot"


**Create and activate a Python virtual environment:**

python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

**Install the required python dependencies:**

pip install google-adk mcp python-dotenv fastapi uvicorn pydantic


**Create a .env file in the root directory and insert your OpenRouter API Key:**

OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openrouter/openai/gpt-4o-mini
   
**Run the FastAPI server:**

python app.py

Your backend API will now be live on http://127.0.0.1:8000

**3. Frontend Setup**

**Open a new terminal and navigate to the frontend directory:**

   cd frontend
   
**Install npm dependencies:**

npm install

**Run the React development server:**

npm run dev
Your React application will launch at http://localhost:5173

**🛠️ Configuration Details**

**Myntra-Style Inventory Layout (mcp-server/inventory.json)**

The application reads from a rich schema database:

json
[
  {
    "productId": 11363560,
    "productName": "Men Navy Blue & Maroon Striped Slim Fit Round Neck T-shirt",
    "brand": "WROGN",
    "category": "Tshirts",
    "landingPageUrl": "tshirts/wrogn/...",
    "price": 699,
    "mrp": 1199,
    "discount": 500,
    "discountDisplayStr": "(41% OFF)",
    "rating": 4.2,
    "ratingCount": 1850,
    "gender": "Men",
    "images": [
      {
        "view": "front",
        "src": "https://assets.myntassets.com/..."
      }
    ],
    "sizes": ["S", "M", "L", "XL"]
  }
]

**Key Custom Features Built:**

**Token Word Matcher (app.py):** Evaluates unstructured conversational text, matches it against product specs (e.g. brand, color, category, price), and returns structural arrays to React.

**OpenRouter Thought Filter (app.py):** Automatically strips planning chains (such as `` or "User wants... Must ask." lines) returning only pure user-facing speech.

**Standard Size Normalizer (server.py):** Maps values dynamically so searching "medium" or "Medium" matches "M" in the database.

**CORS & Proxying:** Vite redirects /api requests to port 8000 preventing cross-origin blockages.

**📂 Project Directory Structure**
**Shopping bot**
    |
    ├── __init__.py                     # Auto-discovery anchor
    ├── app.py                          # FastAPI App (Handles CORS, Cart API, Payment API)
    ├── .env                            # Environment Secrets (API Keys)
    ├── adk_agent/
    │   ├── requirement.txt             # list of requirements
    │   └── agent.py                    # Agent configurations (LlmAgent + MCP integration)
    |   
    ├── mcp-server/
    │   ├── requirement.txt             # list of requirements
    │   ├── server.py                   # MCP Server python script (Stdio Server loop)
    │   └── inventory.json              # Myntra-style database
    |
    └── frontend/
            ├── package.json            # Frontend dependency configuration
            ├── vite.config.js          # Vite configuration & /api reverse-proxy
            └── src/
                ├── api.js                  # Network fetch routing helpers
                ├── App.jsx                 # State control coordinator & Page Router
                ├── main.jsx                # React root entry point
                ├── styles.css              # Main layout stylesheet
                └── components/             # Modular React components & individual styles
                        ├── ChatButton.jsx
                        ├── ChatButton.css
                        ├── ChatHeader.jsx
                        ├── ChatHeader.css
                        ├── ChatInput.jsx
                        ├── ChatInput.css
                        ├── ChatWidget.jsx
                        ├── ChatWidget.css
                        ├── MessageBubble.jsx
                        ├── MessageBubble.css
                        ├── MessageList.jsx
                        ├── MessageList.css
                        ├── PaymentPage.jsx
                        └── PaymentPage.css


**💳 Dummy Payment Simulation**


The bot includes an Order Now checkout gateway.

When items are in the cart panel, the Total Price is calculated automatically.
Clicking "Order Now" slides open a dedicated secure payment portal form.
Form fields like Card Number Formatting (#### #### #### ####), Expiry (MM/YY), and CVC are validated live.
Completing the simulated payment empties the cart on the backend, updates the sidebar, and returns the user to the chat box with an order receipt.