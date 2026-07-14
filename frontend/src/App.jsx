// App.jsx
import { useState, useEffect } from "react";
import ChatButton from "./components/ChatButton";
import ChatWidget from "./components/ChatWidget";
import * as api from "./api";
import "./styles.css";

function App() {
  // ---- STATE (the app's memory) ----
  const [isOpen, setIsOpen] = useState(false);               // Chat open/closed toggle
  const [online, setOnline] = useState(false);               // Backend reachable?
  const [messages, setMessages] = useState([]);              // Chat history
  const [loading, setLoading] = useState(false);             // Waiting for bot reply?
  const [conversationState, setConversationState] = useState(null); // ADK agent state (for memory)
  const [cart, setCart] = useState([]);                      // local cart view if needed

  // ---- On mount: Check if backend is alive ----
  useEffect(() => {
    api.getHealth()
      .then((h) => setOnline(h.status === "ok" || h.status === "healthy"))
      .catch(() => setOnline(false));
  }, []);

  // ---- LOGIC: Send a chat message to the Shopping Agent ----
  async function handleSend(userMessage) {
    // 1. Add the user's message to the chat interface immediately
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: userMessage },
    ]);
    setLoading(true);

    try {
      // 2. Call the backend with the user message and current conversationState
      const result = await api.sendMessage(userMessage, conversationState);

      // 3. Save the returned ADK state so the agent remembers context in the next turn
      if (result.state) {
        setConversationState(result.state);
      }

      // 4. Append the Bot's reply to the message history
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: result.text || "I'm sorry, I couldn't process that request.",
        },
      ]);

      // 5. Optional: Sync cart state if the agent triggered an add_to_cart action
      if (result.cart_updated) {
        api.getCart().then((currentCart) => setCart(currentCart)).catch(() => { });
      }

    } catch (err) {
      // 6. Show errors as a bot message gracefully instead of crashing
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

  // ---- RENDER: Button when closed, Chat widget overlay when open ----
  return (
    <div className="page">
      {isOpen ? (
        <>
          <div className="chat-overlay" onClick={() => setIsOpen(false)} />
          <ChatWidget
            online={online}
            messages={messages}
            loading={loading}
            onClose={() => setIsOpen(false)}
            onSend={handleSend}
          />
        </>
      ) : (
        <ChatButton onOpen={() => setIsOpen(true)} />
      )}
    </div>
  );
}

export default App;