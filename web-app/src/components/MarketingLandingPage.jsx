import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    TrendingUp,
    ShieldCheck,
    Truck,
    ArrowRight,
    BarChart3,
    Globe2,
    Search,
    LayoutGrid,
    Zap,
    Box,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="flex w-full flex-col bg-slate-50 font-sans selection:bg-emerald-500/30">
            {/* HERO SECTION */}
            <section className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden bg-slate-50 pt-20 pb-32">
                {/* Light Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:60px_60px]"></div>

                {/* Soft Aurora Blobs */}
                <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-full max-w-7xl -translate-x-1/2 opacity-70">
                    <motion.div
                        className="absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-100 blur-[100px] filter md:h-[600px] md:w-[600px]"
                        animate={{
                            x: [0, 40, -20, 0],
                            y: [0, -30, 20, 0],
                            scale: [1, 1.05, 0.95, 1],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute top-[0%] right-[-10%] h-[400px] w-[400px] rounded-full bg-blue-50 blur-[100px] filter md:h-[600px] md:w-[600px]"
                        animate={{
                            x: [0, -30, 30, 0],
                            y: [0, 40, -20, 0],
                            scale: [1, 0.95, 1.05, 1],
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    />
                </div>

                <motion.div
                    style={{ y: yHero }}
                    className="relative z-10 mx-auto mt-10 max-w-7xl px-4 text-center sm:px-6 lg:px-8"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.div
                        variants={fadeUp}
                        className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-5 py-2 shadow-sm backdrop-blur-md"
                    >
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-black tracking-widest text-emerald-800 uppercase">
                            INDIA'S FASTEST GROWING B2B NETWORK
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        className="mx-auto max-w-5xl text-6xl leading-[1.05] font-black tracking-tight text-slate-900 md:text-[5.5rem]"
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

                    {}
                    <motion.div variants={fadeUp} className="relative mx-auto mt-10 max-w-2xl">
                        <form
                            onSubmit={handleSearch}
                            className="relative flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/50 transition-all focus-within:ring-2 focus-within:ring-emerald-500/50"
                        >
                            <div className="pl-5 text-slate-400">
                                <Search size={22} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products, SKUs, or factories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-full w-full bg-transparent px-4 py-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                className="mr-1 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-95"
                            >
                                Search
                            </button>
                        </form>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        className="mt-8 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row"
                    >
                        <Link
                            to={ROUTES.CATALOG}
                            className="flex items-center gap-2 font-bold text-emerald-700 transition-colors hover:text-emerald-800"
                        >
                            <LayoutGrid size={16} strokeWidth={2.5} /> Or Browse All Categories
                        </Link>
                        <span className="hidden text-slate-300 sm:block">&middot;</span>
                        <Link
                            to={ROUTES.CONTACT_US}
                            className="font-bold text-slate-500 transition-colors hover:text-slate-700"
                        >
                            Contact us for bulk pricing
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {}
            <section className="relative py-32" id="features">
                <div className="absolute inset-0 bg-slate-50"></div>
                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={fadeUp}
                        className="mb-20 max-w-2xl"
                    >
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                            Everything your retail business needs
                        </h2>
                        <p className="mt-6 text-lg font-medium text-slate-500">
                            Built from the ground up for high-volume procurement and frictionless
                            dropshipping. We handle the complexity, you focus on sales.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 gap-6 md:grid-cols-3"
                    >
                        {}
                        <motion.div
                            variants={fadeUp}
                            className="group relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-12 md:col-span-2"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                            <TrendingUp className="mb-8 text-emerald-400" size={48} />
                            <h3 className="mb-4 text-3xl font-black tracking-tight md:text-4xl">
                                Dropship Margin Engine
                            </h3>
                            <p className="relative z-10 max-w-md text-lg leading-relaxed text-slate-400">
                                Set your own customer prices. We ship directly to your end-consumer
                                blindly, and instantly credit the profit to your wallet.
                            </p>

                            {}
                            <div className="pointer-events-none absolute right-0 bottom-0 translate-x-10 translate-y-10 transform p-8 opacity-10 transition-transform duration-700 group-hover:translate-x-0 group-hover:translate-y-0">
                                <Box size={240} />
                            </div>
                        </motion.div>

                        {}
                        <motion.div
                            variants={fadeUp}
                            className="group relative overflow-hidden rounded-[2rem] border border-emerald-100/50 bg-emerald-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                            <ShieldCheck className="mb-6 text-emerald-600" size={36} />
                            <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900">
                                100% GST Invoicing
                            </h3>
                            <p className="font-medium text-slate-600">
                                Every order comes with a compliant B2B tax invoice. Claim full Input
                                Tax Credit effortlessly.
                            </p>
                        </motion.div>

                        {}
                        <motion.div
                            variants={fadeUp}
                            className="group rounded-[2rem] border border-slate-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                        >
                            <Truck className="mb-6 text-blue-500" size={36} />
                            <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900">
                                Tier-1 Logistics
                            </h3>
                            <p className="font-medium text-slate-600">
                                From low-MOQ test orders to massive bulk freight, our pan-India
                                network ensures safe arrival.
                            </p>
                        </motion.div>

                        {}
                        <motion.div
                            variants={fadeUp}
                            className="group flex flex-col items-center gap-10 rounded-[2rem] border border-slate-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl sm:flex-row sm:p-12 md:col-span-2"
                        >
                            <div className="flex-1">
                                <Zap className="mb-6 text-amber-500" size={36} />
                                <h3 className="mb-4 text-3xl font-black tracking-tight text-slate-900">
                                    Zero Inventory Risk
                                </h3>
                                <p className="text-lg font-medium text-slate-600">
                                    Test hundreds of products without buying stock upfront. You only
                                    pay us when you actually make a sale.
                                </p>
                            </div>
                            <div className="relative w-full flex-1 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6">
                                {}
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="h-2.5 w-24 rounded-full bg-slate-200"></div>
                                    <div className="h-2.5 w-12 rounded-full bg-amber-200"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex h-12 w-full items-center rounded-xl border border-slate-100 bg-white px-4 shadow-sm">
                                        <div className="h-2 w-16 rounded-full bg-slate-200"></div>
                                    </div>
                                    <div className="flex h-12 w-[80%] items-center rounded-xl border border-slate-100 bg-white px-4 shadow-sm">
                                        <div className="h-2 w-32 rounded-full bg-slate-200"></div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent"></div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {}
            <section className="relative overflow-hidden bg-slate-950 py-32 text-white">
                {}
                <div className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-900/20 blur-[120px]"></div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-20 lg:grid-cols-2 lg:items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                            variants={staggerContainer}
                        >
                            <motion.h2
                                variants={fadeUp}
                                className="text-4xl leading-[1.1] font-black tracking-tight md:text-6xl"
                            >
                                Your brand. <br />
                                <span className="text-slate-500">Our inventory.</span>
                            </motion.h2>
                            <motion.p
                                variants={fadeUp}
                                className="mt-8 max-w-lg text-xl leading-relaxed font-medium text-slate-400"
                            >
                                Don't want to hold stock? Use our advanced dropshipping protocol to
                                scale your e-commerce store with absolute zero inventory risk.
                            </motion.p>

                            <motion.ul
                                variants={staggerContainer}
                                className="relative mt-12 space-y-8 before:absolute before:inset-y-2 before:left-5 before:w-0.5 before:bg-slate-800"
                            >
                                {[
                                    {
                                        title: 'Find Winning Products',
                                        desc: 'Browse our high-margin catalog and list them on your store.',
                                    },
                                    {
                                        title: 'Set Your Price',
                                        desc: "When you get a sale, enter the customer's details and your selling price.",
                                    },
                                    {
                                        title: 'Keep the Profit',
                                        desc: 'We deliver the product and immediately credit the margin difference to your wallet.',
                                    },
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        variants={fadeUp}
                                        className="relative flex items-start gap-6"
                                    >
                                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-slate-900 font-black text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                            {i + 1}
                                        </div>
                                        <div className="pt-1.5">
                                            <h4 className="text-xl font-bold text-white">
                                                {item.title}
                                            </h4>
                                            <p className="mt-2 leading-relaxed text-slate-400">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>

                        {}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative"
                            style={{ perspective: 1000 }}
                        >
                            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-tr from-emerald-600 to-teal-900 opacity-30 blur-2xl"></div>
                            <div className="relative rounded-[2rem] border border-slate-800 bg-[#0A0F1C] p-2 shadow-2xl backdrop-blur-xl">
                                <div className="rounded-[1.75rem] border border-slate-800/50 bg-slate-900/50 p-8">
                                    <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1.5">
                                                <div className="h-3 w-3 rounded-full bg-slate-700"></div>
                                                <div className="h-3 w-3 rounded-full bg-slate-700"></div>
                                                <div className="h-3 w-3 rounded-full bg-slate-700"></div>
                                            </div>
                                            <h4 className="ml-2 text-sm font-bold text-slate-300">
                                                Terminal / Config
                                            </h4>
                                        </div>
                                        <BarChart3 className="text-emerald-400" size={18} />
                                    </div>

                                    <div className="space-y-4 font-mono text-sm">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-5"
                                        >
                                            <span className="text-slate-400">
                                                &gt; Sourcing_Cost
                                            </span>
                                            <span className="font-bold text-white">₹450.00</span>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 }}
                                            className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5"
                                        >
                                            <span className="text-emerald-400">
                                                &gt; Selling_Price (Input)
                                            </span>
                                            <span className="animate-pulse font-bold text-emerald-400">
                                                ₹999.00_
                                            </span>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1.2, type: 'spring' }}
                                            className="mt-6 flex items-center justify-between border-t border-dashed border-slate-800 pt-6"
                                        >
                                            <span className="font-bold text-slate-300">
                                                <CheckCircle2
                                                    className="mr-2 inline text-emerald-500"
                                                    size={16}
                                                />{' '}
                                                Net_Profit_Credited
                                            </span>
                                            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-3xl font-black text-transparent">
                                                + ₹549.00
                                            </span>
                                        </motion.div>
                                    </div>
                                </div>
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
                className="relative overflow-hidden bg-white py-32 text-center"
            >
                <div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-emerald-50 opacity-50 blur-[100px]"></div>
                <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <Globe2 size={56} className="mx-auto mb-8 text-emerald-200" />
                    <h2 className="text-5xl leading-tight font-black tracking-tighter text-slate-900 md:text-7xl">
                        Ready to upgrade your supply chain?
                    </h2>
                    <p className="mx-auto mt-8 mb-12 max-w-2xl text-xl leading-relaxed font-medium text-slate-500">
                        Join thousands of modern retailers, resellers, and distributors scaling
                        their businesses rapidly on Sovely.
                    </p>
                    <Link
                        to={ROUTES.CONTACT_US}
                        className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 text-lg font-black text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/30"
                    >
                        Contact Us for Access
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </motion.section>
        </div>
    );
};

export default MarketingLandingPage;
