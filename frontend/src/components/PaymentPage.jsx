// PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import * as api from '../api'; // Import your shopping API client
import './PaymentPage.css';   // Import the separated stylesheet
import DummyUpiPage from './DummyUpiPage';

const PaymentPage = ({ onPaymentComplete, onBack }) => {
    const [cart, setCart] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        cardNumber: '',
        expiry: '',
        cvc: '',
    });

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [activeUpiApp, setActiveUpiApp] = useState(null);

    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Fetch actual shopping cart items on mount
    useEffect(() => {
        api.getCart()
            .then((data) => setCart(data || []))
            .catch((err) => console.error("Could not load cart for payment:", err));
    }, []);

    // Calculate dynamic cart total
    const calculateTotal = () => {
        let total = 0;
        cart.forEach(item => {
            // Strips currency characters (INR, $, spaces) and parses float
            const numericPrice = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
            total += numericPrice * (item.qty || 1);
        });
        return total;
    };

    const totalAmount = calculateTotal();
    const displayTotal = totalAmount > 0 ? `INR ${totalAmount}` : 'INR 0.00';

    // Dynamic input formatter
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Format card number with spaces (#### #### #### ####)
        if (name === 'cardNumber') {
            const formatted = value
                .replace(/\s?/g, '')
                .replace(/(\d{4})/g, '$1 ')
                .trim();
            setFormData({ ...formData, [name]: formatted.substring(0, 19) });
        }
        // Format expiry date (MM/YY)
        else if (name === 'expiry') {
            const formatted = value
                .replace(/^([1-9]\/|[2-9])$/g, '0$1/')
                .replace(/^(0[1-9]|1[0-2])$/g, '$1/')
                .replace(/^([0-1])([3-9])$/g, '0$1/$2')
                .replace(/^(0[1-9]|1[0-2])([0-9]{2})$/g, '$1/$2')
                .replace(/\/\//g, '/');
            setFormData({ ...formData, [name]: formatted.substring(0, 5) });
        }
        // Limit CVC to 3 or 4 digits
        else if (name === 'cvc') {
            setFormData({ ...formData, [name]: value.replace(/\D/g, '').substring(0, 4) });
        }
        else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Form Validation
    const validateForm = () => {
        const newErrors = {};
        if (paymentMethod === 'card') {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Email is invalid';
            }
            if (formData.cardNumber.replace(/\s/g, '').length < 16) {
                newErrors.cardNumber = 'Card number must be 16 digits';
            }
            if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(formData.expiry)) {
                newErrors.expiry = 'Use MM/YY format';
            }
            if (formData.cvc.length < 3) {
                newErrors.cvc = 'CVC must be 3 or 4 digits';
            }
        }
        return newErrors;
    };

    // Process API payment
    const processPaymentAPI = async () => {
        setIsProcessing(true);
        try {
            // Process real payment transaction with your python app.py checkout route
            await api.processPayment(totalAmount);

            setIsProcessing(false);
            setPaymentSuccess(true);

            // Callback if parent triggers UI changes (like returning to chat)
            if (onPaymentComplete) {
                onPaymentComplete();
            }
        } catch (err) {
            setIsProcessing(false);
            setErrors({ form: err.message || 'Payment processing failed.' });
        }
    };

    // Handle payment submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        await processPaymentAPI();
    };

    const handleUpiAppSuccess = async () => {
        setActiveUpiApp(null);
        await processPaymentAPI();
    };

    // Reset payment page helper
    const handleReset = () => {
        setFormData({ name: '', email: '', cardNumber: '', expiry: '', cvc: '' });
        setPaymentSuccess(false);
    };

    if (activeUpiApp) {
        return (
            <DummyUpiPage
                appName={activeUpiApp}
                amount={displayTotal}
                onSuccess={handleUpiAppSuccess}
                onCancel={() => setActiveUpiApp(null)}
            />
        );
    }

    if (paymentSuccess) {
        return (
            <div className="payment-container">
                <div className="payment-card animate-fade-in">
                    <div className="payment-success-icon">✓</div>
                    <h2 className="payment-title">Payment Successful!</h2>
                    <p className="payment-subtitle">
                        Thank you for your purchase. Your receipt has been sent to <strong>{formData.email}</strong>.
                    </p>
                    <button className="payment-button" onClick={handleReset}>
                        Make Another Payment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-container">
            <div className="payment-header">
                <button type="button" className="payment-back-btn" onClick={onBack}>&larr; Back to Chat</button>
            </div>
            <div className="payment-card">
                {/* Dynamic Order Summary Section */}
                <div className="payment-order-summary">
                    <h3 className="summary-title">Order Summary</h3>
                    {cart.length === 0 ? (
                        <div className="payment-summary-row">
                            <span>Empty Cart (Default checkout)</span>
                            <strong>INR 0.00</strong>
                        </div>
                    ) : (
                        <div className="payment-summary-items">
                            {cart.map((item, index) => (
                                <div className="payment-summary-row" key={`${item.id}-${index}`}>
                                    <span>{item.name} (Qty {item.qty})</span>
                                    <strong>{item.price}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="payment-summary-divider" />
                    <div className="payment-summary-row total-row">
                        <span>Total Payable:</span>
                        <strong>{displayTotal}</strong>
                    </div>
                </div>

                <h2 className="payment-title">Secure Checkout</h2>

                <div className="payment-method-toggle">
                    <label className="payment-method-label">
                        <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                        <strong>Credit / Debit Card</strong>
                    </label>
                    <label className="payment-method-label">
                        <input type="radio" name="paymentMethod" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                        <strong>UPI</strong>
                    </label>
                </div>

                {errors.form && <div className="payment-error-alert">{errors.form}</div>}

                {paymentMethod === 'card' && (
                    <form onSubmit={handleSubmit} className="payment-form">
                        {/* Billing Name */}
                        <div className="payment-form-group">
                            <label className="payment-label">Name on Card</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Jane Doe"
                                value={formData.name}
                                onChange={handleChange}
                                className={`payment-input ${errors.name ? 'error-border' : ''}`}
                            />
                            {errors.name && <span className="payment-error-text">{errors.name}</span>}
                        </div>

                        {/* Email */}
                        <div className="payment-form-group">
                            <label className="payment-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="jane@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={`payment-input ${errors.email ? 'error-border' : ''}`}
                            />
                            {errors.email && <span className="payment-error-text">{errors.email}</span>}
                        </div>

                        {/* Card Number */}
                        <div className="payment-form-group">
                            <label className="payment-label">Card Number</label>
                            <input
                                type="text"
                                name="cardNumber"
                                placeholder="0000 0000 0000 0000"
                                value={formData.cardNumber}
                                onChange={handleChange}
                                className={`payment-input ${errors.cardNumber ? 'error-border' : ''}`}
                            />
                            {errors.cardNumber && <span className="payment-error-text">{errors.cardNumber}</span>}
                        </div>

                        {/* Expiry and CVC Row */}
                        <div className="payment-form-row">
                            <div className="payment-form-group flex-1">
                                <label className="payment-label">Expiration (MM/YY)</label>
                                <input
                                    type="text"
                                    name="expiry"
                                    placeholder="MM/YY"
                                    value={formData.expiry}
                                    onChange={handleChange}
                                    className={`payment-input ${errors.expiry ? 'error-border' : ''}`}
                                />
                                {errors.expiry && <span className="payment-error-text">{errors.expiry}</span>}
                            </div>

                            <div className="payment-form-group flex-1 ml-10">
                                <label className="payment-label">CVC / CVV</label>
                                <input
                                    type="password"
                                    name="cvc"
                                    placeholder="123"
                                    value={formData.cvc}
                                    onChange={handleChange}
                                    className={`payment-input ${errors.cvc ? 'error-border' : ''}`}
                                />
                                {errors.cvc && <span className="payment-error-text">{errors.cvc}</span>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing || totalAmount <= 0}
                            className={`payment-button ${isProcessing ? 'processing' : ''}`}
                        >
                            {isProcessing ? 'Processing Payment...' : `Pay ${displayTotal}`}
                        </button>
                    </form>
                )}

                {paymentMethod === 'upi' && (
                    <form onSubmit={handleSubmit} className="payment-form">
                        <div className="apps-container" style={{ marginTop: '10px' }}>
                            <button
                                type="button"
                                className="payment-button btn-upi-app btn-phonepe"
                                onClick={() => setActiveUpiApp('phonepe')}
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="logo-phonepe" />
                                Pay with PhonePe
                            </button>
                            <button
                                type="button"
                                className="payment-button btn-upi-app btn-gpay"
                                onClick={() => setActiveUpiApp('gpay')}
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="logo-gpay" />
                                Pay with Google Pay
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;