import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "./MessageList.css";

// Suggested starter tickets (shown when chat is empty)
const STARTER_QUESTIONS = [
  "Show me men's navy blue Tshirts in size L",
  "I'm looking for a women's red dress, size S",
  "Do you have black leather sneakers for men in size 10?",
  "Find me women's denim jackets in size L",
];

// Props (data DOWN):
//   messages = array of message objects
//   loading  = bool (are we waiting for a reply?)
//   onSend   = function(text) — used by the suggestion chips
function MessageList({ messages, loading, onSend, onAddToCart, onImageZoom }) {
  const bottomRef = useRef(null);

  // Auto-scroll to the newest message whenever messages or loading change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="message-list">
      {/* Welcome + suggestion chips when there are no messages yet */}
      {messages.length === 0 ? (
        <div className="welcome">
          <div className="welcome-icon">👋</div>
          <p className="welcome-title">Welcome to Shopping Assistant</p>
          <p className="welcome-sub">How can I help you ?</p>
          <div className="suggestions">
            {/* Assuming STARTER_QUESTIONS is declared elsewhere in this file */}
            {STARTER_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => onSend && onSend(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Render one bubble per message
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onAddToCart={onAddToCart}
            onImageZoom={onImageZoom} // <-- FIX: Add this missing property!
          />
        ))
      )}

      {/* Typing indicator while waiting for the backend */}
      {loading && (
        <div className="bubble bubble-bot">
          <div className="typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {/* Invisible anchor we scroll to */}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;




