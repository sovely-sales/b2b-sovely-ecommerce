import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { CartContext } from '../CartContext';
import { WishlistContext } from '../WishlistContext';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../features/products/api/productApi';
import { getCategoryIcon } from '../utils/categoryIcons';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';

function Navbar({ onToggleSidebar, onSelectCategory }) {
  const { user, logout, loading } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const { wishlistItems } = useContext(WishlistContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const dropRef = useRef(null);
  const hoverTimeout = useRef(null);
  const navigate = useNavigate(); // Added for logout redirection

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productApi.getCategories
  });

  const displayCategories = dbCategories.map((cat) => {
    const visual = getCategoryIcon(cat.name);
    return {
      _id: cat._id,
      name: cat.name,
      Icon: visual.Icon,
      color: visual.color,
      iconColor: visual.iconColor
    };
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setCatDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout.current);
    setCatDropOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setCatDropOpen(false), 180);
  };

  // Bulletproof logout wrapper
  const handleLogout = async () => {
    await logout();
    navigate('/'); // Instantly kick them back to the home page so they don't get stuck on an admin screen
  };

  return (
    <nav className="navbar" id="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo-wrapper">
            <button
              className="btn-menu-toggle"
              onClick={onToggleSidebar}
              aria-label="Toggle Navigation Menu"
            >
              ☰
            </button>
            <Link to="/" className="navbar-logo">
              <img src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png" alt="Sovely Logo" className="logo-image" />
              <span className="logo-text">Sovely</span>
            </Link>
          </div>

          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            {/* Category item with dropdown */}
            <li
              className="nav-item-dropdown"
              ref={dropRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`nav-link nav-link-btn ${catDropOpen ? 'nav-link-active' : ''}`}
                onClick={() => setCatDropOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={catDropOpen}
                id="nav-category-btn"
              >
                Category
                <span className={`nav-arrow ${catDropOpen ? 'nav-arrow-up' : ''}`}>▾</span>
              </button>

              <div className={`cat-dropdown ${catDropOpen ? 'cat-dropdown-open' : ''}`} role="menu">
                <div className="cat-dropdown-grid">
                  {displayCategories.map((cat, i) => (
                    <a
                      href="#products"
                      className="cat-dropdown-item"
                      key={cat._id || i}
                      onClick={() => {
                        setCatDropOpen(false);
                        if (onSelectCategory) onSelectCategory(cat.name);
                      }}
                      role="menuitem"
                    >
                      <span
                        className="cat-dropdown-icon"
                        style={{ backgroundColor: cat.color, color: cat.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <cat.Icon size={18} strokeWidth={2} />
                      </span>
                      <span className="cat-dropdown-label">{cat.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </li>

            <li><a href="#deals" className="nav-link">Deals</a></li>
            <li><a href="#new" className="nav-link">What's New</a></li>
            <li><a href="#delivery" className="nav-link">Delivery</a></li>
          </ul>
        </div>

        <div className="navbar-right">
          <div className="search-wrapper" id="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search Product"
              className="search-input"
              id="search-input"
            />
          </div>
          <div className="nav-actions">
            <button className="nav-icon-btn" aria-label="Wishlist" onClick={() => setIsWishlistOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlistItems?.length > 0 ? "#ef4444" : "none"} stroke={wishlistItems?.length > 0 ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {wishlistItems?.length > 0 && <span className="nav-badge" style={{ backgroundColor: '#ef4444' }}>{wishlistItems.length}</span>}
            </button>
            <button className="nav-icon-btn" aria-label="Cart" onClick={() => setIsCartOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path>
                <path d="M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {cartItems && cartItems.length > 0 && (
                <span className="nav-badge">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>

            <div className="nav-auth-buttons">
              {loading ? (
                <span className="nav-link">...</span>
              ) : user ? (
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                  
                  {/* 1. Name Greeting First */}
                  <Link to="/my-account" className="nav-link" style={{ fontWeight: 600 }}>Hi, {user.name.split(' ')[0]}</Link>
                  
                  {/* 2. Admin Panel Button (Sleek Theme Styling) */}
                  {user.role === 'ADMIN' && (
                    <Link 
                        to="/admin" 
                        style={{ 
                            padding: '8px 20px', 
                            background: '#1B4332', 
                            color: '#fff', 
                            borderRadius: '9999px', 
                            fontSize: '0.85rem', 
                            fontWeight: '600', 
                            textDecoration: 'none', 
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(27, 67, 50, 0.15)'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#2D6A4F'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#1B4332'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        Admin Panel
                    </Link>
                  )}
                  
                  {/* 3. Updated Logout Button */}
                  <button 
                      onClick={handleLogout} 
                      style={{ 
                          cursor: 'pointer', 
                          background: 'transparent', 
                          border: '1px solid #cbd5e1', 
                          padding: '8px 20px', 
                          borderRadius: '9999px', 
                          fontSize: '0.85rem', 
                          fontWeight: '600', 
                          color: '#475569', 
                          transition: 'all 0.2s ease' 
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-nav-login" id="btn-login">Log in</Link>
                  <Link to="/signup" className="btn-nav-signup" id="btn-signup">Sign Up</Link>
                </>
              )}
            </div>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </nav>
  );
}

export default Navbar;