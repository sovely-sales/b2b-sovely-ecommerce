import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Package,
    TrendingUp,
    Upload,
    FileText,
    ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import BulkUpload from './BulkUpload';


import AdminOverview from './admin/AdminOverview';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminUsers from './admin/AdminUsers';
import AdminInvoices from './admin/AdminInvoices';

const ADMIN_TABS = [
    { id: 'overview', icon: TrendingUp, label: 'Overview' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'users', icon: ShieldCheck, label: 'Users & Resellers' },
    { id: 'invoices', icon: FileText, label: 'Invoices' },
    { id: 'bulk-upload', icon: Upload, label: 'Mass Import (CSV)' },
];

const AdminDashboard = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'overview');

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <AdminOverview setActiveTab={setActiveTab} />;
            case 'orders':
                return <AdminOrders />;
            case 'products':
                return <AdminProducts />;
            case 'bulk-upload':
                return <BulkUpload />;
            case 'users':
                return <AdminUsers />;
            case 'invoices':
                return <AdminInvoices />;
            default:
                return <AdminOrders />;
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col bg-slate-50/50 font-sans selection:bg-slate-900/30">
            <Navbar />

            <div className="relative flex flex-1 overflow-hidden">
                {}
                <motion.aside
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    className="fixed top-28 bottom-6 left-6 z-40 hidden w-64 flex-col gap-2 rounded-3xl border border-white bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl md:flex"
                >
                    <h3 className="mb-4 px-3 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                        B2B Command Center
                    </h3>
                    {ADMIN_TABS.map((tab) => (
                        <motion.button
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                                activeTab === tab.id
                                    ? 'text-white shadow-lg shadow-slate-900/20'
                                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                            }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabBackground"
                                    className="absolute inset-0 -z-10 rounded-2xl bg-slate-900"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <tab.icon
                                size={18}
                                className={
                                    activeTab === tab.id
                                        ? 'relative z-10 text-emerald-400'
                                        : 'text-slate-400'
                                }
                            />
                            <span className="relative z-10">{tab.label}</span>
                        </motion.button>
                    ))}
                </motion.aside>

                {}
                <main className="custom-scrollbar flex-1 overflow-y-auto p-6 md:ml-72 lg:p-10">
                    <motion.h2
                        layoutId="pageTitle"
                        className="mb-8 text-3xl font-black tracking-tight text-slate-900 capitalize drop-shadow-sm"
                    >
                        {ADMIN_TABS.find((t) => t.id === activeTab)?.label || 'Admin Dashboard'}
                    </motion.h2>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-full"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
