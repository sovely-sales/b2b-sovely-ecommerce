import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';


const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpValues, setOtpValues] = useState(['', '', '', '']);
    const inputRefs = useRef([]);
    const [showPassword, setShowPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { login, loginWithOtpReq, sendOtp } = useContext(AuthContext);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('session_expired')) {
            toast.error('Your secure session has expired. Please log in again.');
            window.history.replaceState({}, document.title, '/login');
        }
    }, [location]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otpValues];
        newOtp[index] = value;
        setOtpValues(newOtp);
        if (value && index < 3) inputRefs.current[index + 1].focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 4).replace(/\D/g, '');
        if (pastedData) {
            const newOtp = ['', '', '', ''];
            pastedData.split('').forEach((char, i) => {
                newOtp[i] = char;
            });
            setOtpValues(newOtp);
            const focusIndex = Math.min(pastedData.length, 3);
            inputRefs.current[focusIndex].focus();
        }
    };

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10)
            return toast.error('Please enter a valid 10-digit phone number');
        setIsLoading(true);
        const res = await sendOtp(phoneNumber, true);
        setIsLoading(false);

        if (res.success) {
            setOtpSent(true);
            setCooldown(30);
            toast.success('OTP sent to your mobile!');
        } else {
            toast.error(res.message);
        }
    };

    const handleTabSwitch = (method) => {
        setLoginMethod(method);
        setOtpSent(false);
        setOtpValues(['', '', '', '']);
        setCooldown(0);
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await login(email, password);
            if (response.success) {
                toast.success('Welcome back!');
                if (response.user?.role === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else throw new Error(response.message || 'Invalid credentials');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpLogin = async (e) => {
        e.preventDefault();
        const finalOtp = otpValues.join('');
        if (finalOtp.length < 4) return toast.error('Please enter the full 4-digit OTP');

        setIsLoading(true);
        try {
            const response = await loginWithOtpReq(phoneNumber, finalOtp);
            if (response.success) {
                toast.success('Welcome back!');
                if (response.user?.role === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else throw new Error(response.message || 'Invalid OTP');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
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
                    <h2 className="text-4xl leading-[1.1] font-black text-white">
                        Welcome back to your{' '}
                        <span className="text-emerald-400">supply chain command center.</span>
                    </h2>
                    <p className="mt-6 text-lg leading-relaxed font-medium text-slate-400">
                        Access wholesale pricing, track your pan-India shipments, and manage your
                        dropshipping margins all from one secure dashboard.
                    </p>
                    <div className="mt-8 flex w-fit items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 backdrop-blur-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Bank-Grade Security</p>
                            <p className="text-xs font-medium text-slate-400">
                                Your business data is encrypted & safe.
                            </p>
                        </div>
                    </div>
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
                        <ArrowLeft size={16} strokeWidth={2.5} /> Back
                    </motion.button>

                    <motion.div variants={fadeUp} className="mb-8">
                        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                            Sign In
                        </h1>
                        <p className="font-medium text-slate-500">
                            Enter your credentials to access your account.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        className="mb-8 flex rounded-2xl bg-slate-100 p-1"
                    >
                        <button
                            type="button"
                            onClick={() => handleTabSwitch('email')}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${loginMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabSwitch('phone')}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${loginMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Mobile Number
                        </button>
                    </motion.div>

                    {loginMethod === 'email' && (
                        <motion.form
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            onSubmit={handleEmailLogin}
                            autoComplete="off"
                            className="space-y-5"
                        >
                            <motion.div variants={fadeUp} className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                />
                            </motion.div>
                            <motion.div variants={fadeUp} className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-5 text-sm font-medium tracking-widest text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </motion.div>
                            <motion.div
                                variants={fadeUp}
                                className="flex items-center justify-between pt-2 pb-4"
                            >
                                <label className="group flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30"
                                    />
                                    <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                                        Remember me
                                    </span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                                >
                                    Forgot password?
                                </Link>
                            </motion.div>
                            <motion.button
                                variants={fadeUp}
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-2xl bg-slate-900 py-4 font-bold tracking-wide text-white transition-all duration-300 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </motion.button>
                        </motion.form>
                    )}

                    {loginMethod === 'phone' && (
                        <motion.form
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            onSubmit={
                                otpSent
                                    ? handleOtpLogin
                                    : (e) => {
                                          e.preventDefault();
                                          handleSendOtp();
                                      }
                            }
                            autoComplete="off"
                            className="space-y-5"
                        >
                            <motion.div variants={fadeUp} className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-5 -translate-y-1/2 font-bold text-slate-400">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="Enter 10 digit number"
                                        value={phoneNumber}
                                        onChange={(e) =>
                                            setPhoneNumber(e.target.value.replace(/\D/g, ''))
                                        }
                                        disabled={otpSent && cooldown > 0}
                                        maxLength="10"
                                        required
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-5 pl-14 text-sm font-bold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:bg-slate-100 disabled:opacity-60"
                                    />
                                </div>
                            </motion.div>

                            {otpSent && (
                                <motion.div variants={fadeUp} className="space-y-2">
                                    <div className="flex items-center justify-between pr-1 pl-1">
                                        <label className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Enter 4-Digit OTP
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={cooldown > 0 || isLoading}
                                            className="text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700 disabled:text-slate-400"
                                        >
                                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                                        </button>
                                    </div>
                                    <div
                                        className="flex justify-between gap-3"
                                        onPaste={handleOtpPaste}
                                    >
                                        {otpValues.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (inputRefs.current[index] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                maxLength="1"
                                                value={digit}
                                                onChange={(e) =>
                                                    handleOtpChange(index, e.target.value)
                                                }
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                className="w-14 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-4 text-center text-xl font-extrabold text-slate-900 transition-all outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            <motion.div variants={fadeUp} className="pt-4">
                                <button
                                    type="submit"
                                    disabled={
                                        isLoading || (otpSent && otpValues.join('').length < 4)
                                    }
                                    className="w-full rounded-2xl bg-slate-900 py-4 font-bold tracking-wide text-white transition-all duration-300 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isLoading
                                        ? otpSent
                                            ? 'Verifying...'
                                            : 'Sending...'
                                        : otpSent
                                          ? 'Verify & Login'
                                          : 'Get OTP'}
                                </button>
                            </motion.div>
                        </motion.form>
                    )}

                    <motion.div
                        variants={fadeUp}
                        className="mt-8 border-t border-slate-100 pt-6 text-center"
                    >
                        <p className="text-sm font-medium text-slate-500">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="font-bold text-slate-900 transition-colors hover:text-emerald-600"
                            >
                                Sign up
                            </Link>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
