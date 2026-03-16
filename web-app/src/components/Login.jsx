import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('email'); 
    
    // Email State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Mobile State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const { login, loginWithOtpReq, sendOtp } = useContext(AuthContext);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) return setError("Please enter a valid phone number");
        setError('');
        setIsLoading(true);
        const res = await sendOtp(phoneNumber, true); // true = Login OTP
        setIsLoading(false);
        
        if (res.success) {
            setOtpSent(true);
            setCooldown(30);
        } else {
            setError(res.message);
        }
    };

    const handleTabSwitch = (method) => {
        setLoginMethod(method);
        setError('');
        setOtpSent(false);
        setOtpCode('');
        setCooldown(0);
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await login(email, password);
            if (response.success) navigate('/');
            else throw new Error(response.message || "Invalid credentials");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await loginWithOtpReq(phoneNumber, otpCode);
            if (response.success) navigate('/');
            else throw new Error(response.message || "Invalid OTP");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-accent/30">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl border border-white relative z-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm mb-8 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-slate-500 font-medium">Sign in to access your curated collection.</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                    <button 
                        type="button" 
                        onClick={() => handleTabSwitch('email')} 
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${loginMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Email
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleTabSwitch('phone')} 
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${loginMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Mobile Number
                    </button>
                </div>

                {error && (
                    <div className="bg-danger/10 border border-danger/20 text-danger text-sm font-bold p-4 rounded-2xl mb-6 text-center animate-[fadeIn_0.3s_ease-out]">
                        {error}
                    </div>
                )}

                {/* EMAIL LOGIN FORM */}
                {loginMethod === 'email' && (
                    <form onSubmit={handleEmailLogin} autoComplete="off" className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
                            <input 
                                type="email" 
                                placeholder="you@example.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                autoComplete="off" 
                                required 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Password</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                autoComplete="new-password" 
                                required 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-400 tracking-widest"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2 pb-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent/30 cursor-pointer" />
                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-sm font-bold text-accent hover:text-slate-900 transition-colors">Forgot password?</Link>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {/* MOBILE OTP LOGIN FORM */}
                {loginMethod === 'phone' && (
                    <form onSubmit={otpSent ? handleOtpLogin : (e) => { e.preventDefault(); handleSendOtp(); }} autoComplete="off" className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Mobile Number</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+91</span>
                                <input 
                                    type="tel" 
                                    inputMode="numeric" 
                                    placeholder="Enter 10 digit number" 
                                    value={phoneNumber} 
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                                    disabled={otpSent && cooldown > 0} 
                                    autoComplete="off" 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-100"
                                />
                            </div>
                        </div>
                        
                        {otpSent && (
                            <div className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Enter 4-Digit OTP</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        inputMode="numeric" 
                                        maxLength="4" 
                                        placeholder="1234" 
                                        value={otpCode} 
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                                        autoFocus 
                                        required 
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-center text-lg font-extrabold tracking-widest text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:font-medium placeholder:text-slate-300"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleSendOtp} 
                                        disabled={cooldown > 0 || isLoading} 
                                        className="px-5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[120px]"
                                    >
                                        {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            {!otpSent ? (
                                <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isLoading ? 'Sending...' : 'Get OTP'}
                                </button>
                            ) : (
                                <button type="submit" disabled={isLoading || otpCode.length < 4} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                            )}
                        </div>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        Don't have an account? <Link to="/signup" className="font-bold text-slate-900 hover:text-accent transition-colors">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;