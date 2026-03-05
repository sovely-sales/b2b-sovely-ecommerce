import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');

    const handleSendOTP = (e) => {
        e.preventDefault();
        if (email) {
            setStep(2);
        }
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        // Simulate verification
        setStep(3);
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        // Simulate reset
        alert("Password reset successfully! You can now log in.");
        window.location.href = '/login';
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="navbar-logo" style={{ justifyContent: 'center', marginBottom: '24px', display: 'flex', textDecoration: 'none' }}>
                        <span className="logo-icon" style={{ fontSize: '1.8rem' }}>🛒</span>
                        <span className="logo-text" style={{ fontSize: '1.8rem' }}>Sovely</span>
                    </Link>
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">
                        {step === 1 && "Enter your email to receive an OTP"}
                        {step === 2 && "Enter the OTP sent to your email"}
                        {step === 3 && "Create a new password"}
                    </p>
                </div>

                {step === 1 && (
                    <form className="auth-form" onSubmit={handleSendOTP}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-auth-submit">
                            Send OTP
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className="auth-form" onSubmit={handleVerifyOTP}>
                        <div className="form-group">
                            <label htmlFor="otp">One-Time Password (OTP)</label>
                            <input
                                type="text"
                                id="otp"
                                placeholder="Enter 6-digit OTP"
                                maxLength="6"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-auth-submit">
                            Verify OTP
                        </button>
                        <div className="auth-options" style={{ justifyContent: 'center', marginTop: '8px' }}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setStep(1); }}>Resend OTP</a>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form className="auth-form" onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label htmlFor="new-password">New Password</label>
                            <input
                                type="password"
                                id="new-password"
                                placeholder="Create a strong password"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirm Password</label>
                            <input
                                type="password"
                                id="confirm-password"
                                placeholder="Confirm your new password"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-auth-submit">
                            Reset Password
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    Remember your password? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
