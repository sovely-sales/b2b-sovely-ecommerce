import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-16 font-sans selection:bg-emerald-500/30">
            <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-16">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-10 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                            Privacy Policy
                        </h1>
                        <p className="mt-2 text-sm font-bold tracking-wider text-slate-400 uppercase">
                            Last Updated: April 2026
                        </p>
                    </div>
                </div>

                <div className="space-y-8 font-medium text-slate-600">
                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">
                            1. Information We Collect
                        </h2>
                        <p className="leading-relaxed">
                            We collect information you provide directly to us when you create an
                            account, submit KYC documents, or make a purchase. This includes your
                            name, company name, GSTIN, email, phone number, and billing/shipping
                            addresses.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">
                            2. How We Use Your Information
                        </h2>
                        <p className="leading-relaxed">
                            We use the information we collect to provide, maintain, and improve our
                            services, to process transactions, to verify your business identity
                            through KYC, and to communicate with you about orders and platform
                            updates.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">
                            3. Information Sharing
                        </h2>
                        <p className="leading-relaxed">
                            We do not share your personal information with third parties except as
                            necessary to provide our services (e.g., sharing shipping details with
                            logistics partners) or as required by law. Business data may be used in
                            aggregate for platform analytics.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">4. Data Security</h2>
                        <p className="leading-relaxed">
                            We implement industry-standard security measures to protect your account
                            data and financial transactions. However, no method of transmission over
                            the Internet is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">5. Your Choices</h2>
                        <p className="leading-relaxed">
                            You may update your account information at any time through the Account
                            Settings. You may also contact us to request the deletion of your
                            account, subject to legal or contractual obligations.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
