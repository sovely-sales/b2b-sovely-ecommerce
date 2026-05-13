import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Factory, Banknote, Truck, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function BecomeSeller() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        company: '',
        gstin: '',
        name: '',
        email: '',
        phone: '',
        category: 'Electronics & Gadgets',
    });

    const perks = [
        {
            icon: Banknote,
            title: 'Zero Commission Procurement',
            desc: 'We operate on a transparent markup model. You keep exactly your listed wholesale price.',
        },
        {
            icon: Truck,
            title: 'Enterprise Logistics',
            desc: 'Tap into our reverse-optimized logistics API. We pick up from your factory and deliver to 20,000+ pincodes.',
        },
        {
            icon: ShieldCheck,
            title: 'Verified B2B Demand',
            desc: 'No window shoppers. Your inventory is exposed exclusively to verified retailers and high-volume dropshippers.',
        },
        {
            icon: Factory,
            title: 'Supplier Command Center',
            desc: 'Access real-time forecasting, automated GST reconciliation, and next-day payout ledgers.',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30">
            {}
            <div className="relative overflow-hidden bg-slate-900 py-24 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="relative mx-auto max-w-7xl px-4 text-center lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2"
                    >
                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                            Supplier Network
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl leading-tight font-black md:text-6xl"
                    >
                        Scale your manufacturing. <br />
                        <span className="text-slate-400">We'll handle distribution.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-6 max-w-2xl text-lg font-medium text-slate-400"
                    >
                        Plug your inventory into India's fastest-growing B2B dropshipping grid.
                        Reach thousands of active merchants instantly.
                    </motion.p>
                </div>
            </div>

            {}
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
                    {}
                    <div>
                        <h2 className="mb-10 text-3xl font-black text-slate-900">
                            The infrastructure you need.
                        </h2>
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                            {perks.map((perk, idx) => {
                                const Icon = perk.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative"
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-800 transition-colors hover:bg-emerald-100 hover:text-emerald-700">
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="mb-2 text-lg font-bold text-slate-900">
                                            {perk.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed font-medium text-slate-500">
                                            {perk.desc}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {}
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 lg:p-10">
                        {step === 1 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <h3 className="mb-2 text-2xl font-black text-slate-900">
                                    Apply for Supplier Access
                                </h3>
                                <p className="mb-8 text-sm font-medium text-slate-500">
                                    Our procurement team audits all suppliers to ensure quality and
                                    ITC compliance.
                                </p>

                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        setIsSubmitting(true);
                                        try {
                                            const payload = {
                                                name: formData.name,
                                                email: formData.email,
                                                phone: formData.phone,
                                                company: formData.company,
                                                volume: 'seller', // Indicator for seller request
                                                message: `GSTIN: ${formData.gstin} | Category: ${formData.category}`,
                                            };
                                            const response = await api.post(
                                                '/access-requests',
                                                payload
                                            );
                                            if (response.data.success) {
                                                setStep(2);
                                            }
                                        } catch (error) {
                                            console.error('Seller application error:', error);
                                            toast.error(
                                                error.response?.data?.message ||
                                                    'Failed to submit application'
                                            );
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            Manufacturing / Company Name
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) =>
                                                setFormData({ ...formData, company: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                            placeholder="Acme Manufacturing Ltd."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                GSTIN
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.gstin}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        gstin: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium tracking-widest text-slate-900 uppercase transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                                placeholder="22AAAAA0000A1Z5"
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
                                                    setFormData({
                                                        ...formData,
                                                        email: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                                placeholder="vendor@company.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Contact Person
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                                placeholder="Full Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Phone Number
                                            </label>
                                            <input
                                                required
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, phone: e.target.value })
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                                placeholder="+91"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            Primary Category
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) =>
                                                setFormData({ ...formData, category: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                                        >
                                            <option>Electronics & Gadgets</option>
                                            <option>Home & Kitchen Appliances</option>
                                            <option>Fashion & Apparel</option>
                                            <option>Industrial & Hardware</option>
                                            <option>Beauty & Personal Care</option>
                                            <option>Other / Mixed</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold tracking-wide text-white shadow-md transition-all duration-300 hover:bg-slate-800 hover:shadow-lg disabled:opacity-70"
                                    >
                                        {isSubmitting ? (
                                            'Transmitting Application...'
                                        ) : (
                                            <>
                                                Submit Application <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex h-full flex-col items-center justify-center py-10 text-center"
                            >
                                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-inner">
                                    <CheckCircle2 size={48} strokeWidth={2.5} />
                                </div>
                                <h3 className="mb-3 text-2xl font-black text-slate-900">
                                    Application Logged.
                                </h3>
                                <p className="leading-relaxed font-medium text-slate-500">
                                    Our procurement team will verify your GSTIN against the national
                                    registry. Expect a call from our onboarding managers within 48
                                    hours to discuss API integrations and catalog ingestions.
                                </p>
                                <button
                                    onClick={() => setStep(1)}
                                    className="mt-10 text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                                >
                                    &larr; Submit another business entity
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
