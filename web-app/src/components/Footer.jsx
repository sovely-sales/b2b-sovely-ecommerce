function Footer() {
    return (
        <footer className="footer" id="footer">
            <div className="footer-container">
                <div className="footer-top">
                    <div className="footer-brand">
                        <a href="#" className="footer-logo">
                            <img src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png" alt="Sovely Logo" className="logo-image" />
                            <span className="logo-text">Sovely</span>
                        </a>
                        <p className="footer-tagline">
                            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.
                        </p>
                        <div className="footer-social">
                            <a href="#" className="social-link" aria-label="Facebook">📘</a>
                            <a href="#" className="social-link" aria-label="Twitter">🐦</a>
                            <a href="#" className="social-link" aria-label="Instagram">📷</a>
                            <a href="#" className="social-link" aria-label="LinkedIn">💼</a>
                        </div>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Shop</h4>
                        <ul className="footer-links">
                            <li><a href="#">Home & Kitchen</a></li>
                            <li><a href="#">Home Improvement</a></li>
                            <li><a href="#">Health & Personal Care</a></li>
                            <li><a href="#">Industrial & Scientific</a></li>
                        </ul>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">About Us</h4>
                        <ul className="footer-links">
                            <li><a href="#">About Sovely</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">News & Blog</a></li>
                            <li><a href="#">Help</a></li>
                        </ul>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Services</h4>
                        <ul className="footer-links">
                            <li><a href="#">Gift Card</a></li>
                            <li><a href="#">Mobile App</a></li>
                            <li><a href="#">Shipping & Delivery</a></li>
                            <li><a href="#">Order Pickup</a></li>
                        </ul>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Help</h4>
                        <ul className="footer-links">
                            <li><a href="#">Sovely Help</a></li>
                            <li><a href="#">Returns</a></li>
                            <li><a href="#">Track Orders</a></li>
                            <li><a href="#">Contact Us</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-cta-row">
                    <a href="#" className="footer-cta-card">
                        <span className="cta-icon">🏪</span>
                        <span>Become Seller</span>
                    </a>
                    <a href="#" className="footer-cta-card">
                        <span className="cta-icon">🎁</span>
                        <span>Gift Cards</span>
                    </a>
                    <a href="#" className="footer-cta-card">
                        <span className="cta-icon">❓</span>
                        <span>Help Center</span>
                    </a>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copyright">© 2024 Sovely. All rights reserved.</p>

                    <div className="footer-payments">
                        <span className="payment-text">We accept</span>
                        <div className="payment-icons">
                            {/* Visa */}
                            <svg viewBox="0 0 32 20" className="payment-icon" aria-label="Visa">
                                <rect width="32" height="20" rx="4" fill="currentColor" fillOpacity="0.1" />
                                <path d="M11.64 13.91l1.73-10.68h2.79l-1.74 10.68h-2.78zm11.23-10.46c-1.39-.37-3.56-.7-5.11-.7-2.8 0-4.78 1.45-4.79 3.53-.02 1.53 1.42 2.38 2.5 2.89 1.1.53 1.47.87 1.47 1.34-.01.72-.9 1.06-1.74 1.06-1.46 0-2.25-.22-3.46-.73l-.48-.22-.4 2.45c.87.39 2.46.73 4.12.75 3.01 0 4.96-1.45 4.98-3.7-.02-1.24-.76-2.18-2.4-2.94-1-.49-1.61-.83-1.61-1.34.02-.48.55-.99 1.66-.99 1.17-.02 2.01.25 2.65.53l.32.14.41-2.42zm-12.87 0h-2.15c-.53 0-.97.3-.1.18.77l-3.32 7.77-1.49-8.15c-.17-.85-.81-1.47-1.64-1.57l-3.39-.46v.38c.67.14 1.43.34 2.14.71l1.83 8.78h2.9l4.37-10.68zm14.65 10.68l2.25-10.68h-2.39l-1.36 7.42c-.08.38-.17.61-.31.81-.3.45-.88.66-1.49.66h-1.63l.48 2.39h4.45z" fill="currentColor" />
                            </svg>
                            {/* Mastercard */}
                            <svg viewBox="0 0 32 20" className="payment-icon" aria-label="Mastercard">
                                <rect width="32" height="20" rx="4" fill="currentColor" fillOpacity="0.1" />
                                <circle cx="11.5" cy="10" r="6" fill="currentColor" fillOpacity="0.8" />
                                <circle cx="20.5" cy="10" r="6" fill="currentColor" fillOpacity="0.6" />
                                <path d="M16 14.5c1.47-1.07 2.4-2.83 2.4-4.5S17.47 6.57 16 5.5c-1.47 1.07-2.4 2.83-2.4 4.5s.93 3.43 2.4 4.5z" fill="currentColor" fillOpacity="0.8" />
                            </svg>
                            {/* Google Pay */}
                            <svg viewBox="0 0 32 20" className="payment-icon" aria-label="Google Pay">
                                <rect width="32" height="20" rx="4" fill="currentColor" fillOpacity="0.1" />
                                <path d="M12.92 9.08h-4.3v1.86h2.47c-.1 1.05-.8 1.94-1.74 2.22-.49.15-1.01.15-1.5-.01-1.22-.39-2.03-1.52-1.99-2.82.02-1.54 1.34-2.73 2.89-2.58.64.06 1.23.36 1.66.82l1.37-1.34c-1.14-1.12-2.75-1.63-4.35-1.37-1.92.31-3.48 1.83-3.83 3.74-.46 2.5 1.47 4.67 3.99 4.67 2.08 0 3.73-1.29 4.14-3.23.11-.53.11-1.23 0-1.72-.05-.24-.48-.24-1.21-.24zm4.27 1.8v3.13h1.74v-5.2h-1.6l-1.47 2.05-1.46-2.05h-1.6v5.2h1.74v-3.13l.89 1.3h.84l.92-1.3zm3.11.08c-.7-.35-1.24-1-1.37-1.78l1.6-.66c.14.59.65 1.05 1.26 1.13.56.08 1.14-.13 1.41-.62.3-.54-.08-1.09-.72-1.26l-.88-.23c-.76-.2-1.46-.66-1.77-1.39-.33-.78-.14-1.71.49-2.31.57-.54 1.36-.83 2.15-.79 1.04.05 1.96.6 2.45 1.51l-1.55.74c-.2-.55-.78-.93-1.38-.91-.56.02-1.15.28-1.32.83-.16.52.28.91.73 1.03l.97.26c.79.21 1.53.7 1.83 1.48.33.86.08 1.88-.63 2.5-.72.63-1.73.88-2.67.75-.92-.12-1.73-.68-2.19-1.48z" fill="currentColor" />
                            </svg>
                            {/* UPI */}
                            <svg viewBox="0 0 32 20" className="payment-icon" aria-label="UPI">
                                <rect width="32" height="20" rx="4" fill="currentColor" fillOpacity="0.1" />
                                <text x="16" y="14" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor">UPI</text>
                            </svg>
                            {/* Net Banking */}
                            <svg viewBox="0 0 32 20" className="payment-icon" aria-label="Net Banking">
                                <rect width="32" height="20" rx="4" fill="currentColor" fillOpacity="0.1" />
                                <path d="M16 5l-7 4v1h14V9l-7-4zm-5 6v3h2v-3h-2zm4 0v3h2v-3h-2zm4 0v3h2v-3h-2zm-9 4v2h12v-2H10z" fill="currentColor" />
                            </svg>
                            {/* Wallets */}
                            <svg viewBox="0 0 32 20" className="payment-icon" aria-label="Wallets">
                                <rect width="32" height="20" rx="4" fill="currentColor" fillOpacity="0.1" />
                                <path d="M22 10a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2h12a2 2 0 012 2v2zm-3-1a1 1 0 100 2 1 1 0 000-2z" fill="currentColor" />
                                <path d="M20 7v1H10V7h10zM10 13h10v1H10v-1z" fill="currentColor" fillOpacity="0.5" />
                            </svg>
                        </div>
                    </div>

                    <div className="footer-legal">
                        <a href="#">Terms of Service</a>
                        <a href="#">Privacy & Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
