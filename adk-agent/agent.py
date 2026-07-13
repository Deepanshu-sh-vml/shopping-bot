import json
import os
import sys


# Mock ADK / Agent setup
class ShoppingAgent:
    def __init__(self):
        self.cart = []
        self.system_prompt = """
        You are a helpful shopping assistant. 
        Your job is to help users find clothes like shirts or pants.
        If a user asks for an item but doesn't specify 'size' and 'color', YOU MUST ask them for those details.
        Once you have the item type, size, and color, you should use the 'search_inventory' tool to check availability.
        If the user wants to buy an item, use the 'process_payment' tool.
        """

    def chat(self):
        print("🤖: Hello! I am your shopping bot. What are you looking for today?")
        while True:
            try:
                user_input = input("You: ")
                if user_input.lower() in ['exit', 'quit']:
                    print("🤖: Goodbye!")
                    break
                self.process_message(user_input)
            except KeyboardInterrupt:
                print("\n🤖: Goodbye!")
                break

    def process_message(self, message: str):
        # A simple mocked logic to demonstrate the flow
        msg = message.lower()
        if "shirt" in msg or "pants" in msg:
            if "size" not in msg and "color" not in msg:
                print("🤖: Could you please tell me the size and color you are looking for?")
            else:
                print("🤖: Let me check the inventory for you...")
                # Here it would call the MCP server tool via protocol
                print("[Tool Call] -> search_inventory(type, size, color)")
                print("🤖: I found a match! We have a Classic Cotton T-Shirt for $15.99. Would you like to add it to your cart?")
        elif "yes" in msg or "add" in msg:
            print("[Tool Call] -> add_to_cart(item_id='1')")
            self.cart.append("Classic Cotton T-Shirt")
            print("🤖: Added to cart! Your cart now has: ", self.cart)
            print("🤖: Would you like to proceed to payment?")
        elif "pay" in msg or "checkout" in msg:
            print("[Tool Call] -> process_payment(amount=15.99)")
            print("🤖: Payment successful via dummy gateway. Thank you for your purchase!")
        else:
            print("🤖: I'm not sure how to help with that. Are you looking for shirts or pants?")

