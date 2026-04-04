import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import {
    User,
    Lock,
    Bell,
    Building2,
    ShieldCheck,
    Loader2,
    ArrowLeft,
    Camera,
    Smartphone,
    KeyRound,
    Download,
    TrendingUp,
    Trash2,
    AlertTriangle,
    X,
    Monitor,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/routes';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../utils/getAvatarUrl'; // We import our globally fixed util

const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
const CITY_STATE_REGEX = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][A-Z0-9][0-9A-Z]$/;
const PIN_REGEX = /^[1-9][0-9]{5}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

const AccountSettings = () => {
    const { user, logout, refreshUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('account');
    const [isLoading, setIsLoading] = useState(false);

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarError, setAvatarError] = useState(false);

    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const isBusinessLocked = user?.accountType === 'B2B' && user?.kycStatus === 'APPROVED';

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        companyName: '',
        gstin: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        emailNotifications: true,
        orderSms: true,
        promotionalEmails: false,
    });

    const [securityData, setSecurityData] = useState({ oldPassword: '', newPassword: '' });
    const [profileErrors, setProfileErrors] = useState({});
    const [securityErrors, setSecurityErrors] = useState({});
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [revokeSessionId, setRevokeSessionId] = useState('');
    const [revokingOthers, setRevokingOthers] = useState(false);
    const [sessionDetailsOpen, setSessionDetailsOpen] = useState({});

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
                zip: user.billingAddress?.zip || '',
                emailNotifications:
                    user.emailNotifications !== undefined ? user.emailNotifications : true,
                orderSms: user.orderSms !== undefined ? user.orderSms : true,
                promotionalEmails:
                    user.promotionalEmails !== undefined ? user.promotionalEmails : false,
            });

            setAvatarPreview(user.avatar || null);
            setAvatarError(false);
            if (user.twoFactorEnabled) setIs2FAEnabled(true);
        }
    }, [user]);

    const sanitizeName = (value) => value.replace(/[^A-Za-z .'-]/g, '').slice(0, 60);
    const sanitizeCityState = (value) => value.replace(/[^A-Za-z .'-]/g, '').slice(0, 60);
    const sanitizeCompanyName = (value) => value.replace(/\s+/g, ' ').slice(0, 100);
    const sanitizeGstin = (value) =>
        value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 15);
    const sanitizePin = (value) => value.replace(/\D/g, '').slice(0, 6);

    const validateProfileData = () => {
        const nextErrors = {};
        const trimmedName = profileData.name.trim();
        const trimmedEmail = profileData.email.trim().toLowerCase();
        const trimmedCompany = profileData.companyName.trim();
        const trimmedGstin = profileData.gstin.trim().toUpperCase();
        const trimmedStreet = profileData.street.trim();
        const trimmedCity = profileData.city.trim();
        const trimmedState = profileData.state.trim();
        const trimmedZip = profileData.zip.trim();

        if (!NAME_REGEX.test(trimmedName)) {
            nextErrors.name = 'Use 2-60 letters only (spaces, dot, apostrophe allowed).';
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            nextErrors.email = 'Enter a valid email address.';
        }

        if (!isBusinessLocked) {
            if (trimmedCompany && trimmedCompany.length < 2) {
                nextErrors.companyName = 'Company name must be at least 2 characters.';
            }
            if (trimmedGstin && !GSTIN_REGEX.test(trimmedGstin)) {
                nextErrors.gstin = 'Enter a valid 15-character GSTIN.';
            }
            if (trimmedStreet.length > 200) {
                nextErrors.street = 'Street address must be at most 200 characters.';
            }
            if (trimmedCity && !CITY_STATE_REGEX.test(trimmedCity)) {
                nextErrors.city = 'City must be 2-60 letters only.';
            }
            if (trimmedState && !CITY_STATE_REGEX.test(trimmedState)) {
                nextErrors.state = 'State must be 2-60 letters only.';
            }
            if (trimmedZip && !PIN_REGEX.test(trimmedZip)) {
                nextErrors.zip = 'PIN code must be a valid 6-digit Indian PIN.';
            }
        }

        setProfileErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateSecurityData = () => {
        const nextErrors = {};
        const oldPassword = securityData.oldPassword || '';
        const newPassword = securityData.newPassword || '';

        if (!oldPassword.trim()) {
            nextErrors.oldPassword = 'Current password is required.';
        }

        if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
            nextErrors.newPassword =
                'Use 8+ chars with uppercase, lowercase, number, and special character.';
        } else if (oldPassword && oldPassword === newPassword) {
            nextErrors.newPassword = 'New password must be different from current password.';
        }

        setSecurityErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const updateProfileField = (key, value) => {
        setProfileData((prev) => ({ ...prev, [key]: value }));
        setProfileErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const formatLastActive = (lastSeenAt) => {
        if (!lastSeenAt) return 'Last active recently';
        const diffMs = Date.now() - new Date(lastSeenAt).getTime();
        if (diffMs <= 2 * 60 * 1000) return 'Active Now';
        const mins = Math.floor(diffMs / (60 * 1000));
        if (mins < 60) return `Last active ${mins} minute${mins === 1 ? '' : 's'} ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `Last active ${hours} hour${hours === 1 ? '' : 's'} ago`;
        const days = Math.floor(hours / 24);
        return `Last active ${days} day${days === 1 ? '' : 's'} ago`;
    };

    const formatSignedIn = (createdAt) => {
        if (!createdAt) return 'Signed in recently';
        const diffMs = Date.now() - new Date(createdAt).getTime();
        const mins = Math.floor(diffMs / (60 * 1000));
        if (mins < 60) return `Signed in ${mins} minute${mins === 1 ? '' : 's'} ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `Signed in ${hours} hour${hours === 1 ? '' : 's'} ago`;
        const days = Math.floor(hours / 24);
        return `Signed in ${days} day${days === 1 ? '' : 's'} ago`;
    };

    const getIpLabel = (ip) => {
        const normalized = String(ip || '').trim();
        if (!normalized) return 'Unknown network';
        if (normalized === '::1' || normalized === '127.0.0.1') return 'Localhost';
        if (normalized.startsWith('::ffff:127.0.0.1')) return 'Localhost';
        return 'Network session';
    };

    const loadSessions = async () => {
        setSessionsLoading(true);
        try {
            const response = await api.get('/auth/sessions');
            setSessions(response.data?.data?.sessions || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load active sessions');
        } finally {
            setSessionsLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId, isCurrent) => {
        if (!sessionId) return;
        const confirmationText = isCurrent
            ? 'This will sign out this current device. Continue?'
            : 'Sign out this device?';
        if (!window.confirm(confirmationText)) return;

        setRevokeSessionId(sessionId);
        try {
            const response = await api.delete(`/auth/sessions/${sessionId}`);
            const signedOut = Boolean(response.data?.data?.signedOut);
            toast.success(
                signedOut ? 'Current session revoked. Signing out...' : 'Session revoked successfully'
            );
            if (signedOut || isCurrent) {
                await logout();
                return;
            }
            await loadSessions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to revoke session');
        } finally {
            setRevokeSessionId('');
        }
    };

    const handleRevokeOtherSessions = async () => {
        if (!window.confirm('Sign out all other devices and keep only this current device active?')) {
            return;
        }

        setRevokingOthers(true);
        try {
            const response = await api.delete('/auth/sessions/others');
            const revokedCount = response.data?.data?.revokedCount ?? 0;
            toast.success(
                revokedCount > 0
                    ? `${revokedCount} session${revokedCount === 1 ? '' : 's'} signed out`
                    : 'No other active sessions found'
            );
            await loadSessions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to sign out other sessions');
        } finally {
            setRevokingOthers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'security' && user?._id) {
            loadSessions();
        }
    }, [activeTab, user?._id]);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File is too large (Maximum 5MB)');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setAvatarError(false);

        const formData = new FormData();
        formData.append('avatar', file);

        setIsLoading(true);
        try {
            await api.post('/users/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Your photo was updated successfully!');
            await refreshUser();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Server rejected the photo upload');
            setAvatarPreview(user?.avatar || null);
        } finally {
            setIsLoading(false);
            e.target.value = '';
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!validateProfileData()) {
            toast.error('Please fix the highlighted profile fields.');
            return;
        }

        const payload = {
            name: profileData.name.trim(),
            email: profileData.email.trim().toLowerCase(),
            emailNotifications: profileData.emailNotifications,
            orderSms: profileData.orderSms,
            promotionalEmails: profileData.promotionalEmails,
        };

        if (!isBusinessLocked) {
            payload.companyName = profileData.companyName.trim();
            payload.gstin = profileData.gstin.trim().toUpperCase();
            payload.billingAddress = {
                street: profileData.street.trim(),
                city: profileData.city.trim(),
                state: profileData.state.trim(),
                zip: profileData.zip.trim(),
            };
        }

        setIsLoading(true);
        try {
            await api.put('/users/profile', payload);
            toast.success('Profile updated successfully!');
            setProfileErrors({});
            await refreshUser();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSecuritySubmit = async (e) => {
        e.preventDefault();
        if (!validateSecurityData()) {
            toast.error('Please fix password requirements before submitting.');
            return;
        }
        setIsLoading(true);
        try {
            await api.put('/users/security/password', {
                oldPassword: securityData.oldPassword,
                newPassword: securityData.newPassword,
            });
            toast.success('Password updated successfully!');
            setSecurityData({ oldPassword: '', newPassword: '' });
            setSecurityErrors({});
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const requestReVerification = async () => {
        if (
            !window.confirm(
                'This will lock your account from wholesale purchases until an admin re-verifies your new details. Continue?'
            )
        )
            return;
        setIsLoading(true);
        try {
            await api.put('/users/kyc-reverify');
            toast.success('Account unlocked. You may now edit your business details.');
            window.location.reload();
        } catch (error) {
            toast.error('Failed to request re-verification.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') return toast.error('Please type DELETE to confirm.');
        setIsLoading(true);
        try {
            await api.delete('/users/account');
            toast.success('Your account has been deleted.');
            await logout();
            navigate('/');
        } catch (error) {
            toast.error('Failed to delete account. Please contact support.');
            setIsLoading(false);
        }
    };

    const inputClasses =
        'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed';
    const labelClasses = 'mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase';

    return (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 font-sans sm:px-6 lg:px-8">
            <Link
                to={ROUTES.HOME}
                className="group mb-6 inline-flex items-center gap-3 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-transform group-hover:-translate-x-1">
                    <ArrowLeft size={16} />
                </div>
                Back to Home
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900">Settings</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Manage your business profile, security, and preferences.
                </p>
            </div>

            <div className="hide-scrollbar mb-8 flex overflow-x-auto border-b border-slate-200 pb-px">
                <button
                    onClick={() => setActiveTab('account')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'account' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    <User size={16} /> Account Details
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'security' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    <Lock size={16} /> Security
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'notifications' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    <Bell size={16} /> Notifications
                </button>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                {activeTab === 'account' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="mb-10 flex flex-col items-start gap-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:flex-row sm:items-center">
                            <div
                                className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md transition-transform hover:scale-105"
                                onClick={() => document.getElementById('avatar-upload').click()}
                            >
                                {avatarPreview && !avatarError ? (
                                    <img
                                        src={getAvatarUrl(avatarPreview)}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <span className="text-3xl font-black text-slate-400">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                )}
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
                                <h3 className="text-lg font-bold text-slate-900">
                                    Profile Picture
                                </h3>
                                <p className="mb-3 text-sm text-slate-500">
                                    Upload a high-res logo or photo. PNG, JPG under 5MB.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() =>
                                            document.getElementById('avatar-upload').click()
                                        }
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                                    >
                                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                                    </button>
                                    {avatarPreview && (
                                        <button
                                            onClick={() => {
                                                setAvatarPreview(null);
                                            }}
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
                                    <User className="text-emerald-500" size={20} /> Personal
                                    Information
                                </h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className={labelClasses}>Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) =>
                                                updateProfileField('name', sanitizeName(e.target.value))
                                            }
                                            className={inputClasses}
                                            required
                                            maxLength={60}
                                        />
                                        {profileErrors.name && (
                                            <p className="mt-1 text-xs font-semibold text-red-600">
                                                {profileErrors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Email Address</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) =>
                                                updateProfileField('email', e.target.value.trimStart())
                                            }
                                            className={inputClasses}
                                            required
                                        />
                                        {profileErrors.email && (
                                            <p className="mt-1 text-xs font-semibold text-red-600">
                                                {profileErrors.email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>
                                            Registered Phone Number{' '}
                                            <span className="ml-2 text-[10px] font-normal text-slate-400 normal-case">
                                                (Used for login)
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={user?.phoneNumber || ''}
                                            disabled
                                            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                        <Building2 className="text-emerald-500" size={20} />{' '}
                                        Business Identity
                                    </h3>
                                    {isBusinessLocked && (
                                        <button
                                            type="button"
                                            onClick={requestReVerification}
                                            className="text-xs font-bold text-amber-600 underline hover:text-amber-700"
                                        >
                                            Request Re-Verification
                                        </button>
                                    )}
                                </div>

                                {isBusinessLocked && (
                                    <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                        <ShieldCheck size={20} className="shrink-0" />
                                        <p>
                                            Your business details are verified and locked. To change
                                            them, request re-verification above.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className={labelClasses}>Company Name</label>
                                        <input
                                            type="text"
                                            disabled={isBusinessLocked}
                                            value={profileData.companyName}
                                            onChange={(e) =>
                                                updateProfileField(
                                                    'companyName',
                                                    sanitizeCompanyName(e.target.value)
                                                )
                                            }
                                            className={inputClasses}
                                            maxLength={100}
                                        />
                                        {profileErrors.companyName && (
                                            <p className="mt-1 text-xs font-semibold text-red-600">
                                                {profileErrors.companyName}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelClasses}>GSTIN Number</label>
                                        <input
                                            type="text"
                                            disabled={isBusinessLocked}
                                            value={profileData.gstin}
                                            onChange={(e) =>
                                                updateProfileField('gstin', sanitizeGstin(e.target.value))
                                            }
                                            className={`${inputClasses} uppercase`}
                                            maxLength={15}
                                        />
                                        {profileErrors.gstin && (
                                            <p className="mt-1 text-xs font-semibold text-red-600">
                                                {profileErrors.gstin}
                                            </p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Street Address</label>
                                        <input
                                            type="text"
                                            disabled={isBusinessLocked}
                                            value={profileData.street}
                                            onChange={(e) => updateProfileField('street', e.target.value)}
                                            className={inputClasses}
                                            placeholder="Building, Floor, Street"
                                            maxLength={200}
                                        />
                                        {profileErrors.street && (
                                            <p className="mt-1 text-xs font-semibold text-red-600">
                                                {profileErrors.street}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelClasses}>City</label>
                                        <input
                                            type="text"
                                            disabled={isBusinessLocked}
                                            value={profileData.city}
                                            onChange={(e) =>
                                                updateProfileField(
                                                    'city',
                                                    sanitizeCityState(e.target.value)
                                                )
                                            }
                                            className={inputClasses}
                                            maxLength={60}
                                        />
                                        {profileErrors.city && (
                                            <p className="mt-1 text-xs font-semibold text-red-600">
                                                {profileErrors.city}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>State</label>
                                            <input
                                                type="text"
                                                disabled={isBusinessLocked}
                                                value={profileData.state}
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'state',
                                                        sanitizeCityState(e.target.value)
                                                    )
                                                }
                                                className={inputClasses}
                                                maxLength={60}
                                            />
                                            {profileErrors.state && (
                                                <p className="mt-1 text-xs font-semibold text-red-600">
                                                    {profileErrors.state}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClasses}>PIN Code</label>
                                            <input
                                                type="text"
                                                disabled={isBusinessLocked}
                                                value={profileData.zip}
                                                onChange={(e) =>
                                                    updateProfileField('zip', sanitizePin(e.target.value))
                                                }
                                                className={inputClasses}
                                                inputMode="numeric"
                                                maxLength={6}
                                            />
                                            {profileErrors.zip && (
                                                <p className="mt-1 text-xs font-semibold text-red-600">
                                                    {profileErrors.zip}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        'Save Profile Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="animate-in fade-in max-w-3xl space-y-8 duration-300">
                        <div className="rounded-2xl border border-slate-100 p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                                <KeyRound className="text-emerald-500" size={20} /> Password
                                Management
                            </h3>
                            <form onSubmit={handleSecuritySubmit} className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Current Password</label>
                                    <input
                                        type="password"
                                        value={securityData.oldPassword}
                                        onChange={(e) => {
                                            setSecurityData((prev) => ({
                                                ...prev,
                                                oldPassword: e.target.value,
                                            }));
                                            setSecurityErrors((prev) => {
                                                if (!prev.oldPassword) return prev;
                                                const next = { ...prev };
                                                delete next.oldPassword;
                                                return next;
                                            });
                                        }
                                        }
                                        className={inputClasses}
                                        required
                                    />
                                    {securityErrors.oldPassword && (
                                        <p className="mt-1 text-xs font-semibold text-red-600">
                                            {securityErrors.oldPassword}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className={labelClasses}>New Password</label>
                                    <input
                                        type="password"
                                        value={securityData.newPassword}
                                        onChange={(e) => {
                                            setSecurityData((prev) => ({
                                                ...prev,
                                                newPassword: e.target.value,
                                            }));
                                            setSecurityErrors((prev) => {
                                                if (!prev.newPassword) return prev;
                                                const next = { ...prev };
                                                delete next.newPassword;
                                                return next;
                                            });
                                        }
                                        }
                                        className={inputClasses}
                                        required
                                        minLength={8}
                                    />
                                    {securityErrors.newPassword && (
                                        <p className="mt-1 text-xs font-semibold text-red-600">
                                            {securityErrors.newPassword}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                        Must include uppercase, lowercase, number, and special
                                        character.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={16} className="inline animate-spin" />
                                        ) : (
                                            'Update Password'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="rounded-2xl border border-slate-100 p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                    <Smartphone className="text-emerald-500" size={20} /> Two-Factor
                                    Authentication
                                </h3>
                                <div
                                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${is2FAEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    <div
                                        className={`h-1.5 w-1.5 rounded-full ${is2FAEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                    ></div>
                                    {is2FAEnabled ? 'Enabled' : 'Disabled'}
                                </div>
                            </div>
                            <p className="mb-6 text-sm text-slate-500">
                                Add an extra layer of security to your account by requiring an OTP
                                sent to your registered mobile number during login.
                            </p>
                            <button className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50">
                                {is2FAEnabled ? 'Manage 2FA Settings' : 'Set Up 2FA'}
                            </button>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                    <Monitor className="text-emerald-500" size={20} /> Active Sessions
                                </h3>
                                <button
                                    onClick={handleRevokeOtherSessions}
                                    disabled={revokingOthers || sessionsLoading || sessions.length <= 1}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {revokingOthers ? 'Signing Out...' : 'Sign Out Other Devices'}
                                </button>
                            </div>
                            {sessionsLoading ? (
                                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading active sessions...
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                                    No active sessions found.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map((session) => {
                                        const isCurrent = Boolean(session.isCurrent);
                                        const deviceType = session.deviceType || 'Device';
                                        const title = `${deviceType} - ${session.os || 'Unknown OS'} - ${session.browser || 'Unknown Browser'}`;
                                        const subtitle = isCurrent
                                            ? `Current session - ${formatLastActive(session.lastSeenAt)}`
                                            : `${formatLastActive(session.lastSeenAt)} - ${formatSignedIn(session.createdAt)}`;
                                        const isRevoking = revokeSessionId === session.id;
                                        const showDetails = Boolean(sessionDetailsOpen[session.id]);

                                        return (
                                            <div
                                                key={session.id}
                                                className={`flex items-center justify-between rounded-xl border p-4 ${isCurrent ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {title}
                                                    </p>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {subtitle}
                                                    </p>
                                                    {showDetails && (
                                                        <p className="mt-1 text-xs font-medium text-slate-400">
                                                            {`Network: ${getIpLabel(session.ipAddress)} (${session.ipAddress || 'Unknown'})`}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="ml-4 flex shrink-0 items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            setSessionDetailsOpen((prev) => ({
                                                                ...prev,
                                                                [session.id]: !prev[session.id],
                                                            }))
                                                        }
                                                        className="text-xs font-bold text-slate-500 hover:underline"
                                                    >
                                                        {showDetails ? 'Hide Details' : 'Details'}
                                                    </button>
                                                    {isCurrent ? (
                                                        <span className="text-xs font-bold text-emerald-600">
                                                            Current Device
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                handleRevokeSession(
                                                                    session.id,
                                                                    isCurrent
                                                                )
                                                            }
                                                            disabled={isRevoking}
                                                            className="text-xs font-bold text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {isRevoking ? 'Revoking...' : 'Revoke'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-6">
                            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                                <ShieldCheck className="text-emerald-500" size={20} /> Privacy &
                                Data
                            </h4>
                            <div className="flex flex-col gap-3">
                                <button className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50">
                                    <Download size={16} /> Download My Data
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                                >
                                    <Trash2 size={16} /> Request Account Deletion
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="animate-in fade-in max-w-2xl space-y-8 duration-300">
                        <div>
                            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                                <Bell className="text-emerald-500" size={20} /> Notification
                                Preferences
                            </h3>

                            <div className="space-y-4">
                                {[
                                    {
                                        id: 'emailNotifications',
                                        title: 'Critical Alerts & Wholesale Updates',
                                        desc: 'Get notified about stock arrivals, KYC status, and price drops.',
                                        icon: <ShieldCheck size={18} />,
                                    },
                                    {
                                        id: 'orderSms',
                                        title: 'SMS Transaction Alerts',
                                        desc: 'Receive real-time tracking IDs and delivery confirmations via SMS.',
                                        icon: <Smartphone size={18} />,
                                    },
                                    {
                                        id: 'promotionalEmails',
                                        title: 'Exclusive Offers & Trends',
                                        desc: 'Weekly reports on winning products and platform-wide sales.',
                                        icon: <TrendingUp size={18} />,
                                    },
                                ].map((pref) => (
                                    <div
                                        key={pref.id}
                                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-colors hover:border-slate-200"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 rounded-lg bg-white p-2 text-slate-400 shadow-sm">
                                                {pref.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900">
                                                    {pref.title}
                                                </h4>
                                                <p className="text-xs font-medium text-slate-500">
                                                    {pref.desc}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setProfileData({
                                                    ...profileData,
                                                    [pref.id]: !profileData[pref.id],
                                                })
                                            }
                                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${profileData[pref.id] ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${profileData[pref.id] ? 'translate-x-5' : 'translate-x-0 shadow-sm'}`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleProfileSubmit}
                                    disabled={isLoading}
                                    className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        'Save Preferences'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-red-600">
                                <div className="rounded-full bg-red-100 p-2">
                                    <AlertTriangle size={24} />
                                </div>
                                <h2 className="text-xl font-extrabold">Delete Account</h2>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="mb-6 text-sm leading-relaxed text-slate-600">
                            This action is permanent and cannot be undone. All your business data,
                            wallet balance, and order history will be permanently scheduled for
                            deletion.
                        </p>
                        <div className="mb-6">
                            <label className="mb-2 block text-xs font-bold text-slate-500 uppercase">
                                Type "DELETE" to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-mono font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="DELETE"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isLoading || deleteConfirmation !== 'DELETE'}
                                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                                Confirm Deletion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default AccountSettings;