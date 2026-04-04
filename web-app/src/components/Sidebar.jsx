import React, { useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../AuthContext';
import api from '../utils/api';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getAvatarUrl } from '../utils/getAvatarUrl';
import {
    Home,
    UploadCloud,
    FileText,
    Package,
    Wallet,
    Settings,
    Building2,
    X,
    ShieldAlert,
    ShieldCheck,
    Shield,
    Clock,
    LogOut,
} from 'lucide-react';

const sidebarVariants = {
    hidden: { x: '-100%', transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' } },
    visible: { x: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' } },
};

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data.data;
        },
    });

    const handleLogout = async () => {
        await logout();
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        onClose();
        navigate('/login');
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Helper for dynamic KYC badging
    const getKycBadge = () => {
        if (!user) return null;
        if (user.kycStatus === 'APPROVED') {
            return (
                <span className="mt-1 flex w-fit items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-700 uppercase">
                    <ShieldCheck size={10} /> GST Verified
                </span>
            );
        }
        if (user.kycStatus === 'PENDING') {
            return (
                <span className="mt-1 flex w-fit items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 uppercase">
                    <Clock size={10} /> Pending Review
                </span>
            );
        }
        return (
            <span className="mt-1 flex w-fit items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-red-700 uppercase">
                <ShieldAlert size={10} /> Action Required
            </span>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex font-sans">
                    {}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {}
                    <motion.aside
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="relative flex w-[85vw] max-w-[320px] flex-col bg-white shadow-2xl"
                    >
                        {}
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-3">
                                <img
                                    src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                                    alt="Sovely Logo"
                                    className="h-6 w-auto"
                                />
                                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                                    Sovely{' '}
                                    <span className="text-sm font-semibold text-slate-500">
                                        B2B
                                    </span>
                                </span>
                            </div>
                            <button
                                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                onClick={onClose}
                                aria-label="Close sidebar"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {}
                        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6">
                            {}
                            {user && user.role === 'ADMIN' && (
                                <div className="mb-8">
                                    <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        Platform Management
                                    </h3>
                                    <ul className="space-y-1">
                                        <li>
                                            <Link
                                                to="/admin"
                                                onClick={onClose}
                                                className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
                                            >
                                                <Shield size={18} /> Admin Console
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            )}

                            {}
                            <div className="mb-8">
                                <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Procurement Portal
                                </h3>
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            to="/"
                                            onClick={onClose}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <Home
                                                size={18}
                                                className="text-slate-400 group-hover:text-slate-700"
                                            />{' '}
                                            Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/quick-order"
                                            onClick={onClose}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <UploadCloud
                                                size={18}
                                                className="text-slate-400 group-hover:text-slate-700"
                                            />{' '}
                                            Quick Order Upload
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/invoices"
                                            onClick={onClose}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <FileText
                                                size={18}
                                                className="text-slate-400 group-hover:text-slate-700"
                                            />{' '}
                                            My Invoices & Tax
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/orders"
                                            onClick={onClose}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <Package
                                                size={18}
                                                className="text-slate-400 group-hover:text-slate-700"
                                            />{' '}
                                            Orders & Tracking
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* NEW: Categories Section for Mobile */}
                            <div className="mb-8">
                                <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Browse Categories
                                </h3>
                                <div className="grid grid-cols-2 gap-2 px-1">
                                    {dbCategories.slice(0, 10).map((cat) => {
                                        const { Icon, iconColor } = getCategoryIcon(cat.name);
                                        return (
                                            <button
                                                key={cat._id}
                                                onClick={() => {
                                                    onClose();
                                                    navigate(
                                                        `/search?category=${encodeURIComponent(cat.name)}`
                                                    );
                                                }}
                                                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-white hover:shadow-sm"
                                            >
                                                <div
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm"
                                                    style={{ color: iconColor }}
                                                >
                                                    <Icon size={16} />
                                                </div>
                                                <span className="truncate text-center text-[10px] font-bold text-slate-700">
                                                    {cat.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Business Settings */}
                            <div>
                                <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Platform & Wallet
                                </h3>
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            to="/wallet"
                                            onClick={onClose}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <Wallet
                                                size={18}
                                                className="text-slate-400 group-hover:text-slate-700"
                                            />{' '}
                                            Wallet & Credit
                                        </Link>
                                    </li>

                                    <li>
                                        <Link
                                            to="/my-account"
                                            onClick={onClose}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <Building2
                                                size={18}
                                                className="text-slate-400 group-hover:text-slate-700"
                                            />{' '}
                                            Dashboard & Profile
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/account/settings"
                                            onClick={onClose}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <Settings
                                                size={18}
                                                className="text-slate-400 group-hover:text-slate-700"
                                            />{' '}
                                            Account Preferences
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {}
                        <div className="shrink-0 border-t border-slate-200 bg-white p-5">
                            {user ? (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                            {user?.avatar ? (
                                                <img
                                                    src={getAvatarUrl(user.avatar)}
                                                    alt="Avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-slate-400">
                                                    {user.companyName
                                                        ? user.companyName.charAt(0).toUpperCase()
                                                        : 'B'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="truncate text-sm font-bold text-slate-900">
                                                {user.companyName || user.name}
                                            </span>
                                            {getKycBadge()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="shrink-0 rounded-md p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                        title="Log Out"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <p className="mb-3 text-center text-xs font-semibold text-slate-500">
                                        Ready to scale your sourcing?
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            to="/login"
                                            onClick={onClose}
                                            className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            Business Login
                                        </Link>
                                        <Link
                                            to="/signup"
                                            onClick={onClose}
                                            className="flex w-full items-center justify-center rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
                                        >
                                            Apply for Wholesale
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}

export default Sidebar;
