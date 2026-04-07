import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, RotateCcw, Wallet, Truck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';

const CATEGORIES = [
    { icon: Package, title: 'Order Operations', desc: 'Tracking & Fulfillment SLA' },
    { icon: RotateCcw, title: 'RTO & Returns', desc: 'Claim processes & policies' },
    { icon: Wallet, title: 'Ledger & Payouts', desc: 'Wallet withdrawals & taxation' },
    { icon: Truck, title: 'Freight & Logistics', desc: 'Carriers, LTL & timelines' },
];

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30">
            <div className="bg-slate-900 py-20 text-white md:py-32">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black tracking-tight md:text-6xl"
                    >
                        Enterprise Support <span className="text-emerald-500">Portal.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-6 text-lg font-medium text-slate-400"
                    >
                        Search our knowledge base for operational guidelines and technical
                        documentation.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative mx-auto mt-10 max-w-2xl"
                    >
                        <Search
                            className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400"
                            size={24}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for policies, integration docs, or tracking..."
                            className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-14 py-5 text-lg font-medium text-white shadow-2xl transition-colors outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500/30"
                        />
                    </motion.div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {CATEGORIES.map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -4 }}
                                className="group flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-colors hover:border-emerald-500/30 hover:shadow-xl hover:shadow-slate-200/50"
                            >
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition-colors group-hover:bg-emerald-500/10 group-hover:text-emerald-600">
                                    <Icon size={32} />
                                </div>
                                <h3 className="mb-2 font-black text-slate-900">{cat.title}</h3>
                                <p className="text-sm font-medium text-slate-500">{cat.desc}</p>
                            </motion.button>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto mt-20 max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/50"
                >
                    <h3 className="mb-4 text-2xl font-black text-slate-900">
                        Require Account Intervention?
                    </h3>
                    <p className="mx-auto mb-8 max-w-2xl font-medium text-slate-500">
                        If you are an active merchant facing API sync issues or require a manual
                        ledger reconciliation, please raise a ticket directly with your assigned
                        account manager.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            to="/faq"
                            className="flex items-center gap-2 rounded-xl bg-slate-100 px-8 py-4 font-bold text-slate-900 transition-colors hover:bg-slate-200"
                        >
                            Read FAQs
                        </Link>
                        <Link
                            to={ROUTES.CONTACT_US}
                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 font-bold text-white shadow-md transition-colors hover:bg-slate-800"
                        >
                            Open Support Ticket <ArrowRight size={18} />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
