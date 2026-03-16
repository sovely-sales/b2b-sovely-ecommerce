import React, { useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const handleLogout = async () => {
        await logout();
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
        <div className="relative z-[100]">
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white/90 backdrop-blur-xl border-r border-white/50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-50 p-1.5 rounded-lg shadow-sm border border-slate-100">
                            <img src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png" alt="Sovely Logo" className="h-6 w-auto" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-slate-900">Sovely</span>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose} aria-label="Close sidebar">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar space-y-8">
                    
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Main Menu</h3>
                        <ul className="space-y-1">
                            <li><a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 text-accent font-bold"><span className="text-lg">🏠</span> Home</a></li>
                            <li><a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">📦</span> Manage NDR</a></li>
                            <li><a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">🛍️</span> Cart</a></li>
                            <li><a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">🚚</span> Order Track</a></li>
                            <li><a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">📋</span> Inventory</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Discover</h3>
                        <ul className="space-y-1">
                            <li><a href="#deals" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">🔥</span> Today's Deals</a></li>
                            <li><a href="#categories" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">🏷️</span> All Categories</a></li>
                            <li><a href="#services" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">💳</span> Our Services</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Settings</h3>
                        <ul className="space-y-1">
                            <li><Link to="/my-account" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">👤</span> My Account</Link></li>
                            <li><a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"><span className="text-lg">⚙️</span> Preferences</a></li>
                        </ul>
                    </div>
                </div>

                {/* Footer / Auth */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    {user ? (
                        <div className="flex flex-col items-center w-full">
                            <div className="flex flex-col items-center text-center mb-5">
                                <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-3">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl text-slate-400 font-bold">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Logged in as <span className="font-bold text-slate-900">{user.name || "User"}</span></p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate w-48">{user.email}</p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="w-full py-3 bg-danger/10 text-danger font-bold rounded-full hover:bg-danger hover:text-white transition-colors shadow-sm"
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <div className="w-full text-center">
                            <p className="text-sm font-bold text-slate-600 mb-4">Ready to start selling?</p>
                            <div className="flex flex-col gap-3">
                                <Link to="/login" onClick={onClose} className="w-full py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-full hover:border-slate-300 hover:bg-white transition-all">Log In</Link>
                                <Link to="/signup" onClick={onClose} className="w-full py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all">Sign Up Free</Link>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}

export default Sidebar;