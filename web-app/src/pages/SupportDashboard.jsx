import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Wallet,
    Users,
    Building2,
    Lock,
    Bell,
    Headphones,
    LogOut,
    Package,
    ArrowRight
} from 'lucide-react';
import { AuthContext } from '../AuthContext';
import { ROUTES } from '../utils/routes';
import SupportTab from '../components/tabs/SupportTab';
import { getAvatarUrl } from '../utils/getAvatarUrl';

const TABS = [
    { id: 'OVERVIEW', label: 'Analytics & Overview', icon: TrendingUp, path: ROUTES.MY_ACCOUNT },
    { id: 'WALLET', label: 'Wallet & Ledger', icon: Wallet, path: ROUTES.WALLET },
    { id: 'ADDRESS_BOOK', label: 'Address Book', icon: Users, path: ROUTES.MY_ACCOUNT },
    { id: 'PROFILE', label: 'Business Profile', icon: Building2, path: ROUTES.MY_ACCOUNT },
    { id: 'SECURITY', label: 'Security & Access', icon: Lock, path: ROUTES.MY_ACCOUNT },
    { id: 'NOTIFICATIONS', label: 'Preferences', icon: Bell, path: ROUTES.MY_ACCOUNT },
    { id: 'SUPPORT', label: 'Support Desk', icon: Headphones, path: '/support' },
];

export default function SupportDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const activeTab = 'SUPPORT';

    return (
        <main className="w-full px-4 py-32 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                        Help & Support
                    </h1>
                    <p className="mt-2 text-base font-medium text-slate-500">
                        Get assistance with your orders, account, or any technical queries.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-600 transition-all hover:border-red-600 hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                {/* Sidebar */}
                <div className="lg:col-span-3">
                    <div className="sticky top-24 space-y-3">
                        <div className="mb-8 flex items-center gap-4 rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-xl font-black shadow-inner">
                                {user?.avatar ? (
                                    <img
                                        src={getAvatarUrl(user.avatar)}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    user?.companyName?.charAt(0).toUpperCase() ||
                                    user?.name?.charAt(0).toUpperCase() ||
                                    'U'
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-lg font-black">
                                    {user?.companyName || user?.name}
                                </p>
                                <p className="truncate text-sm font-medium text-slate-400">
                                    {user?.role}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => navigate(tab.path, { state: { tab: tab.id } })}
                                        className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-sm font-black transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                    >
                                        <Icon
                                            size={20}
                                            className={isActive ? 'text-indigo-600' : 'text-slate-400'}
                                        />
                                        {tab.label}
                                    </button>
                                );
                            })}
                            
                            <Link
                                to="/orders?tab=HISTORY"
                                className="group flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-sm font-black text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-900"
                            >
                                <div className="flex items-center gap-4">
                                    <Package
                                        size={20}
                                        className="text-slate-400 group-hover:text-indigo-600"
                                    />
                                    Order Tracking
                                </div>
                                <ArrowRight
                                    size={14}
                                    className="opacity-0 transition-opacity group-hover:opacity-100"
                                />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SupportTab />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
