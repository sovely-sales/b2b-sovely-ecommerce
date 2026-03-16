import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');

    const handleSendOTP = (e) => {
        e.preventDefault();
        if (email) {
            setStep(2);
        }
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        // Simulate verification
        setStep(3);
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        // Simulate reset
        alert("Password reset successfully! You can now log in.");
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-accent/30">
            {/* Decorative Background Elements */}
            <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl border border-white relative z-10 text-center">
                
                <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🛒</span>
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">Sovely</span>
                </Link>
                
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Reset Password</h1>
                    <p className="text-slate-500 font-medium">
                        {step === 1 && "Enter your email to receive an OTP"}
                        {step === 2 && "Enter the OTP sent to your email"}
                        {step === 3 && "Create a new password"}
                    </p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300">
                            Send OTP
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                        <div className="space-y-2">
                            <label htmlFor="otp" className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">One-Time Password (OTP)</label>
                            <input
                                type="text"
                                id="otp"
                                placeholder="Enter 6-digit OTP"
                                maxLength="6"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-center text-2xl font-extrabold tracking-widest text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:font-medium placeholder:text-slate-300 placeholder:text-sm"
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300">
                            Verify OTP
                        </button>
                        <div className="text-center mt-4">
                            <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-accent hover:text-slate-900 transition-colors">
                                Resend OTP
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                        <div className="space-y-2">
                            <label htmlFor="new-password" className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">New Password</label>
                            <input
                                type="password"
                                id="new-password"
                                placeholder="Create a strong password"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all tracking-widest placeholder:tracking-normal placeholder:text-slate-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirm-password" className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Confirm Password</label>
                            <input
                                type="password"
                                id="confirm-password"
                                placeholder="Confirm your new password"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all tracking-widest placeholder:tracking-normal placeholder:text-slate-400"
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300">
                            Reset Password
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        Remember your password? <Link to="/login" className="font-bold text-slate-900 hover:text-accent transition-colors">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;