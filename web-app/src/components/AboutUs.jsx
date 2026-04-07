import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans tracking-tight selection:bg-emerald-500/30">
            {}
            <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-24 md:px-12 lg:px-24 lg:py-32">
                <div className="relative z-10 max-w-4xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                        <span className="text-xs font-black tracking-widest text-slate-500 uppercase">
                            About The Company
                        </span>
                    </div>
                    <h1 className="mb-8 text-5xl leading-tight font-black text-slate-900 md:text-7xl lg:text-8xl">
                        Redefining <br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                            B2B Commerce.
                        </span>
                    </h1>
                    <p className="mb-10 max-w-2xl text-xl leading-relaxed font-medium text-slate-600">
                        Sovely is the premier digital infrastructure for modern merchants. We bridge
                        the gap between world-class manufacturing and ambitious retail
                        entrepreneurs, providing a seamless ecosystem for wholesale sourcing and
                        automated, zero-inventory dropshipping.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to={ROUTES.CONTACT_US}
                            className="rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                        >
                            Request Account Access
                        </Link>
                        <Link
                            to={ROUTES.BECOME_SELLER}
                            className="rounded-xl border-2 border-slate-200 bg-white px-8 py-4 text-sm font-bold tracking-wide text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                            Supplier Network
                        </Link>
                    </div>
                </div>
            </section>

            {}
            <section className="border-y border-slate-200 bg-white px-6 py-24 md:px-12 lg:px-24">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
                    <div>
                        <h2 className="mb-8 text-4xl font-black text-slate-900">Our Mission</h2>
                        <div className="space-y-6 text-lg leading-relaxed font-medium text-slate-600">
                            <p>
                                We observed that starting and scaling an e-commerce business was
                                plagued by fragmented supply chains, exorbitant minimum order
                                constraints, and archaic logistics nightmares.
                            </p>
                            <p>
                                We built Sovely to act as the operating system for trade. By
                                providing 100% compliant GST invoicing, tier-1 pan-India
                                fulfillment, and a frictionless margin-engine, we empower retail
                                businesses to scale without the anchor of heavy capital expenditure.
                            </p>
                        </div>
                    </div>

                    {}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 transition-shadow hover:shadow-xl hover:shadow-slate-200/50">
                            <h3 className="mb-2 text-5xl font-black text-emerald-600">10k+</h3>
                            <p className="font-bold text-slate-900">Verified Resellers</p>
                            <p className="mt-2 text-sm font-medium text-slate-500">
                                Utilizing our technical infrastructure daily.
                            </p>
                        </div>
                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 transition-shadow hover:shadow-xl hover:shadow-slate-200/50 sm:translate-y-8">
                            <h3 className="mb-2 text-5xl font-black text-blue-600">5M+</h3>
                            <p className="font-bold text-slate-900">Products Shipped</p>
                            <p className="mt-2 text-sm font-medium text-slate-500">
                                Safely delivered across India through our logistics API.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
