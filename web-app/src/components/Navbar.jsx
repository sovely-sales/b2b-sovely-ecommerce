import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const categories = [
  { name: 'Electronics', emoji: '💻', color: '#D1FAE5' },
  { name: 'Home Decor', emoji: '🖼️', color: '#E0E7FF' },
  { name: 'Kitchen', emoji: '🍳', color: '#FFF7ED' },
  { name: 'Fitness', emoji: '🏋️', color: '#DCFCE7' },
  { name: 'Furniture', emoji: '🪑', color: '#F3E8FF' },
  { name: 'Beauty', emoji: '💄', color: '#FCE7F3' },
  { name: 'Hand Bags', emoji: '👜', color: '#FEE2E2' },
  { name: 'Sneakers', emoji: '👟', color: '#FEF3C7' },
  { name: 'Watches', emoji: '⌚', color: '#F1F5F9' },
  { name: 'Jewellery', emoji: '💍', color: '#FDF4FF' },
  { name: 'Pet Supplies', emoji: '🐾', color: '#FEF9C3' },
  { name: 'Toys', emoji: '🧸', color: '#EDE9FE' },
  { name: 'Books', emoji: '📚', color: '#DBEAFE' },
  { name: 'Travel', emoji: '✈️', color: '#F9FAFB' },
];

function Navbar({ onToggleSidebar, onSelectCategory }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const dropRef = useRef(null);
  const hoverTimeout = useRef(null);

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
            <a href="#" className="navbar-logo">
              <img src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png" alt="Sovely Logo" className="logo-image" />
              <span className="logo-text">Sovely</span>
            </a>
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

              {/* Mega dropdown */}
              <div className={`cat-dropdown ${catDropOpen ? 'cat-dropdown-open' : ''}`} role="menu">
                <div className="cat-dropdown-grid">
                  {categories.map((cat, i) => (
                    <a
                      href="#products"
                      className="cat-dropdown-item"
                      key={i}
                      onClick={() => {
                        setCatDropOpen(false);
                        if (onSelectCategory) onSelectCategory(cat.name);
                      }}
                      role="menuitem"
                    >
                      <span
                        className="cat-dropdown-icon"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.emoji}
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
            <button className="nav-icon-btn" aria-label="Wishlist">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span className="nav-badge">0</span>
            </button>
            <button className="nav-icon-btn" aria-label="Cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path>
                <path d="M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="nav-badge">2</span>
            </button>

            <div className="nav-auth-buttons">
              <Link to="/login" className="btn-nav-login" id="btn-login">Log in</Link>
              <Link to="/signup" className="btn-nav-signup" id="btn-signup">Sign Up</Link>
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
    </nav>
  );
}

export default Navbar;
