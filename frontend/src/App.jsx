import { useState, useEffect } from "react";
import ChatButton from "./components/ChatButton";
import ChatWidget from "./components/ChatWidget";
import PaymentPage from "./components/PaymentPage"; // <-- 1. Import your new PaymentPage
import * as api from "./api";
import "./styles.css";

function App() {
  const [isOpen, setIsOpen] = useState(false);                 // Chat widget open state
  const [currentPage, setCurrentPage] = useState("chat");      // Page controller: "chat" or "payment"
  const [online, setOnline] = useState(false);                 // Backend status
  const [messages, setMessages] = useState([]);                // Chat log list
  const [loading, setLoading] = useState(false);               // Response loader state
  const [conversationState, setConversationState] = useState(() => {
    const saved = localStorage.getItem("shoppingBotSession");
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState([]);                        // Cart item list

  // Check health on mount
  useEffect(() => {
    api.getHealth()
      .then((h) => setOnline(h.status === "ok"))
      .catch(() => setOnline(false));

    // Sync cart list
    api.getCart().then((data) => setCart(data || [])).catch(() => { });
  }, []);

  // Send query message
  async function handleSend(userMessage) {
    if (!userMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: userMessage },
    ]);
    setLoading(true);

    try {
      const result = await api.sendMessage(userMessage, conversationState);
      if (result.state) {
        setConversationState(result.state);
        localStorage.setItem("shoppingBotSession", JSON.stringify(result.state));
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: result.text || "I'm sorry, I couldn't process that request.",
          products: result.products || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: "⚠️ System offline. " + err.message,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Cart: Add Item Handler
  async function handleAddToCart(product) {
    try {
      await api.addToCart(product.id, product.name, 1);
      const currentCart = await api.getCart();
      setCart(currentCart);

      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "bot", text: `🛒 Added "${product.name}" to cart.` },
      ]);
    } catch (err) {
      console.error("Cart error:", err.message);
    }
  }

  // Cart: Remove Item Handler
  async function handleRemoveFromCart(productId) {
    try {
      const result = await api.removeFromCart(productId);
      if (result.cart) {
        setCart(result.cart);
      }
    } catch (err) {
      console.error("Cart remove error:", err.message);
    }
  }

  // ---- 2. CHECKOUT TRIGGER: Directs to checkout view ----
  function handleCheckoutTrigger(totalAmount) {
    if (totalAmount <= 0) return;
    setCurrentPage("payment"); // Transitions view to payment page
  }

  // ---- 3. PAYMENT COMPLETED: Clears cart and returns to chat ----
  async function handlePaymentComplete() {
    try {
      // Clear cart
      await api.processPayment(0); // backend route empties cart list
      setCart([]);

      // Auto-return to chat pane after 3 seconds of success banner
      setTimeout(() => {
        setCurrentPage("chat");
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: "bot",
            text: "🎉 Thank you! Your payment succeeded, and your order has been received. Let me know if you need help finding anything else!",
          },
        ]);
      }, 3500);
    } catch (err) {
      console.error("Could not process completion:", err);
    }
  }

  return (
    <div className="page">
      {isOpen ? (
        <>
          <div className="chat-overlay" onClick={() => setIsOpen(false)} />

          {/* ---- 4. DYNAMIC PAGE CONTROLLER CHANGER ---- */}
          {currentPage === "payment" ? (
            <div className="chat-widget" style={{ background: '#ffffff' }}>
              <PaymentPage 
                onPaymentComplete={handlePaymentComplete} 
                onBack={() => setCurrentPage("chat")}
              />
            </div>
          ) : (
            <ChatWidget
              online={online}
              messages={messages}
              cart={cart}
              loading={loading}
              onClose={() => setIsOpen(false)}
              onSend={handleSend}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onCheckout={handleCheckoutTrigger} // Linked directly to trigger
            />
          )}
        </>
      ) : (
        <ChatButton onOpen={() => setIsOpen(true)} />
      )}
    </div>
  );
}

export default App;