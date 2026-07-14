/**
 * API client for the Shopping Bot backend.
 * All calls go through /api proxy (configured in your vite.config.js / dev server)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Check backend health and agent status.
 */
export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

/**
 * Send a message to the Shopping Bot agent.
 * Handles the stateful conversation loop with the ADK agent.
 * 
 * @param {string} message - The user's input (e.g., "I'm looking for a medium red shirt")
 * @param {object|null} state - The current agent/conversation state (for keeping track of history)
 * @returns {Promise<object>} Contains { text: string, state: object }
 */
export async function sendMessage(message, state = null) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      state: state
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to communicate with Shopping Bot');
  }
  return res.json();
}

/**
 * Fetch the active shopping cart contents.
 * Useful if you want a visual cart sidebar in your frontend.
 */
export async function getCart() {
  const res = await fetch(`${API_BASE}/cart`);
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

/**
 * Manually add an item to the shopping cart.
 * 
 * @param {string} itemName - Name of the item
 * @param {number} quantity - Quantity to add
 * @returns {Promise<object>} Result of the add action
 */
export async function addToCart(itemName, quantity = 1) {
  const res = await fetch(`${API_BASE}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_name: itemName, quantity: quantity }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to add item to cart');
  }
  return res.json();
}

/**
 * Trigger the dummy payment checkout gateway process.
 * 
 * @param {number} amount - Total purchase price
 * @returns {Promise<object>} Payment success receipt/status
 */
export async function processPayment(amount) {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amount }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Payment gateway failed');
  }
  return res.json();
}