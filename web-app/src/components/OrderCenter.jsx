import React, { useState, useContext, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, UploadCloud, Package, FileText, ArrowRight } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import { useCartStore } from '../store/cartStore';
import { useNavigate } from 'react-router-dom';

import Orders from './Orders';
import Invoices from './Invoices';
import QuickOrderTab from './tabs/QuickOrderTab';
import ActiveCartTab from './tabs/ActiveCartTab';

const TABS = [
    { id: 'CART', label: 'Active Cart', icon: ShoppingCart },
    { id: 'QUICK_ORDER', label: 'Bulk CSV Upload', icon: UploadCloud },
    { id: 'HISTORY', label: 'Order Tracking', icon: Package },
    { id: 'INVOICES', label: 'Tax & Invoices', icon: FileText },
];

export default function OrderCenter() {
    const [activeTab, setActiveTab] = useState('CART');
    const { user } = useContext(AuthContext);

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Operations Hub
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Manage your active cart, bulk uploads, tracking, and tax invoices.
                    </p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                        Wallet
                    </span>
                    <span className="text-lg font-black text-slate-900">
                        ₹{(user?.walletBalance || 0).toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            {}
            <div className="hide-scrollbar mb-8 flex overflow-x-auto border-b border-slate-200">
                <div className="flex gap-6">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex items-center gap-2 pb-4 text-sm font-bold transition-colors ${
                                    isActive
                                        ? 'text-indigo-600'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Icon
                                    size={18}
                                    className={
                                        isActive
                                            ? 'text-indigo-600'
                                            : 'text-slate-400 group-hover:text-slate-600'
                                    }
                                />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute right-0 -bottom-[1px] left-0 h-0.5 bg-indigo-600"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {}
            <div className="min-h-[50vh]">
                {}
                <div className={activeTab === 'CART' ? 'block' : 'hidden'}>
                    <ActiveCartTab />
                </div>
                <div className={activeTab === 'QUICK_ORDER' ? 'block' : 'hidden'}>
                    <QuickOrderTab />
                </div>
                <div className={activeTab === 'HISTORY' ? 'block' : 'hidden'}>
                    {}
                    <div className="-mt-8">
                        <Orders />
                    </div>
                </div>
                <div className={activeTab === 'INVOICES' ? 'block' : 'hidden'}>
                    <div className="-mt-8">
                        <Invoices />
                    </div>
                </div>
            </div>
        </main>
    );
}
