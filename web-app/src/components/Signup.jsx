import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building2, ArrowLeft } from 'lucide-react';


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

const Signup = () => {
    const [contactMethod, setContactMethod] = useState('email');
    const [accountType, setAccountType] = useState('B2C');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [gstin, setGstin] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpValues, setOtpValues] = useState(['', '', '', '']);
    const inputRefs = useRef([]);
    const isGstinValid =
        gstin.length === 15 &&
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z0-9]{1}[0-9A-Z]{1}$/.test(
            gstin.toUpperCase()
        );

    const [otpSent, setOtpSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { register, sendOtp } = useContext(AuthContext);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const getPasswordStrength = (pass) => {
        if (pass.length === 0) return { width: '0%', color: 'transparent', label: '' };
        if (pass.length < 6) return { width: '33%', color: '#ef4444', label: 'Weak' };
        if (!/\d/.test(pass) || !/[a-zA-Z]/.test(pass))
            return { width: '66%', color: '#f59e0b', label: 'Good' };
        return { width: '100%', color: '#10b981', label: 'Strong' };
    };
    const strength = getPasswordStrength(password);

    const handleTabSwitch = (method) => {
        setContactMethod(method);
        setOtpSent(false);
        setOtpValues(['', '', '', '']);
        setCooldown(0);
    };

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
            if (focusIndex < 4) inputRefs.current[focusIndex].focus();
        }
    };

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (!phoneNumber || phoneNumber.length < 10)
            return toast.error('Please enter a valid phone number');

        setIsLoading(true);
        const res = await sendOtp(phoneNumber, false);
        setIsLoading(false);

        if (res.success) {
            setOtpSent(true);
            setCooldown(30);
            toast.success('OTP sent successfully!');
        } else toast.error(res.message);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword)
            return toast.error('Passwords do not match. Please try again.');

        if (contactMethod === 'phone') {
            if (!otpSent) return handleSendOtp();
            const finalOtp = otpValues.join('');
            if (finalOtp.length < 4) return toast.error('Please enter the full 4-digit OTP');
        }

        if (accountType === 'B2B' && gstin) {
            const gstinRegex =
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z0-9A-Z]{1}[0-9A-Z]{1}$/;
            if (!gstinRegex.test(gstin.toUpperCase()))
                return toast.error('Please enter a valid 15-character GSTIN');
        }

        setIsLoading(true);
        try {
            const userData = {
                name,
                password,
                accountType,
                ...(contactMethod === 'email'
                    ? { email }
                    : { phoneNumber, otpCode: otpValues.join('') }),
                ...(accountType === 'B2B' && {
                    companyName,
                    gstin: gstin ? gstin.toUpperCase() : undefined,
                }),
            };
            const response = await register(userData);

            if (response.success) {
                if (accountType === 'B2B') {
                    toast.success(
                        'Business Account Created! Complete KYC to unlock wholesale features.',
                        { duration: 5000 }
                    );
                } else {
                    toast.success('Account Created successfully!');
                }
                navigate('/');
            } else throw new Error(response.message || 'Failed to create account.');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-white font-sans selection:bg-emerald-500/30">
            {}
            <div className="relative hidden w-1/2 flex-col justify-between bg-slate-900 p-12 lg:flex">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="animate-blob absolute top-[10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/20 mix-blend-overlay blur-[100px] filter"></div>
                <div className="animate-blob animation-delay-4000 absolute right-[-10%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/20 mix-blend-overlay blur-[100px] filter"></div>

                <div className="relative z-10">
                    <Link to="/" className="text-2xl font-black tracking-tight text-white">
                        Sovely<span className="text-emerald-500">.</span>
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-4xl leading-[1.1] font-black text-white">
                        Source smarter. <br />{' '}
                        <span className="text-emerald-400">Scale faster.</span>
                    </h2>
                    <p className="mt-6 text-lg leading-relaxed font-medium text-slate-400">
                        Join thousands of retailers and dropshippers getting factory-direct pricing
                        and automated Pan-India fulfillment.
                    </p>
                    <div className="mt-8 flex w-fit items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 backdrop-blur-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">B2B Compliant</p>
                            <p className="text-xs font-medium text-slate-400">
                                100% genuine GST invoices for ITC.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="custom-scrollbar flex w-full flex-col overflow-y-auto px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="mx-auto w-full max-w-md pb-12"
                >
                    <motion.button
                        variants={fadeUp}
                        onClick={() => navigate(-1)}
                        className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} /> Back
                    </motion.button>

                    <motion.div variants={fadeUp} className="mb-6">
                        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                            Create Account
                        </h1>
                        <p className="font-medium text-slate-500">
                            Join us and start shopping premium collections.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        className="mb-6 flex rounded-2xl bg-slate-100 p-1"
                    >
                        <button
                            type="button"
                            onClick={() => setAccountType('B2C')}
                            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${accountType === 'B2C' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Individual
                        </button>
                        <button
                            type="button"
                            onClick={() => setAccountType('B2B')}
                            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${accountType === 'B2B' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Business (B2B)
                        </button>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        className="mb-8 flex rounded-2xl bg-slate-100 p-1"
                    >
                        <button
                            type="button"
                            onClick={() => handleTabSwitch('email')}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${contactMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Use Email
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabSwitch('phone')}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${contactMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Use Mobile
                        </button>
                    </motion.div>

                    <motion.form
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        onSubmit={handleSignup}
                        autoComplete="off"
                        className="space-y-5"
                    >
                        <motion.div variants={fadeUp} className="space-y-2">
                            <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                            />
                        </motion.div>

                        {contactMethod === 'email' ? (
                            <motion.div variants={fadeUp} className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Email Address *
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
                        ) : (
                            <motion.div variants={staggerContainer} className="space-y-5">
                                <motion.div variants={fadeUp} className="space-y-2">
                                    <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        Mobile Number *
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
                                                {cooldown > 0
                                                    ? `Resend in ${cooldown}s`
                                                    : 'Resend OTP'}
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
                            </motion.div>
                        )}

                        <motion.div variants={fadeUp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Password *
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
                                {password.length > 0 && (
                                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full transition-all duration-300"
                                            style={{
                                                width: strength.width,
                                                backgroundColor: strength.color,
                                            }}
                                        ></div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={`w-full rounded-2xl border bg-slate-50 py-3.5 pr-12 pl-5 text-sm font-medium tracking-widest text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:ring-1 ${confirmPassword && password !== confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/30'} `}
                                    />
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="pl-2 text-xs font-bold text-red-500">
                                        Passwords do not match
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        {accountType === 'B2B' && (
                            <motion.div
                                variants={fadeUp}
                                className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5"
                            >
                                <div className="space-y-2">
                                    <label className="pl-1 text-xs font-bold tracking-wider text-emerald-700 uppercase">
                                        Company / Store Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Acme Dropshipping"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required={accountType === 'B2B'}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="pl-1 text-xs font-bold tracking-wider text-emerald-700 uppercase">
                                        GSTIN (Optional for KYC Tier 1)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="22AAAAA0000A1Z5"
                                        value={gstin}
                                        onChange={(e) => setGstin(e.target.value)}
                                        maxLength="15"
                                        className={`w-full rounded-2xl border bg-white px-5 py-3.5 text-sm font-medium text-slate-900 uppercase transition-all outline-none placeholder:text-slate-400 focus:ring-1 ${
                                            gstin.length > 0
                                                ? isGstinValid
                                                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/30'
                                                    : 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                                                : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/30'
                                        }`}
                                    />
                                    {gstin.length > 0 && !isGstinValid && (
                                        <p className="pt-1 pl-2 text-xs font-bold text-red-500">
                                            Must be a valid 15-character GSTIN
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        <motion.div variants={fadeUp}>
                            <label className="group mt-4 flex cursor-pointer items-start gap-3 pl-1">
                                <div className="flex h-5 items-center">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 transition-all focus:ring-emerald-500/30"
                                    />
                                </div>
                                <span className="text-xs leading-relaxed font-medium text-slate-500">
                                    By creating an account, I agree to the{' '}
                                    <Link
                                        to="/terms"
                                        className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                                        target="_blank"
                                    >
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link
                                        to="/privacy"
                                        className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                                        target="_blank"
                                    >
                                        Privacy Policy
                                    </Link>
                                    .
                                </span>
                            </label>
                            <button
                                type="submit"
                                disabled={
                                    isLoading ||
                                    !agreedToTerms ||
                                    (confirmPassword && password !== confirmPassword)
                                }
                                className="mt-6 w-full rounded-2xl bg-slate-900 py-4 font-bold tracking-wide text-white transition-all duration-300 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading
                                    ? 'Processing...'
                                    : contactMethod === 'phone' && !otpSent
                                      ? 'Get OTP to Register'
                                      : 'Create Account'}
                            </button>
                        </motion.div>
                    </motion.form>

                    <motion.div
                        variants={fadeUp}
                        className="mt-8 border-t border-slate-100 pt-6 text-center"
                    >
                        <p className="text-sm font-medium text-slate-500">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-bold text-slate-900 transition-colors hover:text-emerald-600"
                            >
                                Sign in
                            </Link>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
