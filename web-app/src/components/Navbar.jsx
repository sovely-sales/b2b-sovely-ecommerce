import { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar({ onToggleSidebar }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <span className="logo-icon">🛒</span>
              <span className="logo-text">Sovely</span>
            </a>
          </div>
          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <li><a href="#categories" className="nav-link">Category <span className="nav-arrow">▾</span></a></li>
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
            <Link to="/login" className="btn-nav-login" id="btn-login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Log in</Link>
            <Link to="/signup" className="btn-nav-signup" id="btn-signup" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Sign Up</Link>
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
