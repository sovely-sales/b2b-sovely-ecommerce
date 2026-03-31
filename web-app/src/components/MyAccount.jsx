import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User,
    Mail,
    Shield,
    Calendar,
    LogOut,
    Wallet,
    Package,
    ArrowLeft,
    ArrowRight, 
    Building2,
    FileText,
    AlertCircle,
    BadgeCheck,
    Phone,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
} from 'lucide-react';
import { AuthContext } from '../AuthContext';
import LoadingScreen from './LoadingScreen';
import ResellerAnalytics from './ResellerAnalytics';

const MyAccount = () => {
    const { user, loading, logout, isKycApproved } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (loading) return <LoadingScreen />;
    if (!user) return null;

    const getKycBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase">
                        <CheckCircle size={14} /> KYC Approved
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[10px] font-extrabold tracking-wider text-red-700 uppercase">
                        <XCircle size={14} /> KYC Rejected
                    </span>
                );
            case 'PENDING':
            default:
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold tracking-wider text-amber-700 uppercase">
                        <Clock size={14} /> KYC Pending Review
                    </span>
                );
        }
    };

    return (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 font-sans text-slate-900 sm:px-6 lg:px-8 lg:py-12">
            <Link
                to="/"
                className="group mb-6 inline-flex items-center gap-3 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 transition-transform group-hover:-translate-x-1">
                    <ArrowLeft size={16} />
                </div>
                Back to Home
            </Link>

            {}
            {!isKycApproved && user.role !== 'ADMIN' && (
                <div className="mb-6 flex animate-[fadeIn_0.3s_ease-out] flex-col items-start justify-between gap-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-sm sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={24} />
                        <div>
                            <h4 className="text-lg font-extrabold">
                                {user.kycStatus === 'REJECTED'
                                    ? 'Action Required: KYC Rejected'
                                    : 'Action Required: Complete your Business KYC'}
                            </h4>
                            <p className="mt-1 max-w-2xl text-sm font-medium text-amber-700">
                                {user.kycStatus === 'REJECTED'
                                    ? 'Your recent KYC application was rejected. Please review the requirements and submit updated documentation.'
                                    : 'Your account is missing verified business details. You can browse the wholesale catalog, but you cannot place orders or claim GST inputs until approved.'}
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/kyc"
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-md"
                    >
                        {user.kycStatus === 'REJECTED'
                            ? 'Update KYC Details'
                            : 'Submit KYC Details'}{' '}
                        <ArrowRight size={16} />
                    </Link>
                </div>
            )}

            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
                {}
                <div className="relative overflow-hidden bg-slate-900 px-8 py-10">
                    <div className="absolute -top-24 -right-12 h-64 w-64 rounded-full bg-emerald-500/20 mix-blend-screen blur-3xl"></div>
                    <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/20 mix-blend-screen blur-3xl"></div>

                    <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 opacity-40 blur-sm"></div>
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-700 text-4xl font-black text-white shadow-xl">
                                    {user.companyName?.charAt(0).toUpperCase() ||
                                        user.name?.charAt(0).toUpperCase() ||
                                        'B'}
                                </div>
                            </div>
                            <div className="text-white">
                                <h1 className="mb-1 flex items-center gap-3 text-3xl font-extrabold tracking-tight">
                                    {user.companyName || user.name}
                                    {isKycApproved && (
                                        <BadgeCheck
                                            size={28}
                                            className="text-emerald-400"
                                            title="Verified Reseller"
                                        />
                                    )}
                                </h1>
                                <p className="flex items-center gap-2 font-medium text-slate-300">
                                    <Mail size={16} /> {user.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end">
                            <span className="mb-2 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Platform Access
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-1.5 text-sm font-extrabold tracking-wider text-emerald-300 uppercase">
                                {user.role === 'ADMIN' ? 'Administrator' : 'Verified B2B Buyer'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-3">
                    {}
                    <div className="space-y-8 lg:col-span-2">
                        {}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                                    <Building2 size={24} className="text-slate-400" /> Business
                                    Identity
                                </h3>
                                {getKycBadge(user.kycStatus)}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-transform hover:-translate-y-1 hover:shadow-md">
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        Registered Company
                                    </span>
                                    <span className="truncate text-lg font-black text-slate-900">
                                        {user.companyName || 'Not Provided'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-transform hover:-translate-y-1 hover:shadow-md">
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        Verified GSTIN
                                    </span>
                                    <span className="truncate font-mono font-bold text-slate-900">
                                        {user.gstin || 'None Provided'}
                                    </span>
                                </div>
                                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-transform hover:-translate-y-1 hover:shadow-md sm:col-span-2">
                                    <MapPin size={20} className="mt-0.5 shrink-0 text-slate-400" />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            Primary Dispatch Address
                                        </span>
                                        <span className="font-bold text-slate-900">
                                            {user.billingAddress?.street ? (
                                                `${user.billingAddress.street}, ${user.billingAddress.city}, ${user.billingAddress.state} - ${user.billingAddress.zip}`
                                            ) : (
                                                <span className="text-amber-600">
                                                    No address verified via KYC. Wholesale orders
                                                    cannot be routed.
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {}
                        <div>
                            <h3 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-slate-900">
                                <User size={24} className="text-slate-400" /> Account Contact
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                        <Phone size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            Mobile Number
                                        </span>
                                        <span className="block font-bold text-slate-900">
                                            {user.phoneNumber || 'Not Linked'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            Member Since
                                        </span>
                                        <span className="block font-bold text-slate-900">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-8">
                        <h3 className="mb-6 text-xl font-extrabold text-slate-900">
                            Procurement Tools
                        </h3>

                        <Link
                            to="/wallet"
                            className="group flex w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 transition-all hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                                    <Wallet size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900">Corporate Wallet</p>
                                    <p className="text-xs font-medium text-slate-500">
                                        Balance: ₹
                                        {user.walletBalance?.toLocaleString('en-IN') || '0'}
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/orders"
                            className="group flex w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 transition-all hover:-translate-y-1 hover:border-slate-900 hover:shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-slate-100 p-2 text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                                    <Package size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900">Order Management</p>
                                    <p className="text-xs font-medium text-slate-500">
                                        Track shipments & NDRs
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/invoices"
                            className="group flex w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 transition-all hover:-translate-y-1 hover:border-indigo-500 hover:shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                                    <FileText size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900">Tax & Invoices</p>
                                    <p className="text-xs font-medium text-slate-500">
                                        Download GST records
                                    </p>
                                </div>
                            </div>
                        </Link>

                        {user.role === 'ADMIN' && (
                            <Link
                                to="/admin"
                                className="group mt-8 flex w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 transition-all hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                                        <Shield size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900">Admin Console</p>
                                        <p className="text-xs font-medium text-slate-500">
                                            Platform telemetry
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>

                {isKycApproved && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-8">
                        <div className="mb-4">
                            <h2 className="text-2xl font-black text-slate-900">Performance Hub</h2>
                            <p className="text-sm text-slate-500">
                                Track your margins and logistics health.
                            </p>
                        </div>
                        <ResellerAnalytics />
                    </div>
                )}

                <div className="flex justify-center border-t border-slate-100 bg-slate-50 p-6">
                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-2 rounded-full border border-red-200 bg-white px-8 py-3 text-sm font-bold text-red-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg"
                    >
                        <LogOut size={16} className="transition-transform group-hover:scale-110" />
                        Secure Sign Out
                    </button>
                </div>
            </div>
        </main>
    );
};

export default MyAccount;
