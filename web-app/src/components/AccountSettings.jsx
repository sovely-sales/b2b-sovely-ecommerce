import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { User, Lock, Bell, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';

const AccountSettings = () => {
    const { user } = useContext(AuthContext);

    return (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 font-sans text-slate-900 sm:px-6 lg:px-8">
            <Link to={ROUTES.MY_ACCOUNT} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900">Account Preferences</h1>
                <p className="mt-2 text-sm text-slate-500">Manage your security, notifications, and profile data.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Profile Settings */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Profile Management</h3>
                        <p className="mt-1 text-sm text-slate-500">Update your contact details and business information.</p>
                    </div>
                    <button className="mt-auto rounded-lg bg-slate-50 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
                        Edit Profile
                    </button>
                </div>

                {/* Security Settings */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Security</h3>
                        <p className="mt-1 text-sm text-slate-500">Change your password and manage active sessions.</p>
                    </div>
                    <button className="mt-auto rounded-lg bg-slate-50 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
                        Update Password
                    </button>
                </div>

                {/* Notification Settings */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                        <p className="mt-1 text-sm text-slate-500">Control your email and SMS order updates.</p>
                    </div>
                    <button className="mt-auto rounded-lg bg-slate-50 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
                        Manage Alerts
                    </button>
                </div>
            </div>
        </main>
    );
};

export default AccountSettings;