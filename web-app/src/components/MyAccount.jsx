import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const MyAccount = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '520px' }}>
                <div className="auth-header">
                    <Link to="/" className="navbar-logo" style={{ justifyContent: 'center', marginBottom: '24px', display: 'flex', textDecoration: 'none' }}>
                        <span className="logo-icon" style={{ fontSize: '1.8rem' }}>🛒</span>
                        <span className="logo-text" style={{ fontSize: '1.8rem' }}>Sovely</span>
                    </Link>
                    <h2 className="auth-title">My Account</h2>
                    <p className="auth-subtitle">Manage your account details</p>
                </div>

                <div className="account-avatar" style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'var(--color-primary, #1B4332)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: '700', margin: '0 auto 24px',
                    boxShadow: '0 4px 14px rgba(27, 67, 50, 0.3)'
                }}>
                    {user.name?.charAt(0).toUpperCase() || '?'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={user.name || ''} disabled style={{ background: '#f3f4f6', cursor: 'default' }} />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={user.email || ''} disabled style={{ background: '#f3f4f6', cursor: 'default' }} />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <input type="text" value={user.role || 'CUSTOMER'} disabled style={{ background: '#f3f4f6', cursor: 'default' }} />
                    </div>
                    <div className="form-group">
                        <label>Member Since</label>
                        <input type="text" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} disabled style={{ background: '#f3f4f6', cursor: 'default' }} />
                    </div>
                </div>

                <button
                    className="btn-auth-submit"
                    onClick={handleLogout}
                    style={{ background: '#DC2626', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)', width: '100%' }}
                >
                    🚪 Log Out
                </button>

                <div className="auth-footer">
                    <Link to="/">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;
