import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Users, Star, Target } from 'lucide-react';

const Careers = () => {
    const navigate = useNavigate();

    return (
        <div className="selection:bg-accent/30 min-h-screen bg-slate-50 px-4 py-12 font-sans">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-5xl font-black tracking-tight text-slate-900">
                        Join the <span className="text-emerald-600">Sovely</span> Team
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg font-medium text-slate-500">
                        We're building the future of B2B e-commerce and dropshipping. We're looking 
                        for passionate individuals to help us scale.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl transition-transform hover:-translate-y-1">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Star size={24} />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-900">Culture first</h3>
                        <p className="text-sm font-medium leading-relaxed text-slate-500">
                            We believe in autonomy, ownership, and building a supportive environment 
                            where everyone can thrive.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl transition-transform hover:-translate-y-1">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Target size={24} />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-900">Big Impact</h3>
                        <p className="text-sm font-medium leading-relaxed text-slate-500">
                            Your work will directly enable thousands of small businesses to scale 
                            and succeed in the digital economy.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl transition-transform hover:-translate-y-1">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                            <Users size={24} />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-900">Expert Team</h3>
                        <p className="text-sm font-medium leading-relaxed text-slate-500">
                            Work alongside some of the best minds in logistics, fintech, and 
                            e-commerce technology.
                        </p>
                    </div>
                </div>

                <div className="mt-16 space-y-6">
                    <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
                        <Briefcase size={24} className="text-emerald-600" /> Open Roles
                    </h2>
                    
                    <div className="space-y-4">
                        {[
                            { title: 'Senior Frontend Engineer', dept: 'Engineering', type: 'Full-time' },
                            { title: 'Product Manager', dept: 'Product', type: 'Full-time' },
                            { title: 'Operations Specialist', dept: 'Logistics', type: 'Remote' },
                        ].map((role) => (
                            <div
                                key={role.title}
                                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition-all hover:border-emerald-300 hover:shadow-lg"
                            >
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600">
                                        {role.title}
                                    </h3>
                                    <div className="mt-1 flex gap-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        <span>{role.dept}</span>
                                        <span>•</span>
                                        <span>{role.type}</span>
                                    </div>
                                </div>
                                <button className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-emerald-600">
                                    Apply
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-16 rounded-[2rem] bg-slate-900 p-8 text-center text-white md:p-12">
                    <h2 className="mb-4 text-3xl font-black">Don't see a role?</h2>
                    <p className="mb-8 text-lg font-medium text-slate-400">
                        Join our talent community and be the first to know about new opportunities.
                    </p>
                    <button className="rounded-2xl bg-emerald-500 px-10 py-4 text-sm font-black tracking-widest uppercase transition-all hover:scale-105 hover:bg-emerald-400">
                        Send Your CV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Careers;
