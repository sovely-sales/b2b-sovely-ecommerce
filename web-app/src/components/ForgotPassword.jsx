import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        if (otpCode.length === 6) {
            setStep(3);
        } else {
            setError('Please enter a valid 6-digit OTP');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', {
                email,
                otpCode,
                newPassword,
            });
            alert('Password reset successfully! You can now log in.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans selection:bg-emerald-500/30">
            {}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="animate-blob absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/20 mix-blend-overlay blur-[100px] filter"></div>
                <div className="animate-blob animation-delay-2000 absolute right-[-10%] bottom-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 mix-blend-overlay blur-[100px] filter"></div>

                <div className="relative z-10">
                    <Link to="/" className="text-2xl font-black tracking-tight text-white">
                        Sovely<span className="text-emerald-500">.</span>
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-4xl leading-[1.1] font-black text-white">
                        Recover your <br />
                        <span className="text-emerald-400">admin access.</span>
                    </h2>
                    <p className="mt-6 text-lg leading-relaxed font-medium text-slate-400">
                        Follow the secure verification process to reset your dashboard password and
                        regain control of your account.
                    </p>
                </div>
            </div>

            {}
            <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="mx-auto w-full max-w-md"
                >
                    <motion.button
                        variants={fadeUp}
                        onClick={() => navigate(-1)}
                        className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} /> Back to Login
                    </motion.button>

                    <motion.div variants={fadeUp} className="mb-8">
                        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                            Reset Password
                        </h1>
                        <p className="font-medium text-slate-500">
                            {step === 1 &&
                                'Enter your business email to receive a verification code.'}
                            {step === 2 && 'Enter the 6-digit OTP sent to your inbox.'}
                            {step === 3 && 'Create a new, secure password.'}
                        </p>
                    </motion.div>

                    {error && (
                        <motion.div
                            variants={fadeUp}
                            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600"
                        >
                            {error}
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.form
                            variants={fadeUp}
                            onSubmit={handleSendOTP}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 transition-colors outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-slate-900 py-4 font-bold tracking-wide text-white transition-all hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? 'Transmitting...' : 'Send Verification Code'}
                            </button>
                        </motion.form>
                    )}

                    {step === 2 && (
                        <motion.form
                            variants={fadeUp}
                            onSubmit={handleVerifyOTP}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    One-Time Password
                                </label>
                                <input
                                    type="text"
                                    placeholder="••••••"
                                    maxLength="6"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-2xl font-black tracking-[0.5em] text-slate-900 transition-colors outline-none placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full rounded-xl bg-slate-900 py-4 font-bold tracking-wide text-white transition-all hover:bg-slate-800 hover:shadow-lg"
                            >
                                Verify Identity
                            </button>
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
                                >
                                    Use a different email
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {step === 3 && (
                        <motion.form
                            variants={fadeUp}
                            onSubmit={handleResetPassword}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium tracking-widest text-slate-900 transition-colors outline-none placeholder:tracking-normal placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium tracking-widest text-slate-900 transition-colors outline-none placeholder:tracking-normal placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-slate-900 py-4 font-bold tracking-wide text-white transition-all hover:bg-slate-800 hover:shadow-lg disabled:opacity-50"
                            >
                                {loading ? 'Securing Account...' : 'Set New Password'}
                            </button>
                        </motion.form>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
