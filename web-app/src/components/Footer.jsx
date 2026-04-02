import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';

function Footer() {
    return (
        <footer
            className="selection:bg-accent/30 bg-slate-950 pt-16 pb-8 font-sans text-slate-400"
            id="footer"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main Links Grid */}
                <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-6 lg:gap-8">
                    {/* Brand Section */}
                    <div className="space-y-6 lg:col-span-2">
                        <Link to={ROUTES.HOME} className="group flex inline-flex items-center gap-3">
                            <div className="rounded-lg bg-white p-1.5 transition-transform group-hover:scale-105">
                                <img
                                    src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                                    alt="Sovely Logo"
                                    className="h-6 w-auto"
                                />
                            </div>
                            <span className="text-2xl font-extrabold tracking-tight text-white">
                                Sovely
                            </span>
                        </Link>
                        <p className="max-w-sm text-sm leading-relaxed font-medium">
                            The standard for B2B procurement and dropshipping. Empowerment for 
                            modern e-commerce entrepreneurs worldwide.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <a
                                href="#"
                                className="hover:border-accent hover:text-accent flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 transition-all hover:-translate-y-1"
                                aria-label="Facebook"
                            >
                                📱
                            </a>
                            <a
                                href="#"
                                className="hover:border-accent hover:text-accent flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 transition-all hover:-translate-y-1"
                                aria-label="Twitter"
                            >
                                🐦
                            </a>
                            <a
                                href="#"
                                className="hover:border-accent hover:text-accent flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 transition-all hover:-translate-y-1"
                                aria-label="Instagram"
                            >
                                📸
                            </a>
                            <a
                                href="#"
                                className="hover:border-accent hover:text-accent flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 transition-all hover:-translate-y-1"
                                aria-label="LinkedIn"
                            >
                                💼
                            </a>
                        </div>
                    </div>

                    {/* Quick Link Groups */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-extrabold tracking-wider text-white uppercase">
                            Shop
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <Link
                                    to={ROUTES.CATEGORY('Electronics')}
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Electronics
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={ROUTES.CATEGORY('Fashion')}
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Fashion
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={ROUTES.CATEGORY('Home & Kitchen')}
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Home & Kitchen
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={ROUTES.CATEGORY('Industrial')}
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Industrial
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-extrabold tracking-wider text-white uppercase">
                            About Us
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <Link
                                    to={ROUTES.HOME}
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    About Sovely
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={ROUTES.CAREERS}
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    News & Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Help Center
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-extrabold tracking-wider text-white uppercase">
                            Services
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <Link
                                    to={ROUTES.SERVICES}
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Our Services
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Mobile App
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Shipping
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Order Pickup
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-extrabold tracking-wider text-white uppercase">
                            Help
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <Link
                                    to="#"
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Sovely Help
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Returns
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={ROUTES.ORDERS}
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Track Orders
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="inline-block transition-all hover:translate-x-1 hover:text-white"
                                >
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Seller Section */}
                <div className="grid grid-cols-1 gap-4 border-t border-slate-900 pt-10 pb-10 md:grid-cols-3">
                    <Link
                        to="#"
                        className="hover:border-accent group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:bg-slate-900"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl transition-transform group-hover:scale-110">
                            🏪
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-white">
                                Become Seller
                            </span>
                            <span className="mt-0.5 block text-xs font-medium text-slate-500">
                                Open your store today
                            </span>
                        </div>
                    </Link>
                    <Link
                        to="#"
                        className="hover:border-accent group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:bg-slate-900"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl transition-transform group-hover:scale-110">
                            🎁
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-white">Gift Cards</span>
                            <span className="mt-0.5 block text-xs font-medium text-slate-500">
                                Perfect for everyone
                            </span>
                        </div>
                    </Link>
                    <Link
                        to="#"
                        className="hover:border-accent group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:bg-slate-900"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl transition-transform group-hover:scale-110">
                            ❓
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-white">Help Center</span>
                            <span className="mt-0.5 block text-xs font-medium text-slate-500">
                                Get support 24/7
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Copyright & Legal */}
                <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-900 pt-6 md:flex-row">
                    <p className="text-xs font-medium">© 2024 Sovely. All rights reserved.</p>

                    <div className="flex items-center gap-3">
                        <span className="mr-2 text-xs font-bold tracking-wider uppercase">
                            We Accept
                        </span>
                        <div className="flex gap-2">
                            {/* Visa */}
                            <svg
                                viewBox="0 0 32 20"
                                className="h-auto w-10 text-slate-600 transition-colors hover:text-white"
                                aria-label="Visa"
                            >
                                <rect
                                    width="32"
                                    height="20"
                                    rx="4"
                                    fill="currentColor"
                                    fillOpacity="0.2"
                                />
                                <path
                                    d="M11.64 13.91l1.73-10.68h2.79l-1.74 10.68h-2.78zm11.23-10.46c-1.39-.37-3.56-.7-5.11-.7-2.8 0-4.78 1.45-4.79 3.53-.02 1.53 1.42 2.38 2.5 2.89 1.1.53 1.47.87 1.47 1.34-.01.72-.9 1.06-1.74 1.06-1.46 0-2.25-.22-3.46-.73l-.48-.22-.4 2.45c.87.39 2.46.73 4.12.75 3.01 0 4.96-1.45 4.98-3.7-.02-1.24-.76-2.18-2.4-2.94-1-.49-1.61-.83-1.61-1.34.02-.48.55-.99 1.66-.99 1.17-.02 2.01.25 2.65.53l.32.14.41-2.42zm-12.87 0h-2.15c-.53 0-.97.3-.1.18.77l-3.32 7.77-1.49-8.15c-.17-.85-.81-1.47-1.64-1.57l-3.39-.46v.38c.67.14 1.43.34 2.14.71l1.83 8.78h2.9l4.37-10.68zm14.65 10.68l2.25-10.68h-2.39l-1.36 7.42c-.08.38-.17.61-.31.81-.3.45-.88.66-1.49.66h-1.63l.48 2.39h4.45z"
                                    fill="currentColor"
                                />
                            </svg>
                            {/* Mastercard */}
                            <svg
                                viewBox="0 0 32 20"
                                className="h-auto w-10 text-slate-600 transition-colors hover:text-white"
                                aria-label="Mastercard"
                            >
                                <rect
                                    width="32"
                                    height="20"
                                    rx="4"
                                    fill="currentColor"
                                    fillOpacity="0.2"
                                />
                                <circle
                                    cx="11.5"
                                    cy="10"
                                    r="6"
                                    fill="currentColor"
                                    fillOpacity="0.9"
                                />
                                <circle
                                    cx="20.5"
                                    cy="10"
                                    r="6"
                                    fill="currentColor"
                                    fillOpacity="0.7"
                                />
                                <path
                                    d="M16 14.5c1.47-1.07 2.4-2.83 2.4-4.5S17.47 6.57 16 5.5c-1.47 1.07-2.4 2.83-2.4 4.5s.93 3.43 2.4 4.5z"
                                    fill="currentColor"
                                    fillOpacity="0.8"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-medium">
                        <Link to="/terms" className="transition-colors hover:text-white">
                            Terms of Service
                        </Link>
                        <Link to={ROUTES.PRIVACY} className="transition-colors hover:text-white">
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
