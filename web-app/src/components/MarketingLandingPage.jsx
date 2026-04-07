import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, Truck, ArrowRight, BarChart3, Globe2 } from 'lucide-react';
import { ROUTES } from '../utils/routes';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
    },
};

const MarketingLandingPage = () => {
    return (
        <div className="flex w-full flex-col bg-white">
            {}
            <section className="relative overflow-hidden bg-slate-50 pt-20 pb-32 lg:pt-32">
                {}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {}
                <div className="animate-blob absolute top-0 -left-4 h-96 w-96 rounded-full bg-emerald-200/40 mix-blend-multiply blur-3xl filter"></div>
                <div className="animate-blob animation-delay-2000 absolute top-0 -right-4 h-96 w-96 rounded-full bg-blue-200/40 mix-blend-multiply blur-3xl filter"></div>

                <motion.div
                    className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.div
                        variants={fadeUp}
                        className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 shadow-sm"
                    >
                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-600"></span>
                        <span className="text-xs font-extrabold tracking-widest text-emerald-800 uppercase">
                            India's Fastest Growing B2B Network
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-slate-900 md:text-7xl"
                    >
                        Source Smarter. <br className="hidden md:block" />
                        <span className="text-emerald-600">Scale Faster.</span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed font-medium text-slate-600 md:text-xl"
                    >
                        Direct factory pricing, 100% verified suppliers, and seamless GST invoicing.
                        Streamline your entire supply chain or dropship directly to your customers
                        with guaranteed margins.
                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                    >
                        <Link
                            to={ROUTES.CONTACT_US}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 hover:bg-slate-800 sm:w-auto"
                        >
                            Request Account Access <ArrowRight size={18} />
                        </Link>
                        <Link
                            to={ROUTES.LOGIN}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white/80 px-8 py-4 text-base font-extrabold text-slate-700 backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                        >
                            Sign In to Dashboard
                        </Link>
                    </motion.div>

                    {}
                    <motion.div
                        variants={staggerContainer}
                        className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 border-t border-slate-200/60 pt-10 md:grid-cols-4"
                    >
                        {[
                            { stat: '500+', label: 'Verified Factories' },
                            { stat: '10k+', label: 'Active SKUs' },
                            { stat: '100%', label: 'ITC Claimable' },
                            { stat: 'Pan-India', label: 'Delivery Network' },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                variants={fadeUp}
                                className="flex flex-col items-center"
                            >
                                <h3 className="text-3xl font-black text-slate-900">{item.stat}</h3>
                                <p className="mt-1 text-xs font-bold text-slate-500 uppercase">
                                    {item.label}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {}
            <section className="py-24" id="features">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={fadeUp}
                        className="mb-16 text-center"
                    >
                        <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
                            Everything your retail business needs
                        </h2>
                        <p className="mt-4 font-medium text-slate-500">
                            Built for high-volume procurement and frictionless dropshipping.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 gap-8 md:grid-cols-3"
                    >
                        {[
                            {
                                icon: ShieldCheck,
                                color: 'indigo',
                                title: '100% GST Invoicing',
                                desc: 'Every order comes with a compliant B2B tax invoice. Claim full Input Tax Credit (ITC) effortlessly.',
                            },
                            {
                                icon: TrendingUp,
                                color: 'emerald',
                                title: 'Dropship Margin Engine',
                                desc: 'Set your own customer prices. We ship directly to your end-consumer blindly, and credit your profit.',
                            },
                            {
                                icon: Truck,
                                color: 'blue',
                                title: 'Tier-1 Logistics',
                                desc: 'From low-MOQ test orders to massive bulk freight, our pan-India fulfillment network ensures safe arrival.',
                            },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100 transition-shadow hover:shadow-xl"
                            >
                                <div
                                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-${feature.color}-50 text-${feature.color}-600`}
                                >
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="mb-3 text-xl font-extrabold text-slate-900">
                                    {feature.title}
                                </h3>
                                <p className="leading-relaxed text-slate-600">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {}
            <section className="overflow-hidden bg-slate-900 py-24 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                            variants={staggerContainer}
                        >
                            <motion.h2
                                variants={fadeUp}
                                className="text-3xl leading-tight font-black md:text-5xl"
                            >
                                Your brand. <br /> Our inventory.
                            </motion.h2>
                            <motion.p
                                variants={fadeUp}
                                className="mt-6 text-lg font-medium text-slate-400"
                            >
                                Don't want to hold stock? Use our dropshipping protocol to scale
                                your e-commerce store with zero inventory risk.
                            </motion.p>

                            <motion.ul variants={staggerContainer} className="mt-10 space-y-6">
                                {[
                                    {
                                        step: '1',
                                        title: 'Find Winning Products',
                                        desc: 'Browse our high-margin catalog and list them on your store.',
                                    },
                                    {
                                        step: '2',
                                        title: 'Set Your Price',
                                        desc: "When you get a sale, enter the customer's details and your selling price.",
                                    },
                                    {
                                        step: '3',
                                        title: 'Keep the Profit',
                                        desc: 'We deliver the product and immediately credit the margin difference to your wallet.',
                                    },
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        variants={fadeUp}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-black text-white">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold">{item.title}</h4>
                                            <p className="mt-1 text-slate-400">{item.desc}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>

                        {}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="relative rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl"
                        >
                            <div className="mb-6 flex items-center justify-between border-b border-slate-700 pb-4">
                                <h4 className="font-bold text-slate-300">Margin Configurator</h4>
                                <BarChart3 className="text-emerald-400" />
                            </div>
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex justify-between rounded-lg bg-slate-900 p-4"
                                >
                                    <span className="text-sm font-medium text-slate-400">
                                        Sourcing Cost
                                    </span>
                                    <span className="font-bold">₹450</span>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4"
                                >
                                    <span className="text-sm font-medium text-emerald-400">
                                        Your Selling Price
                                    </span>
                                    <span className="font-bold text-emerald-400">₹999</span>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
                                    className="mt-4 flex justify-between pt-4"
                                >
                                    <span className="font-bold text-slate-300">
                                        Your Net Profit
                                    </span>
                                    <span className="text-2xl font-black text-emerald-400">
                                        + ₹549
                                    </span>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                className="py-24 text-center"
            >
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <Globe2 size={48} className="mx-auto mb-6 text-slate-300" />
                    <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
                        Ready to upgrade your supply chain?
                    </h2>
                    <p className="mt-6 mb-10 text-lg font-medium text-slate-500">
                        Join thousands of retailers, resellers, and distributors scaling their
                        businesses on Sovely.
                    </p>
                    <Link
                        to={ROUTES.CONTACT_US}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-extrabold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-emerald-600/30"
                    >
                        Contact Us for Access
                    </Link>
                </div>
            </motion.section>
        </div>
    );
};

export default MarketingLandingPage;
