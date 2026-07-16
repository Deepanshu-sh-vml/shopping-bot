import React, { useState } from 'react';
import './DummyUpiPage.css';

const DummyUpiPage = ({ appName, amount, onSuccess, onCancel }) => {
    const [status, setStatus] = useState('pending'); // pending, processing, success

    const isGpay = appName === 'gpay';
    const appClass = isGpay ? 'gpay' : 'phonepe';
    
    // Add white background to PhonePe logo so it stands out if the background is purple, or just use the standard logo.
    const logoUrl = isGpay 
        ? 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg'
        : 'https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg';

    const handlePay = () => {
        setStatus('processing');
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        }, 2000);
    };

    return (
        <div className={`dummy-upi-page ${appClass}`}>
            <div 
                className="dummy-upi-back-btn" 
                onClick={status === 'processing' ? undefined : onCancel}
            >
                &larr;
            </div>
            
            <div className={`dummy-upi-logo-container ${appClass}`}>
                <img src={logoUrl} alt={appName} className="dummy-upi-logo" />
            </div>

            {status === 'pending' && (
                <>
                    <h2 className="dummy-upi-subtitle">Paying Shopping Bot</h2>
                    <h1 className="dummy-upi-amount">{amount}</h1>
                    <button 
                        onClick={handlePay}
                        className={`dummy-upi-pay-btn ${appClass}`}
                    >
                        Pay Now
                    </button>
                </>
            )}

            {status === 'processing' && (
                <div className="dummy-upi-status-container">
                    <div className={`dummy-upi-spinner ${appClass}`}></div>
                    <p className="dummy-upi-processing-text">Processing Payment...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="dummy-upi-status-container">
                    <div className="dummy-upi-success-icon">✓</div>
                    <h2 className={`dummy-upi-success-text ${appClass}`}>Payment Successful</h2>
                </div>
            )}
        </div>
    );
};

export default DummyUpiPage;
