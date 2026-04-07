import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';

function PublicNavbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/90 shadow-sm backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {}
                <Link to={ROUTES.HOME} className="group flex items-center gap-2">
                    <img
                        src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                        alt="Sovely Logo"
                        className="h-8 w-auto transition-transform group-hover:scale-105"
                    />
                    <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Sovely <span className="text-sm font-medium text-emerald-600">B2B</span>
                    </span>
                </Link>

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
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
                    >
                        Request Access
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default PublicNavbar;
