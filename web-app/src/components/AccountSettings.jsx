import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { 
    User, Lock, Bell, Building2, ShieldCheck, 
    Loader2, ArrowLeft, Camera, Smartphone, 
    KeyRound, Download, Trash2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AccountSettings = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('account');
    const [isLoading, setIsLoading] = useState(false);

    // --- UI Placeholder States (For the new features) ---
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    // Profile Form State
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        companyName: '',
        gstin: '',
        street: '',
        city: '',
        state: '',
        zip: ''
    });

    // Security Form State
    const [securityData, setSecurityData] = useState({
        oldPassword: '',
        newPassword: ''
    });

    // Load initial user data
    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                companyName: user.companyName || '',
                gstin: user.gstin || '',
                street: user.billingAddress?.street || '',
                city: user.billingAddress?.city || '',
                state: user.billingAddress?.state || '',
                zip: user.billingAddress?.zip || ''
            });
            // If user has an avatar from the DB, load it here
            if (user.avatar) setAvatarPreview(user.avatar);
        }
    }, [user]);

    // Handle Local Avatar Preview
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create a temporary local URL to preview the image instantly
            const objectUrl = URL.createObjectURL(file);
            setAvatarPreview(objectUrl);
            
            // TODO: In the future, trigger an API call here to upload the file to your backend
            toast.success("Profile photo updated locally. (Backend upload pending)");
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.put('/users/profile', {
                name: profileData.name,
                email: profileData.email,
                companyName: profileData.companyName,
                gstin: profileData.gstin,
                billingAddress: {
                    street: profileData.street,
                    city: profileData.city,
                    state: profileData.state,
                    zip: profileData.zip
                }
            });
            toast.success('Profile updated successfully! Refresh to see changes.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSecuritySubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.put('/users/security/password', securityData);
            toast.success('Password updated successfully!');
            setSecurityData({ oldPassword: '', newPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10";
    const labelClasses = "mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase";

    return (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 font-sans sm:px-6 lg:px-8">
            
            {/* PROMINENT BACK BUTTON */}
            <Link to={ROUTES.HOME} className="group mb-6 inline-flex items-center gap-3 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-transform group-hover:-translate-x-1">
                    <ArrowLeft size={16} />
                </div>
                Back to Home
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900">Settings</h1>
                <p className="mt-2 text-sm text-slate-500">Manage your business profile, security, and preferences.</p>
            </div>

            {/* TAB NAVIGATION */}
            <div className="mb-8 flex overflow-x-auto border-b border-slate-200 pb-px hide-scrollbar">
                <button
                    onClick={() => setActiveTab('account')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'account' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    <User size={16} /> Account Details
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'security' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    <Lock size={16} /> Security
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    <Bell size={16} /> Notifications
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                
                {/* --- ACCOUNT TAB --- */}
                {activeTab === 'account' && (
                    <div className="animate-in fade-in duration-300">
                        
                        {/* PROFILE PHOTO UPLOADER */}
                        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-2xl border border-slate-100 p-6 bg-slate-50/50">
                            <div 
                                className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md transition-transform hover:scale-105"
                                onClick={() => document.getElementById('avatar-upload').click()}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-black text-slate-400">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                )}
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                                    <Camera className="text-white" size={24} />
                                </div>
                                <input 
                                    type="file" 
                                    id="avatar-upload" 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/webp" 
                                    onChange={handleAvatarChange} 
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Profile Picture</h3>
                                <p className="text-sm text-slate-500 mb-3">Upload a high-res logo or photo. PNG, JPG under 5MB.</p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => document.getElementById('avatar-upload').click()}
                                        className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                                    >
                                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                                    </button>
                                    {avatarPreview && (
                                        <button 
                                            onClick={() => setAvatarPreview(null)}
                                            className="rounded-lg px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="space-y-8">
                            <div>
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                                    <User className="text-emerald-500" size={20} /> Personal Information
                                </h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className={labelClasses}>Full Name</label>
                                        <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className={inputClasses} required />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Email Address</label>
                                        <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className={inputClasses} required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Registered Phone Number <span className="text-[10px] text-slate-400 font-normal normal-case ml-2">(Used for login)</span></label>
                                        <input type="text" value={user?.phoneNumber || ''} disabled className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                                    <Building2 className="text-emerald-500" size={20} /> Business Identity
                                </h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className={labelClasses}>Company Name</label>
                                        <input type="text" value={profileData.companyName} onChange={(e) => setProfileData({...profileData, companyName: e.target.value})} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>GSTIN Number</label>
                                        <input type="text" value={profileData.gstin} onChange={(e) => setProfileData({...profileData, gstin: e.target.value})} className={inputClasses} maxLength={15} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Street Address</label>
                                        <input type="text" value={profileData.street} onChange={(e) => setProfileData({...profileData, street: e.target.value})} className={inputClasses} placeholder="Building, Floor, Street" />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>City</label>
                                        <input type="text" value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})} className={inputClasses} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>State</label>
                                            <input type="text" value={profileData.state} onChange={(e) => setProfileData({...profileData, state: e.target.value})} className={inputClasses} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>PIN Code</label>
                                            <input type="text" value={profileData.zip} onChange={(e) => setProfileData({...profileData, zip: e.target.value})} className={inputClasses} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={isLoading} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20">
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* --- SECURITY TAB --- */}
                {activeTab === 'security' && (
                    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl">
                        
                        {/* 1. PASSWORD MANAGEMENT */}
                        <div className="rounded-2xl border border-slate-100 p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                                <ShieldCheck className="text-emerald-500" size={20} /> Password Management
                            </h3>
                            <p className="mb-6 text-sm text-slate-500">Ensure your account is using a long, random password to stay secure.</p>
                            
                            <form onSubmit={handleSecuritySubmit} className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Current Password</label>
                                    <input type="password" value={securityData.oldPassword} onChange={(e) => setSecurityData({...securityData, oldPassword: e.target.value})} className={inputClasses} required />
                                </div>
                                <div>
                                    <label className={labelClasses}>New Password</label>
                                    <input type="password" value={securityData.newPassword} onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})} className={inputClasses} required minLength={8} />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" disabled={isLoading} className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isLoading ? <Loader2 size={16} className="animate-spin inline" /> : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* 2. TWO-FACTOR AUTHENTICATION */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 p-6">
                            <div>
                                <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
                                    <Smartphone className="text-slate-400" size={18} /> Two-Factor Authentication
                                </h4>
                                <p className="mt-1 text-sm text-slate-500">Add an extra layer of protection using an authenticator app.</p>
                            </div>
                            <button 
                                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${is2FAEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${is2FAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* 3. PASSKEYS */}
                        <div className="rounded-2xl border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
                                        <KeyRound className="text-slate-400" size={18} /> Passkeys
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">Sign in securely using your device's fingerprint or face scan.</p>
                                </div>
                                <button className="hidden sm:block rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-100">
                                    Add Passkey
                                </button>
                            </div>
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                                <p className="text-sm font-medium text-slate-500">No passkeys registered yet.</p>
                                <button className="mt-3 sm:hidden rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-100">
                                    Add Passkey
                                </button>
                            </div>
                        </div>

                        {/* 4. PRIVACY & DATA */}
                        <div className="rounded-2xl border border-slate-100 p-6">
                            <h4 className="mb-4 text-base font-bold text-slate-900">Privacy & Data</h4>
                            <div className="flex flex-col gap-3">
                                <button className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50">
                                    <Download size={16} /> Download My Data
                                </button>
                                <button className="flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50">
                                    <Trash2 size={16} /> Request Account Deletion
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {/* --- NOTIFICATIONS TAB --- */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl">
                        <h3 className="mb-2 text-lg font-bold text-slate-900">Communication Preferences</h3>
                        
                        <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-5 transition-colors hover:bg-slate-50 cursor-pointer">
                            <div>
                                <p className="font-bold text-slate-900">Order Updates (SMS)</p>
                                <p className="text-xs text-slate-500">Receive dispatch and delivery tracking via SMS.</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-500">
                                <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition shadow-sm" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-5 transition-colors hover:bg-slate-50 cursor-pointer">
                            <div>
                                <p className="font-bold text-slate-900">Marketing & Offers (Email)</p>
                                <p className="text-xs text-slate-500">Get notified about bulk discounts and new categories.</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
                                <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white transition shadow-sm" />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
};

export default AccountSettings;