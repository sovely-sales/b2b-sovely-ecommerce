import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    Bell,
    Building2,
    ShieldCheck,
    Camera,
    TrendingUp,
    Trash2,
    X,
    LogOut,
    AlertCircle,
    Wallet,
    MapPin,
    Plus,
    Edit3,
    Mail,
    Phone,
    Globe,
    FileText,
    CheckCircle2,
    HelpCircle,
} from 'lucide-react';
import { AuthContext } from '../AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../utils/getAvatarUrl';
import AddressBookTab from './tabs/AddressBookTab';
import { Users } from 'lucide-react';
import ResellerAnalytics from './ResellerAnalytics';
import WalletTab from './tabs/WalletTab';

const TABS = [
    { id: 'OVERVIEW', label: 'Analytics & Overview', icon: TrendingUp },
    { id: 'WALLET', label: 'Wallet & Ledger', icon: Wallet },
    { id: 'ADDRESS_BOOK', label: 'Address Book', icon: Users },
    { id: 'PROFILE', label: 'Business Profile', icon: Building2 },
    { id: 'SECURITY', label: 'Security & Access', icon: Lock },
    { id: 'NOTIFICATIONS', label: 'Preferences', icon: Bell },
];

export default function AccountHub() {
    const { user, logout, refreshUser } = useContext(AuthContext);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'OVERVIEW');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            // Optional: clear state after reading so manual clicks don't get overwritten on re-renders
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarError, setAvatarError] = useState(false);

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        companyName: '',
        gstin: '',
        panNumber: '',
        entityType: '',
        industry: '',
        website: '',
        yearEstablished: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        emailNotifications: true,
        orderSms: true,
        promotionalEmails: false,
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
    });

    // --- Branch Modal State ---
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [editingBranchId, setEditingBranchId] = useState(null);
    const [branchData, setBranchData] = useState({
        branchName: '',
        gstin: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        isPrimary: false,
    });

    // --- Security State ---
    const [securityData, setSecurityData] = useState({ oldPassword: '', newPassword: '' });
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                companyName: user.companyName || '',
                gstin: user.gstin || '',
                panNumber: user.panNumber || '',
                entityType: user.entityType || '',
                industry: user.industry || '',
                website: user.website || '',
                yearEstablished: user.yearEstablished || '',
                street: user.billingAddress?.street || '',
                city: user.billingAddress?.city || '',
                state: user.billingAddress?.state || '',
                zip: user.billingAddress?.zip || '',
                accountName: user.bankDetails?.accountName || '',
                accountNumber: user.bankDetails?.accountNumber || '',
                ifscCode: user.bankDetails?.ifscCode || '',
                bankName: user.bankDetails?.bankName || '',
                emailNotifications: user.emailNotifications ?? true,
                orderSms: user.orderSms ?? true,
                promotionalEmails: user.promotionalEmails ?? false,
            });
            setAvatarPreview(user.avatar || null);
        }
    }, [user]);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        const formData = new FormData();
        formData.append('avatar', file);
        setIsLoading(true);
        try {
            await api.post('/users/avatar', formData);
            toast.success('Photo updated!');
            await refreshUser();
        } catch (error) {
            toast.error('Upload failed');
            setAvatarPreview(user?.avatar || null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.put('/users/profile', {
                name: profileData.name,
                companyName: profileData.companyName,
                gstin: profileData.gstin,
                panNumber: profileData.panNumber,
                entityType: profileData.entityType,
                industry: profileData.industry,
                website: profileData.website,
                yearEstablished: profileData.yearEstablished,
                billingAddress: {
                    street: profileData.street,
                    city: profileData.city,
                    state: profileData.state,
                    zip: profileData.zip,
                },
            });
            toast.success('Profile updated successfully!');
            await refreshUser();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsLoading(false);
        }
    };

    const openBranchModal = (branch = null) => {
        if (branch) {
            setEditingBranchId(branch._id);
            setBranchData({
                ...branch,
                street: branch.address.street,
                city: branch.address.city,
                state: branch.address.state,
                zip: branch.address.zip,
            });
        } else {
            setEditingBranchId(null);
            setBranchData({
                branchName: '',
                gstin: '',
                street: '',
                city: '',
                state: '',
                zip: '',
                isPrimary: false,
            });
        }
        setIsBranchModalOpen(true);
    };

    const handleSaveBranch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                branchName: branchData.branchName,
                gstin: branchData.gstin,
                isPrimary: branchData.isPrimary,
                address: {
                    street: branchData.street,
                    city: branchData.city,
                    state: branchData.state,
                    zip: branchData.zip,
                },
            };
            if (editingBranchId)
                await api.put(`/users/profile/branches/${editingBranchId}`, payload);
            else await api.post('/users/profile/branches', payload);
            toast.success('Branch saved!');
            setIsBranchModalOpen(false);
            await refreshUser();
        } catch (error) {
            toast.error('Failed to save branch.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBranch = async (branchId) => {
        if (!window.confirm('Delete this branch?')) return;
        try {
            await api.delete(`/users/profile/branches/${branchId}`);
            toast.success('Branch removed.');
            await refreshUser();
        } catch (error) {
            toast.error('Failed to delete branch.');
        }
    };

    const handleSecuritySubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.put('/users/security/password', securityData);
            toast.success('Password changed!');
            setSecurityData({ oldPassword: '', newPassword: '' });
        } catch (error) {
            toast.error('Update failed');
        } finally {
            setIsLoading(false);
        }
    };

    const loadSessions = async () => {
        setSessionsLoading(true);
        try {
            const res = await api.get('/auth/sessions');
            setSessions(res.data?.data?.sessions || []);
        } catch (error) {
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'SECURITY') loadSessions();
    }, [activeTab]);

    const handleRevokeSession = async (sessionId, isCurrent) => {
        if (!window.confirm('Sign out device?')) return;
        try {
            await api.delete(`/auth/sessions/${sessionId}`);
            if (isCurrent) return await logout();
            await loadSessions();
        } catch (error) {
            toast.error('Revoke failed');
        }
    };

    const inputClasses =
        'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm outline-none transition-shadow placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed';
    const labelClasses =
        'mb-1.5 block text-[11px] font-black tracking-widest text-slate-500 uppercase';
    const cardClasses = 'rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm';

    return (
        <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
            {}
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                        Command Center
                    </h1>
                    <p className="mt-2 text-base font-medium text-slate-500">
                        Manage your wholesale procurement, dropship operations, and business
                        profile.
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
                {}
                <div className="lg:col-span-3">
                    <div className="sticky top-24 space-y-3">
                        <div className="mb-8 flex items-center gap-4 rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
                            {}
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-black shadow-inner">
                                {user?.companyName?.charAt(0).toUpperCase() ||
                                    user?.name?.charAt(0).toUpperCase() ||
                                    'U'}
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
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-sm font-black transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                    >
                                        <Icon
                                            size={20}
                                            className={
                                                isActive ? 'text-indigo-600' : 'text-slate-400'
                                            }
                                        />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {user?.role === 'ADMIN' && (
                            <div className="mt-6 border-t border-slate-200 pt-6">
                                {}
                                <Link
                                    to="/admin"
                                    className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-sm font-black text-indigo-600 ring-1 ring-indigo-100 transition-all hover:bg-indigo-50"
                                >
                                    <ShieldCheck size={20} /> Admin Dashboard
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'OVERVIEW' && (
                                <div className="space-y-6">
                                    <ResellerAnalytics />
                                </div>
                            )}

                            {activeTab === 'WALLET' && <WalletTab />}
                            {activeTab === 'ADDRESS_BOOK' && <AddressBookTab />}

                            {}
                            {activeTab === 'PROFILE' && (
                                <div className="space-y-8">
                                    {}
                                    <form onSubmit={handleProfileSubmit} className="space-y-8">
                                        {}
                                        <div className={cardClasses}>
                                            <h3 className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-xl font-black text-slate-900">
                                                <Building2 className="text-indigo-500" size={24} />{' '}
                                                Company Overview
                                            </h3>

                                            <div className="mb-8 flex items-center gap-8">
                                                <div
                                                    className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-200 shadow-sm transition-transform hover:scale-105"
                                                    onClick={() =>
                                                        document
                                                            .getElementById('avatar-upload')
                                                            .click()
                                                    }
                                                >
                                                    {avatarPreview ? (
                                                        <img
                                                            src={getAvatarUrl(avatarPreview)}
                                                            alt="Profile"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-3xl font-black text-slate-400">
                                                            {user?.name?.charAt(0).toUpperCase() ||
                                                                'U'}
                                                        </span>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Camera className="text-white" size={24} />
                                                    </div>
                                                    <input
                                                        type="file"
                                                        id="avatar-upload"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleAvatarChange}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900">
                                                        Business Logo
                                                    </h4>
                                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                                        Used on invoices and dispatch labels.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                <div className="lg:col-span-2">
                                                    <label className={labelClasses}>
                                                        Registered Company Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profileData.companyName}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                companyName: e.target.value,
                                                            })
                                                        }
                                                        className={inputClasses}
                                                        placeholder="Infinity Retail Pvt Ltd"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>
                                                        Entity Type
                                                    </label>
                                                    <select
                                                        value={profileData.entityType}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                entityType: e.target.value,
                                                            })
                                                        }
                                                        className={inputClasses}
                                                    >
                                                        <option value="">Select Type</option>
                                                        <option value="Proprietorship">
                                                            Sole Proprietorship
                                                        </option>
                                                        <option value="Partnership">
                                                            Partnership
                                                        </option>
                                                        <option value="LLP">LLP</option>
                                                        <option value="Private Limited">
                                                            Private Limited
                                                        </option>
                                                    </select>
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>
                                                        Primary Industry
                                                    </label>
                                                    <select
                                                        value={profileData.industry}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                industry: e.target.value,
                                                            })
                                                        }
                                                        className={inputClasses}
                                                    >
                                                        <option value="">Select Industry</option>
                                                        <option value="Electronics">
                                                            Electronics & Tech
                                                        </option>
                                                        <option value="Fashion">
                                                            Fashion & Apparel
                                                        </option>
                                                        <option value="Home & Kitchen">
                                                            Home & Kitchen
                                                        </option>
                                                        <option value="Beauty">
                                                            Health & Beauty
                                                        </option>
                                                        <option value="Other">Other Retail</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>
                                                        Year Established
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profileData.yearEstablished}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                yearEstablished:
                                                                    e.target.value.replace(
                                                                        /\D/g,
                                                                        ''
                                                                    ),
                                                            })
                                                        }
                                                        maxLength="4"
                                                        placeholder="YYYY"
                                                        className={inputClasses}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>
                                                        Company Website
                                                    </label>
                                                    <div className="relative">
                                                        <Globe
                                                            size={16}
                                                            className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                                                        />
                                                        <input
                                                            type="url"
                                                            value={profileData.website}
                                                            onChange={(e) =>
                                                                setProfileData({
                                                                    ...profileData,
                                                                    website: e.target.value,
                                                                })
                                                            }
                                                            placeholder="https://..."
                                                            className={`${inputClasses} pl-10`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 2: Essential Tax & Legal */}
                                        <div className={`${cardClasses} relative overflow-hidden`}>
                                            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                                                <h3 className="flex items-center gap-3 text-xl font-black text-slate-900">
                                                    <FileText
                                                        className="text-indigo-500"
                                                        size={24}
                                                    />{' '}
                                                    Essential Tax & Legal
                                                </h3>
                                                {user?.isVerifiedB2B && (
                                                    <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
                                                        <CheckCircle2 size={14} /> Verified
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div>
                                                    <label className={labelClasses}>
                                                        Company PAN *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profileData.panNumber}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                panNumber:
                                                                    e.target.value.toUpperCase(),
                                                            })
                                                        }
                                                        maxLength={10}
                                                        placeholder="ABCDE1234F"
                                                        className={`${inputClasses} uppercase`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>
                                                        GSTIN (HQ) *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profileData.gstin}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                gstin: e.target.value.toUpperCase(),
                                                            })
                                                        }
                                                        maxLength={15}
                                                        placeholder="22AAAAA0000A1Z5"
                                                        className={`${inputClasses} uppercase`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 3: Settlement & Banking */}
                                        <div className={cardClasses}>
                                            <h3 className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-xl font-black text-slate-900">
                                                <Wallet className="text-indigo-500" size={24} />{' '}
                                                Settlement & Banking
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div>
                                                    <label className={labelClasses}>Account Holder Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.accountName}
                                                        className={inputClasses}
                                                        disabled
                                                        placeholder="Not provided"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Bank Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.bankName}
                                                        className={inputClasses}
                                                        disabled
                                                        placeholder="Not provided"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Account Number</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.accountNumber}
                                                        className={inputClasses}
                                                        disabled
                                                        placeholder="Not provided"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>IFSC Code</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.ifscCode}
                                                        className={inputClasses}
                                                        disabled
                                                        placeholder="Not provided"
                                                    />
                                                </div>
                                            </div>
                                            <p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <ShieldCheck size={14} className="text-indigo-600" />
                                                Banking details can only be modified by a portal administrator.
                                            </p>
                                        </div>

                                        {/* Card 3: Contact & HQ Address */}
                                        <div className={cardClasses}>
                                            <h3 className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-xl font-black text-slate-900">
                                                <MapPin className="text-indigo-500" size={24} />{' '}
                                                Principal Contact & HQ
                                            </h3>

                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>
                                                        Primary Contact Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profileData.name}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                name: e.target.value,
                                                            })
                                                        }
                                                        className={inputClasses}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>
                                                        Registered Email
                                                    </label>
                                                    <div className="relative">
                                                        <Mail
                                                            size={16}
                                                            className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                                                        />
                                                        <input
                                                            type="email"
                                                            value={profileData.email}
                                                            disabled
                                                            className={`${inputClasses} pl-10`}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>
                                                        Registered Phone
                                                    </label>
                                                    <div className="relative">
                                                        <Phone
                                                            size={16}
                                                            className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={profileData.phoneNumber}
                                                            disabled
                                                            className={`${inputClasses} pl-10`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-4 border-t border-slate-100 pt-6 lg:col-span-3">
                                                    <label className={labelClasses}>
                                                        HQ Street Address
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profileData.street}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                street: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Flat, Floor, Building Name"
                                                        className={inputClasses}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>City</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.city}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                city: e.target.value,
                                                            })
                                                        }
                                                        className={inputClasses}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>State</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.state}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                state: e.target.value,
                                                            })
                                                        }
                                                        className={inputClasses}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className={labelClasses}>PIN Code</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.zip}
                                                        onChange={(e) =>
                                                            setProfileData({
                                                                ...profileData,
                                                                zip: e.target.value.replace(
                                                                    /\D/g,
                                                                    ''
                                                                ),
                                                            })
                                                        }
                                                        className={inputClasses}
                                                        maxLength={6}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            {/* UPDATED: Primary Action Styling */}
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="rounded-2xl bg-indigo-600 px-10 py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md disabled:transform-none disabled:opacity-50"
                                            >
                                                {isLoading
                                                    ? 'Saving Changes...'
                                                    : 'Save Profile Details'}
                                            </button>
                                        </div>
                                    </form>

                                    {}
                                    <div className={cardClasses}>
                                        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                                            <div>
                                                <h3 className="flex items-center gap-3 text-xl font-black text-slate-900">
                                                    <Building2
                                                        className="text-indigo-500"
                                                        size={24}
                                                    />{' '}
                                                    Additional Branches
                                                </h3>
                                                <p className="mt-1 text-sm font-medium text-slate-500">
                                                    Manage multiple locations and state-specific
                                                    GSTINs for procurement.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => openBranchModal()}
                                                className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-50 px-5 py-2.5 text-sm font-black text-indigo-700 transition-all hover:bg-indigo-100"
                                            >
                                                <Plus size={16} /> Add Branch
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                            {}
                                            <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm">
                                                <div className="absolute -right-4 -bottom-4 text-indigo-100/50">
                                                    <Building2 size={100} />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <h4 className="font-black text-indigo-900">
                                                            Headquarters (HQ)
                                                        </h4>
                                                    </div>
                                                    <p className="mb-1 text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">
                                                        GSTIN:{' '}
                                                        <span className="text-indigo-900">
                                                            {profileData.gstin || 'Pending'}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm leading-relaxed font-bold text-indigo-800">
                                                        {profileData.street
                                                            ? `${profileData.street}, ${profileData.city}, ${profileData.state} ${profileData.zip}`
                                                            : 'Address pending'}
                                                    </p>
                                                </div>
                                            </div>

                                            {user?.branches?.map((branch) => (
                                                <div
                                                    key={branch._id}
                                                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                                                >
                                                    <div>
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <h4 className="flex items-center gap-2 font-black text-slate-900">
                                                                {branch.branchName}
                                                                {branch.isPrimary && (
                                                                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-indigo-700 uppercase">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </h4>
                                                        </div>
                                                        <p className="mb-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                            GSTIN:{' '}
                                                            <span className="text-slate-700">
                                                                {branch.gstin || 'Same as HQ'}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm leading-relaxed font-bold text-slate-600">
                                                            {branch.address.street},{' '}
                                                            {branch.address.city},{' '}
                                                            {branch.address.state}{' '}
                                                            {branch.address.zip}
                                                        </p>
                                                    </div>
                                                    <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <button
                                                            onClick={() => openBranchModal(branch)}
                                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-50 py-2 text-xs font-black text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                                                        >
                                                            <Edit3 size={14} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteBranch(branch._id)
                                                            }
                                                            className="flex items-center justify-center rounded-xl bg-red-50 px-4 text-red-600 hover:bg-red-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'SECURITY' && (
                                <div className={`${cardClasses} max-w-4xl`}>
                                    <form onSubmit={handleSecuritySubmit}>
                                        <h3 className="mb-6 border-b border-slate-100 pb-4 text-2xl font-black text-slate-900">
                                            Security & Access
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <label className={labelClasses}>
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={securityData.oldPassword}
                                                    onChange={(e) =>
                                                        setSecurityData({
                                                            ...securityData,
                                                            oldPassword: e.target.value,
                                                        })
                                                    }
                                                    className={inputClasses}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClasses}>New Password</label>
                                                <input
                                                    type="password"
                                                    value={securityData.newPassword}
                                                    onChange={(e) =>
                                                        setSecurityData({
                                                            ...securityData,
                                                            newPassword: e.target.value,
                                                        })
                                                    }
                                                    className={inputClasses}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="mt-6 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            Update Password
                                        </button>
                                    </form>

                                    <div className="mt-10 border-t border-slate-100 pt-10">
                                        <h3 className="mb-6 text-xl font-black text-slate-900">
                                            Active Device Sessions
                                        </h3>
                                        {sessionsLoading ? (
                                            <p className="text-sm font-bold text-slate-400">
                                                Syncing devices...
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                {sessions.map((session) => (
                                                    <div
                                                        key={session.id}
                                                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5"
                                                    >
                                                        <div>
                                                            <p className="text-base font-black text-slate-900">
                                                                {session.deviceType || 'Device'} -{' '}
                                                                {session.browser || 'Unknown'}
                                                            </p>
                                                            <p className="mt-1 text-xs font-bold text-slate-500">
                                                                {session.isCurrent
                                                                    ? 'Current Device'
                                                                    : 'Other Device'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                handleRevokeSession(
                                                                    session.id,
                                                                    session.isCurrent
                                                                )
                                                            }
                                                            className="rounded-xl border border-red-200 bg-white px-5 py-2 text-xs font-black text-red-600 hover:bg-red-50"
                                                        >
                                                            Revoke Access
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'NOTIFICATIONS' && (
                                <div className={`${cardClasses} max-w-4xl`}>
                                    <h3 className="mb-6 border-b border-slate-100 pb-4 text-2xl font-black text-slate-900">
                                        Communication Preferences
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            {
                                                id: 'emailNotifications',
                                                title: 'Critical Order & System Alerts',
                                                desc: 'Invoices, dispatch tracking, and KYC status updates via Email.',
                                            },
                                            {
                                                id: 'orderSms',
                                                title: 'SMS Dispatch Alerts',
                                                desc: 'Real-time delivery tracking and NDR notifications via SMS.',
                                            },
                                            {
                                                id: 'promotionalEmails',
                                                title: 'Catalog & Wholesale Trends',
                                                desc: 'New stock alerts and seasonal pricing updates.',
                                            },
                                        ].map((pref) => (
                                            <div
                                                key={pref.id}
                                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300"
                                            >
                                                <div>
                                                    <h4 className="text-base font-black text-slate-900">
                                                        {pref.title}
                                                    </h4>
                                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                                        {pref.desc}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const updated = {
                                                            ...profileData,
                                                            [pref.id]: !profileData[pref.id],
                                                        };
                                                        setProfileData(updated);
                                                        api.put('/users/profile', updated);
                                                    }}
                                                    className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${profileData[pref.id] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                                >
                                                    <span
                                                        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${profileData[pref.id] ? 'translate-x-6' : 'translate-x-0'}`}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {}
            <AnimatePresence>
                {isBranchModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBranchModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6">
                                <h3 className="flex items-center gap-3 font-black tracking-widest text-slate-900 uppercase">
                                    <Building2 size={20} className="text-indigo-600" />
                                    {editingBranchId
                                        ? 'Edit Business Location'
                                        : 'Add New Location'}
                                </h3>
                                <button
                                    onClick={() => setIsBranchModalOpen(false)}
                                    className="rounded-full bg-slate-200/50 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveBranch} className="p-8">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Branch Name</label>
                                        <input
                                            type="text"
                                            value={branchData.branchName}
                                            onChange={(e) =>
                                                setBranchData({
                                                    ...branchData,
                                                    branchName: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Delhi Warehouse"
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>
                                            State GSTIN (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={branchData.gstin}
                                            onChange={(e) =>
                                                setBranchData({
                                                    ...branchData,
                                                    gstin: e.target.value.toUpperCase(),
                                                })
                                            }
                                            placeholder="Leave blank to use HQ GSTIN"
                                            className={`${inputClasses} uppercase`}
                                            maxLength={15}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Street Address</label>
                                        <input
                                            type="text"
                                            value={branchData.street}
                                            onChange={(e) =>
                                                setBranchData({
                                                    ...branchData,
                                                    street: e.target.value,
                                                })
                                            }
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className={labelClasses}>City</label>
                                        <input
                                            type="text"
                                            value={branchData.city}
                                            onChange={(e) =>
                                                setBranchData({
                                                    ...branchData,
                                                    city: e.target.value,
                                                })
                                            }
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className={labelClasses}>State</label>
                                        <input
                                            type="text"
                                            value={branchData.state}
                                            onChange={(e) =>
                                                setBranchData({
                                                    ...branchData,
                                                    state: e.target.value,
                                                })
                                            }
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className={labelClasses}>PIN Code</label>
                                        <input
                                            type="text"
                                            value={branchData.zip}
                                            onChange={(e) =>
                                                setBranchData({
                                                    ...branchData,
                                                    zip: e.target.value.replace(/\D/g, ''),
                                                })
                                            }
                                            className={inputClasses}
                                            required
                                            maxLength={6}
                                        />
                                    </div>

                                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
                                        <input
                                            type="checkbox"
                                            id="primary-branch"
                                            checked={branchData.isPrimary}
                                            onChange={(e) =>
                                                setBranchData({
                                                    ...branchData,
                                                    isPrimary: e.target.checked,
                                                })
                                            }
                                            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <label
                                            htmlFor="primary-branch"
                                            className="cursor-pointer text-sm font-black text-slate-700"
                                        >
                                            Set as default checkout branch
                                        </label>
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsBranchModalOpen(false)}
                                        className="w-full rounded-2xl bg-slate-100 py-4 text-sm font-black text-slate-600 transition-colors hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Saving...' : 'Save Branch'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
