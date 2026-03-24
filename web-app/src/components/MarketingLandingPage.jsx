import React from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    ShieldCheck,
    Truck,
    Box,
    ArrowRight,
    CheckCircle2,
    BarChart3,
    Globe2,
} from 'lucide-react';
import { ROUTES } from '../utils/routes';

const MarketingLandingPage = () => {
    return (
        <div className="flex w-full flex-col bg-white">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-slate-50 pt-20 pb-32 lg:pt-32">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 shadow-sm">
                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-600"></span>
                        <span className="text-xs font-extrabold tracking-widest text-emerald-800 uppercase">
                            India's Fastest Growing B2B Network
                        </span>
                    </div>

                    <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-slate-900 md:text-7xl">
                        Source Smarter. <br className="hidden md:block" />
                        <span className="text-emerald-600">Scale Faster.</span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed font-medium text-slate-600 md:text-xl">
                        Direct factory pricing, 100% verified suppliers, and seamless GST invoicing.
                        Streamline your entire supply chain or dropship directly to your customers
                        with guaranteed margins.
                    </p>

                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            to={ROUTES.SIGNUP}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 hover:bg-slate-800 sm:w-auto"
                        >
                            Open Free Business Account <ArrowRight size={18} />
                        </Link>
                        <Link
                            to={ROUTES.LOGIN}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-4 text-base font-extrabold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                        >
                            Sign In to Dashboard
                        </Link>
                    </div>

                    {/* Social Proof Stats */}
                    <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 border-t border-slate-200 pt-10 md:grid-cols-4">
                        <div className="flex flex-col items-center">
                            <h3 className="text-3xl font-black text-slate-900">500+</h3>
                            <p className="mt-1 text-xs font-bold text-slate-500 uppercase">
                                Verified Factories
                            </p>
                        </div>
                        <div className="flex flex-col items-center">
                            <h3 className="text-3xl font-black text-slate-900">10k+</h3>
                            <p className="mt-1 text-xs font-bold text-slate-500 uppercase">
                                Active SKUs
                            </p>
                        </div>
                        <div className="flex flex-col items-center">
                            <h3 className="text-3xl font-black text-slate-900">100%</h3>
                            <p className="mt-1 text-xs font-bold text-slate-500 uppercase">
                                ITC Claimable
                            </p>
                        </div>
                        <div className="flex flex-col items-center">
                            <h3 className="text-3xl font-black text-slate-900">Pan-India</h3>
                            <p className="mt-1 text-xs font-bold text-slate-500 uppercase">
                                Delivery Network
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* VALUE PROPS SECTION */}
            <section className="py-24" id="features">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
                            Everything your retail business needs
                        </h2>
                        <p className="mt-4 font-medium text-slate-500">
                            Built for high-volume procurement and frictionless dropshipping.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="mb-3 text-xl font-extrabold text-slate-900">
                                100% GST Invoicing
                            </h3>
                            <p className="leading-relaxed text-slate-600">
                                Every order comes with a compliant B2B tax invoice. Claim full Input
                                Tax Credit (ITC) effortlessly and keep your books clean.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <TrendingUp size={28} />
                            </div>
                            <h3 className="mb-3 text-xl font-extrabold text-slate-900">
                                Dropship Margin Engine
                            </h3>
                            <p className="leading-relaxed text-slate-600">
                                Set your own customer prices. We ship directly to your end-consumer
                                blindly, and credit your profit margins straight to your wallet.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <Truck size={28} />
                            </div>
                            <h3 className="mb-3 text-xl font-extrabold text-slate-900">
                                Tier-1 Logistics
                            </h3>
                            <p className="leading-relaxed text-slate-600">
                                From low-MOQ test orders to massive bulk freight, our pan-India
                                fulfillment network ensures your inventory arrives safely and on
                                time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS / DROPSHIP HIGHLIGHT */}
            <section className="bg-slate-900 py-24 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
                        <div>
                            <h2 className="text-3xl leading-tight font-black md:text-5xl">
                                Your brand. <br /> Our inventory.
                            </h2>
                            <p className="mt-6 text-lg font-medium text-slate-400">
                                Don't want to hold stock? Use our dropshipping protocol to scale
                                your e-commerce store with zero inventory risk.
                            </p>

                            <ul className="mt-10 space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-black text-white">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold">Find Winning Products</h4>
                                        <p className="mt-1 text-slate-400">
                                            Browse our high-margin catalog and list them on your
                                            store.
                                        </p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-black text-white">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold">Set Your Price</h4>
                                        <p className="mt-1 text-slate-400">
                                            When you get a sale, enter the customer's details and
                                            your selling price.
                                        </p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-black text-white">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold">Keep the Profit</h4>
                                        <p className="mt-1 text-slate-400">
                                            We deliver the product and immediately credit the margin
                                            difference to your wallet.
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Abstract UI Mockup */}
                        <div className="relative rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
                            <div className="mb-6 flex items-center justify-between border-b border-slate-700 pb-4">
                                <h4 className="font-bold text-slate-300">Margin Configurator</h4>
                                <BarChart3 className="text-emerald-400" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between rounded-lg bg-slate-900 p-4">
                                    <span className="text-sm font-medium text-slate-400">
                                        Sourcing Cost
                                    </span>
                                    <span className="font-bold">₹450</span>
                                </div>
                                <div className="flex justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <span className="text-sm font-medium text-emerald-400">
                                        Your Selling Price
                                    </span>
                                    <span className="font-bold text-emerald-400">₹999</span>
                                </div>
                                <div className="mt-4 flex justify-between pt-4">
                                    <span className="font-bold text-slate-300">
                                        Your Net Profit
                                    </span>
                                    <span className="text-2xl font-black text-emerald-400">
                                        + ₹549
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BOTTOM CTA */}
            <section className="py-24 text-center">
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
                        to={ROUTES.SIGNUP}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-extrabold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-emerald-700"
                    >
                        Create Your B2B Account
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default MarketingLandingPage;
