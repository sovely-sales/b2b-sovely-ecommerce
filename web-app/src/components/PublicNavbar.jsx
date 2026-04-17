import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';
import { LayoutGrid, Search } from 'lucide-react';

function PublicNavbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/90 shadow-sm backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {}
                <div className="flex items-center gap-8">
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
                <div className="flex items-center gap-4">
                    <Link
                        to={ROUTES.LOGIN}
                        className="text-sm font-bold text-slate-600 transition-colors hover:text-slate-900"
                    >
                        Log in
                    </Link>
                    <Link
                        to={ROUTES.CONTACT_US}
                        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800"
                    >
                        Request Access
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default PublicNavbar;
