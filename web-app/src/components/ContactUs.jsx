import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Building2 } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function ContactUs() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        volume: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Reference for the first input field
    const nameInputRef = useRef(null);

    // Global Keydown Listener for Type-to-Focus
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Ignore if the user is already focused on an input, textarea, or select
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (nameInputRef.current) {
                    nameInputRef.current.focus();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setFormData({ name: '', email: '', company: '', volume: '', message: '' });
            setTimeout(() => setIsSuccess(false), 5000);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30">
            <div className="bg-slate-900 pt-16 pb-24 md:pt-24">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="mx-auto max-w-7xl px-4 text-center"
                >
                    <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                        Partner with <span className="text-emerald-500">Sovely.</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-slate-400">
                        Whether you're looking to scale your dropshipping operations or source
                        wholesale inventory, our enterprise team is ready to configure your account.
                    </p>
                </motion.div>
            </div>

            <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
                <div className="-mt-12 grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-12">
                    {}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 lg:col-span-2"
                    >
                        <h3 className="mb-8 text-2xl font-black text-slate-900">
                            Global Operations
                        </h3>
                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                                        Headquarters
                                    </p>
                                    <p className="mt-1 font-medium text-slate-900">
                                        Sovely Supply Chain Pvt. Ltd.
                                        <br />
                                        123 Enterprise Avenue, Tech Park
                                        <br />
                                        Bengaluru, Karnataka 560001
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                                        Direct Line
                                    </p>
                                    <p className="mt-1 font-medium text-slate-900">
                                        +91 98765 43210
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Mon-Sat, 9am to 6pm IST
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                                        Email Desks
                                    </p>
                                    <a
                                        href="mailto:partners@sovely.com"
                                        className="mt-1 block font-bold text-emerald-600 hover:text-emerald-700"
                                    >
                                        partners@sovely.com
                                    </a>
                                    <a
                                        href="mailto:support@sovely.com"
                                        className="block font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        support@sovely.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 lg:col-span-3 lg:p-12"
                    >
                        <div className="mb-8 border-b border-slate-100 pb-8">
                            <h3 className="flex items-center gap-3 text-2xl font-black text-slate-900">
                                <Building2 className="text-emerald-500" /> Request Account Access
                            </h3>
                            <p className="mt-2 text-slate-500">
                                Submit your business details below. Start typing anywhere to focus
                                the form.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Full Name
                                    </label>
                                    <input
                                        ref={nameInputRef}
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Work Email
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                        placeholder="john@company.com"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Company / Store Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) =>
                                            setFormData({ ...formData, company: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                        placeholder="Retail Co."
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Est. Monthly Volume
                                    </label>
                                    <select
                                        required
                                        value={formData.volume}
                                        onChange={(e) =>
                                            setFormData({ ...formData, volume: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                    >
                                        <option value="" disabled>
                                            Select volume tier...
                                        </option>
                                        <option value="startup">
                                            Just starting out (0 - 50 orders/mo)
                                        </option>
                                        <option value="growing">
                                            Growing (50 - 500 orders/mo)
                                        </option>
                                        <option value="scale">
                                            Scaling (500 - 5,000 orders/mo)
                                        </option>
                                        <option value="enterprise">
                                            Enterprise (5,000+ orders/mo)
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Operational Requirements
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    value={formData.message}
                                    onChange={(e) =>
                                        setFormData({ ...formData, message: e.target.value })
                                    }
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                    placeholder="Tell us about the product categories you need, integration requirements, or current bottlenecks..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold tracking-wide text-white transition-colors duration-300 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    'Transmitting Application...'
                                ) : (
                                    <>
                                        <Send size={18} /> Submit Access Request
                                    </>
                                )}
                            </button>

                            {isSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700"
                                >
                                    Application received. An onboarding specialist will contact you
                                    shortly.
                                </motion.div>
                            )}
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
