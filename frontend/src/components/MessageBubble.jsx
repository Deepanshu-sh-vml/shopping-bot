import "./MessageBubble.css";

function badgeClass(behavior) {
  if (behavior === "grounded_reply") return "badge badge-green";
  if (behavior === "grounded_denial") return "badge badge-amber";
  if (behavior === "escalate") return "badge badge-orange";
  return "";
}

function ProductCard({ product, onAddToCart, onImageZoom }) {
  return (
    <div className="product-card">
      <img
        className="product-image"
        src={product.image_url}
        alt={product.name}
        loading="lazy"
        style={{ cursor: "zoom-in" }}
        onClick={() => {
          console.log("[DEBUG] Zoom clicked on image:", product.image_url);
          if (onImageZoom) onImageZoom(product.image_url);
        }}
      />
      <div className="product-details">
        <div className="product-name">{product.name}</div>
        <div className="product-meta">
          {product.color} · {product.size} · {product.quality}
        </div>
        <div className="product-footer">
          <span className="product-price">{product.price}</span>
          <button className="add-cart-button" type="button" onClick={() => onAddToCart(product)}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, onAddToCart, onImageZoom }) {
  const isUser = message.role === "user";
  const products = message.products || [];

  return (
    <div className={isUser ? "bubble bubble-user" : "bubble bubble-bot"}>
      {!isUser && message.behavior && (
        <span className={badgeClass(message.behavior)}>{message.behavior.replace("_", " ")}</span>
      )}

      <div className="bubble-text">{message.text}</div>

      {!isUser && products.length > 0 && (
        <div className="product-list">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onImageZoom={onImageZoom} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
