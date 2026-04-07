import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, DatabaseZap } from 'lucide-react';

const FAQ_DATA = [
    {
        q: 'What are the RTO (Return to Origin) charges?',
        a: 'RTO charges are equivalent to the forward shipping charges. If an order cannot be delivered and is returned to our fulfillment center, these logistical costs are deducted from your wallet ledger.',
    },
    {
        q: 'Are there integration fees for Shopify or WooCommerce?',
        a: 'No. Syncing products from Sovely to your storefront is entirely free via our API endpoints. You only pay the wholesale cost + shipping when an actual order is dispatched.',
    },
    {
        q: 'How does the dropshipping wallet system work?',
        a: 'Before an order can be dispatched, your wallet must contain sufficient balance to cover the wholesale product cost, shipping, and applicable GST. You load funds via standard banking methods, and funds are deducted automatically upon order confirmation.',
    },
    {
        q: 'How are COD (Cash on Delivery) orders processed?',
        a: 'For COD orders, our logistics partners collect the cash upon delivery. Once marked "Delivered", the full collected amount (minus wholesale cost and shipping fees) is credited to your Sovely wallet. You can withdraw these profits to your bank account at any time.',
    },
    {
        q: 'Why are my orders showing as "Failed to Sync"?',
        a: 'This typically indicates a mismatch between your storefront API credentials or an out-of-stock SKU. Check your integration logs or contact your account manager for a technical review.',
    },
    {
        q: 'What is the standard delivery timeline?',
        a: 'We utilize a tier-1 pan-India logistics network. Standard dispatch occurs within 48 hours, with final delivery typically taking 5-7 working days depending on the destination pincode.',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30">
            <div className="mx-auto max-w-4xl px-4 py-20 md:py-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                        <DatabaseZap size={32} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                        Technical <span className="text-emerald-500">&</span> Operational FAQ
                    </h1>
                    <p className="mt-6 text-lg font-medium text-slate-500">
                        Detailed answers regarding logistics SLAs, wallet mechanics, and API sync
                        processes.
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {FAQ_DATA.map((faq, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                                    isOpen
                                        ? 'border-emerald-500/30 bg-white shadow-lg shadow-emerald-500/5'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                                    className="flex w-full items-center justify-between p-6 text-left focus:outline-none"
                                >
                                    <span
                                        className={`pr-8 text-base font-bold sm:text-lg ${isOpen ? 'text-slate-900' : 'text-slate-700'}`}
                                    >
                                        {faq.q}
                                    </span>
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        {isOpen ? (
                                            <ChevronUp size={18} />
                                        ) : (
                                            <ChevronDown size={18} />
                                        )}
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                                        >
                                            <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                                                <p className="text-sm leading-relaxed font-medium text-slate-600 sm:text-base">
                                                    {faq.a}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
