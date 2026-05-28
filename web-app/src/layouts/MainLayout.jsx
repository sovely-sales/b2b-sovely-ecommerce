import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans selection:bg-indigo-500/30">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            {}
            <main className="relative z-0 flex w-full flex-1 flex-col">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
