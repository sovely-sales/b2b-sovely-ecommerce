import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';

const PublicLayout = () => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans selection:bg-emerald-500/30">
            <PublicNavbar />
            {}
            <main className="relative z-0 min-h-[100dvh] w-full flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
