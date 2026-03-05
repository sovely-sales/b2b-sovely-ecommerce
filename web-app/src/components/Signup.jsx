import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/v1/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/login');
            } else {
                throw new Error(data.message || "Please fill in all fields.");
            }
        } catch (err) {
            setError(err.message || 'Error creating account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="navbar-logo" style={{ justifyContent: 'center', marginBottom: '24px', display: 'flex', textDecoration: 'none' }}>
                        <span className="logo-icon" style={{ fontSize: '1.8rem' }}>🛒</span>
                        <span className="logo-text" style={{ fontSize: '1.8rem' }}>Sovely</span>
                    </Link>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join us and start shopping</p>
                </div>

                {error && <div style={{ color: 'red', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleSignup}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
