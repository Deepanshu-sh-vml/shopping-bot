import "./ChatHeader.css";
import fashionHubLogo from "../assets/fashion_hub_logo.png";

function ChatHeader({ online, cartCount = 0, onCartClick, onClose }) {
  return (
    <div className="chat-header">
      <div className="header-left">
        <div className="header-avatar">
          <img src={fashionHubLogo} alt="Fashion Hub Logo" className="header-avatar-logo" />
        </div>
        <div>
          <div className="header-title">Fashion Hub</div>
          <div className="header-subtitle">Shopping Assistant</div>
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
