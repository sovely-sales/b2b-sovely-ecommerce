import React from 'react';
import { motion } from 'framer-motion';
import { Factory, Box, Rocket, ShieldCheck, Database, BarChart3 } from 'lucide-react';

const services = [
    {
        id: 1,
        icon: <Factory size={32} />,
        title: 'B2B Wholesale Procurement',
        description: 'Direct pipeline to tier-1 manufacturing.',
        detailedInfo:
            'Bypass middlemen and source inventory at true factory-gate pricing. Our platform aggregates demand to secure deep volume discounts, empowering your retail margins.',
        color: 'from-blue-500/20 to-blue-600/5',
        iconColor: 'text-blue-500',
        borderColor: 'border-blue-500/20',
    },
    {
        id: 2,
        icon: <Box size={32} />,
        title: 'Zero-Inventory Dropshipping',
        description: 'Automated fulfillment for modern merchants.',
        detailedInfo:
            'List our catalog on your storefront. When you make a sale, our system blindly dispatches the product directly to your end-consumer. You keep the margin difference instantly.',
        color: 'from-emerald-500/20 to-emerald-600/5',
        iconColor: 'text-emerald-500',
        borderColor: 'border-emerald-500/20',
    },
    {
        id: 3,
        icon: <Rocket size={32} />,
        title: 'Pan-India Logistics Engine',
        description: 'Predictable, high-speed freight delivery.',
        detailedInfo:
            'Integrated directly with top-tier courier networks. We handle everything from low-MOQ parcel delivery to multi-ton LTL freight across 20,000+ serviceable pincodes.',
        color: 'from-amber-500/20 to-amber-600/5',
        iconColor: 'text-amber-500',
        borderColor: 'border-amber-500/20',
    },
    {
        id: 4,
        icon: <ShieldCheck size={32} />,
        title: '100% ITC Compliance',
        description: 'Frictionless GST reconciliation.',
        detailedInfo:
            'Every transaction generates a standardized B2B tax invoice. Claim your Input Tax Credit (ITC) effortlessly and keep your accounting impeccably clean.',
        color: 'from-indigo-500/20 to-indigo-600/5',
        iconColor: 'text-indigo-500',
        borderColor: 'border-indigo-500/20',
    },
    {
        id: 5,
        icon: <Database size={32} />,
        title: 'API & Store Integrations',
        description: 'Connect your tech stack seamlessly.',
        detailedInfo:
            'Push products directly to Shopify, WooCommerce, or custom tech stacks via our API. Inventory levels and pricing synchronize in real-time to prevent overselling.',
        color: 'from-purple-500/20 to-purple-600/5',
        iconColor: 'text-purple-500',
        borderColor: 'border-purple-500/20',
    },
    {
        id: 6,
        icon: <BarChart3 size={32} />,
        title: 'Analytics & Forecasting',
        description: 'Data-driven sourcing decisions.',
        detailedInfo:
            'Gain access to macroeconomic category trends and sell-through rates. Make intelligent procurement decisions backed by millions of data points.',
        color: 'from-rose-500/20 to-rose-600/5',
        iconColor: 'text-rose-500',
        borderColor: 'border-rose-500/20',
    },
];

function Services() {
    return (
        <section className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30">
            <div className="bg-slate-900 px-6 py-24 text-center md:px-12 lg:px-24">
                <div className="mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2"
                    >
                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                            Platform Capabilities
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-black tracking-tight text-white md:text-6xl"
                    >
                        The Operating System for <br className="hidden sm:block" />
                        <span className="text-emerald-500">Modern Commerce.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed font-medium text-slate-400"
                    >
                        Sovely provides the end-to-end technical infrastructure you need to source
                        globally, fulfill locally, and scale your retail operations without
                        boundaries.
                    </motion.p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-24 md:px-12 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service, idx) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -8 }}
                            className={`group relative overflow-hidden rounded-3xl border ${service.borderColor} bg-white p-8 shadow-sm transition-shadow hover:shadow-2xl hover:shadow-slate-200/50`}
                        >
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                            ></div>
                            <div className="relative z-10 flex h-full w-full flex-col">
                                <div
                                    className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ${service.iconColor} transition-transform duration-300 group-hover:scale-110`}
                                >
                                    {service.icon}
                                </div>
                                <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900">
                                    {service.title}
                                </h3>
                                <p className="mb-4 text-sm font-bold tracking-wide text-slate-400 uppercase">
                                    {service.description}
                                </p>
                                <p className="flex-grow text-sm leading-relaxed font-medium text-slate-600">
                                    {service.detailedInfo}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Services;
