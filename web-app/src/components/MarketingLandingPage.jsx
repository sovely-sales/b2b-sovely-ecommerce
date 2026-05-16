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
    Sparkles
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
            <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-slate-950 pt-20 pb-32">
                {/* Cyberpunk Grid Background & Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-20 mix-blend-overlay"></div>

                {/* Cyberpunk Aurora Blobs using Framer Motion */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] opacity-50 pointer-events-none">
                    <motion.div 
                        className="absolute top-[0%] left-[10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-emerald-600 rounded-full filter blur-[100px] md:blur-[140px]"
                        animate={{ x: [0, 60, -40, 0], y: [0, -50, 40, 0], scale: [1, 1.1, 0.9, 1] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div 
                        className="absolute top-[10%] right-[10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-emerald-500 rounded-full filter blur-[100px] md:blur-[140px]"
                        animate={{ x: [0, -50, 50, 0], y: [0, 60, -30, 0], scale: [1, 0.9, 1.1, 1] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    />
                    <motion.div 
                        className="absolute bottom-[-20%] left-[30%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-green-500 rounded-full filter blur-[100px] md:blur-[140px]"
                        animate={{ x: [0, 40, -60, 0], y: [0, 40, -50, 0], scale: [1, 1.2, 0.8, 1] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                    />
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute bg-emerald-400/30 rounded-full blur-[1px]"
                            style={{
                                width: Math.random() * 6 + 2 + 'px',
                                height: Math.random() * 6 + 2 + 'px',
                                left: Math.random() * 100 + '%',
                                top: Math.random() * 100 + '%',
                            }}
                            animate={{
                                y: [0, Math.random() * -100 - 50],
                                x: [0, Math.random() * 50 - 25],
                                opacity: [0, 0.8, 0],
                                scale: [0, 1.5, 0],
                            }}
                            transition={{
                                duration: Math.random() * 5 + 5,
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * 5,
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    style={{ y: yHero }}
                    className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 mt-10"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.div
                        variants={fadeUp}
                        className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-900/50 backdrop-blur-md px-4 py-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all hover:bg-slate-800"
                    >
                        <Sparkles size={14} className="text-emerald-400" />
                        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                            The Next-Gen B2B Sourcing Protocol
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        className="mx-auto max-w-5xl text-6xl font-black tracking-tighter text-white md:text-8xl leading-[1.1]"
                    >
                        Source Smarter. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                            Scale Faster.
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        className="mx-auto mt-8 max-w-2xl text-lg md:text-xl font-medium text-slate-400 leading-relaxed"
                    >
                        Direct factory pricing, 100% verified suppliers, and seamless GST invoicing.
                        Streamline your entire supply chain or dropship directly to your customers
                        with guaranteed margins.
                    </motion.p>

                    {/* Cyberpunk Glassmorphic Search Bar */}
                    <motion.div variants={fadeUp} className="mx-auto mt-12 max-w-2xl relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                        <form
                            onSubmit={handleSearch}
                            className="relative flex items-center overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900/80 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/50"
                        >
                            <div className="pl-6 text-slate-400">
                                <Search size={24} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products, SKUs, or factories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent px-5 py-6 text-lg font-bold text-white outline-none placeholder:font-medium placeholder:text-slate-500 h-full"
                            />
                            <button
                                type="submit"
                                className="mr-3 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white transition-all hover:bg-emerald-500 active:scale-95 flex items-center gap-2 group/btn"
                            >
                                Search
                                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row"
                    >
                        <Link
                            to={ROUTES.CATALOG}
                            className="flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-emerald-400"
                        >
                            <LayoutGrid size={18} /> Browse All Categories
                        </Link>
                        <span className="hidden h-1.5 w-1.5 rounded-full bg-slate-700 sm:block"></span>
                        <Link
                            to={ROUTES.CONTACT_US}
                            className="text-sm font-bold text-slate-400 transition-colors hover:text-emerald-400"
                        >
                            Contact us for bulk pricing
                        </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        variants={staggerContainer}
                        className="mx-auto mt-24 grid max-w-4xl grid-cols-2 gap-8 border-t border-slate-200/60 pt-12 md:grid-cols-4"
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
                                <h3 className="text-4xl font-black text-white tracking-tight">{item.stat}</h3>
                                <p className="mt-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                                    {item.label}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* FEATURES SECTION (BENTO GRID) */}
            <section className="py-32 relative" id="features">
                <div className="absolute inset-0 bg-slate-50"></div>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={fadeUp}
                        className="mb-20 max-w-2xl"
                    >
                        <h2 className="text-4xl font-black text-slate-900 md:text-5xl tracking-tight">
                            Everything your retail business needs
                        </h2>
                        <p className="mt-6 text-lg font-medium text-slate-500">
                            Built from the ground up for high-volume procurement and frictionless dropshipping. We handle the complexity, you focus on sales.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {/* Large Featured Card */}
                        <motion.div variants={fadeUp} className="md:col-span-2 rounded-[2rem] bg-slate-900 text-white p-8 sm:p-12 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <TrendingUp className="text-emerald-400 mb-8" size={48} />
                            <h3 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Dropship Margin Engine</h3>
                            <p className="text-slate-400 text-lg max-w-md relative z-10 leading-relaxed">
                                Set your own customer prices. We ship directly to your end-consumer blindly, and instantly credit the profit to your wallet.
                            </p>
                            
                            {/* Abstract decorative graphic */}
                            <div className="absolute right-0 bottom-0 p-8 opacity-10 transform translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700 pointer-events-none">
                                <Box size={240} />
                            </div>
                        </motion.div>

                        {/* Small Card 1 */}
                        <motion.div variants={fadeUp} className="rounded-[2rem] bg-emerald-50 border border-emerald-100/50 p-8 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <ShieldCheck className="text-emerald-600 mb-6" size={36} />
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">100% GST Invoicing</h3>
                            <p className="text-slate-600 font-medium">
                                Every order comes with a compliant B2B tax invoice. Claim full Input Tax Credit effortlessly.
                            </p>
                        </motion.div>

                        {/* Small Card 2 */}
                        <motion.div variants={fadeUp} className="rounded-[2rem] bg-white border border-slate-200/60 shadow-sm p-8 group hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <Truck className="text-blue-500 mb-6" size={36} />
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Tier-1 Logistics</h3>
                            <p className="text-slate-600 font-medium">
                                From low-MOQ test orders to massive bulk freight, our pan-India network ensures safe arrival.
                            </p>
                        </motion.div>

                        {/* Wide Card */}
                        <motion.div variants={fadeUp} className="md:col-span-2 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-10 group hover:shadow-xl transition-all duration-300">
                            <div className="flex-1">
                                <Zap className="text-amber-500 mb-6" size={36} />
                                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Zero Inventory Risk</h3>
                                <p className="text-slate-600 font-medium text-lg">Test hundreds of products without buying stock upfront. You only pay us when you actually make a sale.</p>
                            </div>
                            <div className="flex-1 w-full bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 relative overflow-hidden">
                                {/* Mock UI Elements */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="h-2.5 w-24 bg-slate-200 rounded-full"></div>
                                    <div className="h-2.5 w-12 bg-amber-200 rounded-full"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-12 w-full bg-white rounded-xl shadow-sm border border-slate-100 flex items-center px-4"><div className="h-2 w-16 bg-slate-200 rounded-full"></div></div>
                                    <div className="h-12 w-[80%] bg-white rounded-xl shadow-sm border border-slate-100 flex items-center px-4"><div className="h-2 w-32 bg-slate-200 rounded-full"></div></div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent"></div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* DARK PROTOCOL SECTION */}
            <section className="overflow-hidden bg-slate-950 py-32 text-white relative">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 gap-20 lg:grid-cols-2 lg:items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                            variants={staggerContainer}
                        >
                            <motion.h2
                                variants={fadeUp}
                                className="text-4xl leading-[1.1] font-black md:text-6xl tracking-tight"
                            >
                                Your brand. <br /> 
                                <span className="text-slate-500">Our inventory.</span>
                            </motion.h2>
                            <motion.p
                                variants={fadeUp}
                                className="mt-8 text-xl font-medium text-slate-400 leading-relaxed max-w-lg"
                            >
                                Don't want to hold stock? Use our advanced dropshipping protocol to scale
                                your e-commerce store with absolute zero inventory risk.
                            </motion.p>

                            <motion.ul variants={staggerContainer} className="mt-12 space-y-8 relative before:absolute before:inset-y-2 before:left-5 before:w-0.5 before:bg-slate-800">
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
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 border-2 border-emerald-500 font-black text-emerald-400 relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                            {i + 1}
                                        </div>
                                        <div className="pt-1.5">
                                            <h4 className="text-xl font-bold text-white">{item.title}</h4>
                                            <p className="mt-2 text-slate-400 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>

                        {/* Sleek Terminal / Dashboard Mockup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative"
                            style={{ perspective: 1000 }}
                        >
                            <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-600 to-teal-900 rounded-[2.5rem] blur-2xl opacity-30"></div>
                            <div className="relative rounded-[2rem] border border-slate-800 bg-[#0A0F1C] p-2 shadow-2xl backdrop-blur-xl">
                                <div className="rounded-[1.75rem] border border-slate-800/50 bg-slate-900/50 p-8">
                                    <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                            </div>
                                            <h4 className="font-bold text-slate-300 text-sm ml-2">Terminal / Config</h4>
                                        </div>
                                        <BarChart3 className="text-emerald-400" size={18} />
                                    </div>
                                    
                                    <div className="space-y-4 font-mono text-sm">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex justify-between items-center rounded-xl bg-slate-900 p-5 border border-slate-800"
                                        >
                                            <span className="text-slate-400">
                                                > Sourcing_Cost
                                            </span>
                                            <span className="font-bold text-white">₹450.00</span>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 }}
                                            className="flex justify-between items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5"
                                        >
                                            <span className="text-emerald-400">
                                                > Selling_Price (Input)
                                            </span>
                                            <span className="font-bold text-emerald-400 animate-pulse">₹999.00_</span>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1.2, type: 'spring' }}
                                            className="mt-6 flex justify-between items-center pt-6 border-t border-slate-800 border-dashed"
                                        >
                                            <span className="font-bold text-slate-300">
                                                <CheckCircle2 className="inline mr-2 text-emerald-500" size={16}/> Net_Profit_Credited
                                            </span>
                                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
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

            {/* CTA SECTION */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                className="py-32 text-center relative overflow-hidden bg-white"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-50 rounded-full blur-[100px] pointer-events-none opacity-50"></div>
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <Globe2 size={56} className="mx-auto mb-8 text-emerald-200" />
                    <h2 className="text-5xl font-black text-slate-900 md:text-7xl tracking-tighter leading-tight">
                        Ready to upgrade your supply chain?
                    </h2>
                    <p className="mt-8 mb-12 text-xl font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Join thousands of modern retailers, resellers, and distributors scaling their
                        businesses rapidly on Sovely.
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
