import "./ChatHeader.css";

function ChatHeader({ online, cartCount = 0, onCartClick, onClose }) {
  return (
    <div className="chat-header">
      <div className="header-left">
        <div className="header-avatar">Shop</div>
        <div>
          <div className="header-title">Shopping Assistant</div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="cart-button"
          type="button"
          onClick={onCartClick}
          aria-label={`Cart with ${cartCount} items`}
        >
          <span>Cart</span>
          <span className="cart-count">{cartCount}</span>
        </button>
        <button className="header-close" onClick={onClose} aria-label="Close chat">
          X
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
