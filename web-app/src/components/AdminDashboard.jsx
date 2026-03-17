import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Users, Package, TrendingUp, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import BulkUpload from './BulkUpload';

import AdminOverview from './admin/AdminOverview';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminUsers from './admin/AdminUsers';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('orders'); 

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <AdminOverview setActiveTab={setActiveTab} />;
            case 'orders': return <AdminOrders />;
            case 'products': return <AdminProducts />;
            case 'bulk-upload': return <BulkUpload />;
            case 'users': return <AdminUsers />;
            default: return <AdminOrders />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 font-sans selection:bg-accent/30 relative">
            <Navbar />

            <div className="flex flex-1 overflow-hidden relative">

                {}
                <motion.aside 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="fixed left-6 top-28 bottom-6 w-64 bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-6 flex flex-col gap-2 z-40 hidden md:flex"
                >
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 px-3">Command Center</h3>
                    {[
                        { id: 'overview', icon: TrendingUp, label: 'Telemetry' },
                        { id: 'orders', icon: ShoppingBag, label: 'Fulfillment' },
                        { id: 'products', icon: Package, label: 'Inventory' },
                        { id: 'bulk-upload', icon: Upload, label: 'Mass Import' },
                        { id: 'users', icon: Users, label: 'User Matrix' }
                    ].map(tab => (
                        <motion.button
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden ${
                                activeTab === tab.id 
                                ? 'text-white shadow-lg shadow-accent/20' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            {}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTabBackground"
                                    className="absolute inset-0 bg-slate-900 rounded-2xl -z-10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-accent relative z-10' : 'text-slate-400'} />
                            <span className="relative z-10">{tab.label}</span>
                        </motion.button>
                    ))}
                </motion.aside>

                {}
                {}
                <main className="flex-1 p-6 lg:p-10 md:ml-72 overflow-y-auto custom-scrollbar">
                    <motion.h2 
                        layoutId="pageTitle"
                        className="text-3xl font-black text-slate-900 tracking-tight capitalize mb-8 drop-shadow-sm"
                    >
                        {activeTab.replace('-', ' ')}
                    </motion.h2>

                    {}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab} 
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
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