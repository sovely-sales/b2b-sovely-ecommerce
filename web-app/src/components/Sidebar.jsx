import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        onClose();
        navigate('/login');
    };
    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">🛒</span>
                        <span className="logo-text">Sovely</span>
                    </div>
                    <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
                        ✕
                    </button>
                </div>

                <div className="sidebar-content">
                    <div className="sidebar-section">
                        <h3 className="sidebar-heading">Main Menu</h3>
                        <ul className="sidebar-nav">
                            <li>
                                <a href="#" className="sidebar-link active">
                                    <span className="sidebar-icon">🏠</span>
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="#" className="sidebar-link">
                                    <span className="sidebar-icon">📦</span>
                                    Manage NDR
                                </a>
                            </li>
                            <li>
                                <a href="#" className="sidebar-link">
                                    <span className="sidebar-icon">🛍️</span>
                                    Cart
                                </a>
                            </li>
                            <li>
                                <a href="#" className="sidebar-link">
                                    <span className="sidebar-icon">🚚</span>
                                    Order Track
                                </a>
                            </li>
                            <li>
                                <a href="#" className="sidebar-link">
                                    <span className="sidebar-icon">📋</span>
                                    Inventory
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h3 className="sidebar-heading">Settings</h3>
                        <ul className="sidebar-nav">
                            <li>
                                <Link to="/my-account" className="sidebar-link" onClick={onClose}>
                                    <span className="sidebar-icon">👤</span>
                                    My Account
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="sidebar-link">
                                    <span className="sidebar-icon">⚙️</span>
                                    Preferences
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button className="btn-sidebar-logout" onClick={handleLogout}>
                        <span className="sidebar-icon">🚪</span>
                        Log Out
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
