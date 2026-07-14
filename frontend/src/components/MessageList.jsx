import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "./MessageList.css";

// Suggested starter tickets (shown when chat is empty)
const STARTER_QUESTIONS = [
  "I was charged twice for my order. Please refund the duplicate.",
  "I can't log into my account — how do I reset my password?",
  "The app keeps crashing when I open it. What should I do?",
  "I want to cancel my order. How do I do that?",
];

// Props (data DOWN):
//   messages = array of message objects
//   loading  = bool (are we waiting for a reply?)
//   onSend   = function(text) — used by the suggestion chips
function MessageList({ messages, loading, onSend }) {
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
        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
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




