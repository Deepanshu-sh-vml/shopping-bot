import os
from dotenv import load_dotenv
from agent import ShoppingAgent


# Load environment variables from .env file
load_dotenv()

def main():
    # You can access your API keys here if needed
    api_key = os.getenv("GEMINI_API_KEY")
    
    print("Starting Shopping Bot Application...")
    agent = ShoppingAgent()
    agent.chat()

if __name__ == "__main__":
    main()
