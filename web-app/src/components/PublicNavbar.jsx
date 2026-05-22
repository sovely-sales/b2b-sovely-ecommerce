import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';
import { LayoutGrid, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function PublicNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/90 shadow-sm backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {}
                <div className="flex items-center gap-4 md:gap-8">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-1 text-slate-600 transition-colors hover:text-indigo-600 md:hidden"
                        aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <Link to={ROUTES.HOME} className="group flex items-center gap-2">
                        <img
                            src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                            alt="Sovely Logo"
                            className="h-7 w-auto transition-transform group-hover:scale-105"
                        />
                        <span className="text-xl font-black tracking-tight text-slate-900">
                            Sovely
                        </span>
                    </Link>

                    <div className="hidden items-center gap-6 md:flex">
                        <Link
                            to={ROUTES.CATALOG}
                            className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-indigo-600"
                        >
                            <LayoutGrid size={18} /> Catalog
                        </Link>
                        <Link
                            to={ROUTES.SEARCH}
                            className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-indigo-600"
                        >
                            <Search size={18} /> Search
                        </Link>
                    </div>
                </div>

                {}
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link
                        to={ROUTES.LOGIN}
                        className="hidden text-sm font-bold text-slate-600 transition-colors hover:text-slate-900 sm:block"
                    >
                        Log in
                    </Link>
                    <Link
                        to={ROUTES.CONTACT_US}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800"
                    >
                        Request Access
                    </Link>
                </div>
            </div>

            {}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-200/50 bg-white px-4 py-4 shadow-lg md:hidden"
                    >
                        <div className="flex flex-col gap-4">
                            <Link
                                to={ROUTES.CATALOG}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-indigo-600"
                            >
                                <LayoutGrid size={18} /> Catalog
                            </Link>
                            <Link
                                to={ROUTES.SEARCH}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-indigo-600"
                            >
                                <Search size={18} /> Search
                            </Link>
                            <div className="my-2 h-px w-full bg-slate-100" />
                            <Link
                                to={ROUTES.LOGIN}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-indigo-600 sm:hidden"
                            >
                                Log in
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

export default PublicNavbar;
