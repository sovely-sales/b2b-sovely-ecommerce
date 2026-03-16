function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 font-sans selection:bg-accent/30" id="footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
                    {/* Brand Col */}
                    <div className="lg:col-span-2 space-y-6">
                        <a href="#" className="flex items-center gap-3 group inline-flex">
                            <div className="bg-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                                <img src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png" alt="Sovely Logo" className="h-6 w-auto" />
                            </div>
                            <span className="font-extrabold text-2xl tracking-tight text-white">Sovely</span>
                        </a>
                        <p className="text-sm leading-relaxed max-w-sm font-medium">
                            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-accent hover:text-accent hover:-translate-y-1 transition-all" aria-label="Facebook">📱</a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-accent hover:text-accent hover:-translate-y-1 transition-all" aria-label="Twitter">🐦</a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-accent hover:text-accent hover:-translate-y-1 transition-all" aria-label="Instagram">📸</a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-accent hover:text-accent hover:-translate-y-1 transition-all" aria-label="LinkedIn">💼</a>
                        </div>
                    </div>

                    {/* Link Cols */}
                    <div className="space-y-6">
                        <h4 className="text-white font-extrabold tracking-wider uppercase text-xs">Shop</h4>
                        <ul className="space-y-3 font-medium text-sm">
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Home & Kitchen</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Home Improvement</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Health & Care</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Industrial</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-white font-extrabold tracking-wider uppercase text-xs">About Us</h4>
                        <ul className="space-y-3 font-medium text-sm">
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">About Sovely</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Careers</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">News & Blog</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Help Center</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-white font-extrabold tracking-wider uppercase text-xs">Services</h4>
                        <ul className="space-y-3 font-medium text-sm">
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Gift Card</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Mobile App</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Shipping</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Order Pickup</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-white font-extrabold tracking-wider uppercase text-xs">Help</h4>
                        <ul className="space-y-3 font-medium text-sm">
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Sovely Help</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Returns</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Track Orders</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">Contact Us</a></li>
                        </ul>
                    </div>
                </div>

                {/* CTA Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10 border-t border-slate-900 pb-10">
                    <a href="#" className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-accent hover:bg-slate-900 transition-all group">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🏪</div>
                        <div>
                            <span className="block text-white font-bold text-sm">Become Seller</span>
                            <span className="block text-xs font-medium mt-0.5 text-slate-500">Open your store today</span>
                        </div>
                    </a>
                    <a href="#" className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-accent hover:bg-slate-900 transition-all group">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎁</div>
                        <div>
                            <span className="block text-white font-bold text-sm">Gift Cards</span>
                            <span className="block text-xs font-medium mt-0.5 text-slate-500">Perfect for everyone</span>
                        </div>
                    </a>
                    <a href="#" className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-accent hover:bg-slate-900 transition-all group">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">❓</div>
                        <div>
                            <span className="block text-white font-bold text-sm">Help Center</span>
                            <span className="block text-xs font-medium mt-0.5 text-slate-500">Get support 24/7</span>
                        </div>
                    </a>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-medium">© 2024 Sovely. All rights reserved.</p>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider mr-2">We Accept</span>
                        <div className="flex gap-2">
                            {/* Visa */}
                            <svg viewBox="0 0 32 20" className="w-10 h-auto text-slate-600 hover:text-white transition-colors" aria-label="Visa">
                                <rect width="32" height="20" rx="4" fill="currentColor" fillOpacity="0.2" />
                                <path d="M11.64 13.91l1.73-10.68h2.79l-1.74 10.68h-2.78zm11.23-10.46c-1.39-.37-3.56-.7-5.11-.7-2.8 0-4.78 1.45-4.79 3.53-.02 1.53 1.42 2.38 2.5 2.89 1.1.53 1.47.87 1.47 1.34-.01.72-.9 1.06-1.74 1.06-1.46 0-2.25-.22-3.46-.73l-.48-.22-.4 2.45c.87.39 2.46.73 4.12.75 3.01 0 4.96-1.45 4.98-3.7-.02-1.24-.76-2.18-2.4-2.94-1-.49-1.61-.83-1.61-1.34.02-.48.55-.99 1.66-.99 1.17-.02 2.01.25 2.65.53l.32.14.41-2.42zm-12.87 0h-2.15c-.53 0-.97.3-.1.18.77l-3.32 7.77-1.49-8.15c-.17-.85-.81-1.47-1.64-1.57l-3.39-.46v.38c.67.14 1.43.34 2.14.71l1.83 8.78h2.9l4.37-10.68zm14.65 10.68l2.25-10.68h-2.39l-1.36 7.42c-.08.38-.17.61-.31.81-.3.45-.88.66-1.49.66h-1.63l.48 2.39h4.45z" fill="currentColor" />
                            </svg>
                            {/* Mastercard */}
                            <svg viewBox="0 0 32 20" className="w-10 h-auto text-slate-600 hover:text-white transition-colors" aria-label="Mastercard">
                                <rect width="32" height="20" rx="4" fill="currentColor" fillOpacity="0.2" />
                                <circle cx="11.5" cy="10" r="6" fill="currentColor" fillOpacity="0.9" />
                                <circle cx="20.5" cy="10" r="6" fill="currentColor" fillOpacity="0.7" />
                                <path d="M16 14.5c1.47-1.07 2.4-2.83 2.4-4.5S17.47 6.57 16 5.5c-1.47 1.07-2.4 2.83-2.4 4.5s.93 3.43 2.4 4.5z" fill="currentColor" fillOpacity="0.8" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-medium">
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
