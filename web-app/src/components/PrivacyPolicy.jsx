import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="selection:bg-accent/30 min-h-screen bg-slate-50 px-4 py-12 font-sans">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl md:p-12">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        Privacy Policy
                    </h1>
                </div>
                <p className="mb-8 text-sm font-medium text-slate-500">
                    Last Updated: March 24, 2026
                </p>

                <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">
                            1. Information We Collect
                        </h2>
                        <p className="leading-relaxed">
                            We collect information you provide directly to us when you create an account, 
                            submit KYC documents, or make a purchase. This includes your name, company 
                            name, GSTIN, email, phone number, and billing/shipping addresses.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">
                            2. How We Use Your Information
                        </h2>
                        <p className="leading-relaxed">
                            We use the information we collect to provide, maintain, and improve our 
                            services, to process transactions, to verify your business identity through 
                            KYC, and to communicate with you about orders and platform updates.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">
                            3. Information Sharing
                        </h2>
                        <p className="leading-relaxed">
                            We do not share your personal information with third parties except as 
                            necessary to provide our services (e.g., sharing shipping details with logistics 
                            partners) or as required by law. Business data may be used in aggregate for 
                            platform analytics.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">
                            4. Data Security
                        </h2>
                        <p className="leading-relaxed">
                            We implement industry-standard security measures to protect your account data 
                            and financial transactions. However, no method of transmission over the 
                            Internet is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-bold text-slate-900">
                            5. Your Choices
                        </h2>
                        <p className="leading-relaxed">
                            You may update your account information at any time through the Account 
                            Settings. You may also contact us to request the deletion of your account, 
                            subject to legal or contractual obligations.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
