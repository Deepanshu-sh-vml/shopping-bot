import { useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import "./ChatWidget.css";

function ChatWidget({
  online = false,
  messages = [],
  cart = [],
  loading = false,
  onClose = () => { },
  onSend = () => { },
  onAddToCart = () => { },
  onRemoveFromCart = () => { },
  onCheckout = () => { } // <-- Add checkout prop
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Helper to calculate total cart price dynamically
  const calculateTotal = () => {
    let total = 0;
    cart.forEach(item => {
      // Handles price if it's formatted as "INR 699" or "$ 20"
      const numericPrice = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
      total += numericPrice * (item.qty || 1);
    });
    return total;
  };

  return (
    <div className="chat-widget">
      <ChatHeader
        online={online}
        cartCount={cart.length}
        onCartClick={() => setCartOpen((isOpen) => !isOpen)}
        onClose={onClose}
      />
      {cartOpen && (
        <div className="cart-panel">
          <div className="cart-panel-title">Cart</div>
          {cart.length === 0 ? (
            <div className="cart-empty">No items added yet.</div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div className="cart-item" key={`${item.id}-${index}`}>
                    <img
                      className="cart-item-image"
                      src={item.image_url}
                      alt={item.name}
                      style={{ cursor: "zoom-in" }}
                      onClick={() => setZoomedImage(item.image_url)}
                    />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-meta">
                        Qty {item.qty} · {item.price}
                      </div>
                    </div>
                    <button
                      className="cart-item-remove-btn"
                      type="button"
                      onClick={() => onRemoveFromCart(item.id)}
                      title="Remove item"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              {/* ---- 2. NEW CART FOOTER SUMMARY AND ORDER BUTTON ---- */}
              <div className="cart-panel-footer">
                <div className="cart-total-row">
                  <span>Total:</span>
                  <span className="cart-total-price">INR {calculateTotal()}</span>
                </div>
                <button
                  className="cart-checkout-btn"
                  type="button"
                  onClick={() => onCheckout(calculateTotal())}
                >
                  Order Now
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <MessageList
        messages={messages}
        loading={loading}
        onSend={onSend}
        onAddToCart={onAddToCart}
        onImageZoom={setZoomedImage}
      />

      <ChatInput onSend={onSend} disabled={loading} />

      {zoomedImage && (
        <div className="zoom-modal-overlay" onClick={() => setZoomedImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="zoom-close-button" onClick={() => setZoomedImage(null)}>
              &times;
            </span>
            <img src={zoomedImage} alt="Zoomed Product View" className="zoomed-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;