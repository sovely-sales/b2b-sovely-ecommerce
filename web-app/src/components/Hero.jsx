import heroImg from '../assets/hero-shopping.png'; 
import { ShieldCheck, Truck, TrendingUp, Building2 } from 'lucide-react';

function Hero({ onShopNow }) {
    return (
        <section className="relative overflow-hidden bg-slate-50 pt-16 pb-24 lg:pt-24 lg:pb-32" id="hero">
            {}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-4000"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

                {}
                <div className="w-full lg:w-1/2 text-center lg:text-left z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-xs font-bold tracking-widest text-slate-700 uppercase flex items-center gap-1">
                            <Building2 size={12} /> India's Premier B2B Network
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm leading-[1.1]">
                        Source Smarter, <br className="hidden lg:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                            Scale Faster.
                        </span>
                    </h1>

                    <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
                        Direct factory pricing, verified suppliers, and seamless GST invoicing. Discover high-margin wholesale inventory for your retail business.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <button 
                            onClick={onShopNow}
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-white font-bold tracking-wide hover:bg-primary-light transition-all duration-300 shadow-lg hover:shadow-primary/30 hover:-translate-y-1"
                        >
                            Browse Wholesale Catalog
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm text-slate-900 font-bold tracking-wide border border-slate-200 hover:border-slate-300 hover:bg-white transition-all duration-300 shadow-sm flex justify-center items-center gap-2">
                            <TrendingUp size={18} /> View High-Margin Deals
                        </button>
                    </div>

                    {}
                    <div className="mt-12 grid grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
                        <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm flex items-center gap-4 hover:bg-white/60 transition-colors cursor-default">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm"><ShieldCheck size={20} /></div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900">100% Verified</p>
                                <p className="text-xs text-slate-500 font-medium">Quality-checked suppliers</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm flex items-center gap-4 hover:bg-white/60 transition-colors cursor-default">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm"><Truck size={20} /></div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900">Pan-India Transit</p>
                                <p className="text-xs text-slate-500 font-medium">Safe bulk delivery</p>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="w-full lg:w-1/2 relative mt-16 lg:mt-0 flex justify-center z-10">
                    <div className="relative w-full max-w-md aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/20 animate-float border-[8px] border-white/60 backdrop-blur-sm">
                        <img
                            src={heroImg}
                            alt="B2B Wholesale Operations"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent mix-blend-overlay"></div>
                    </div>

                    {}
                    <div className="absolute -bottom-6 -left-2 sm:left-4 bg-white/95 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center text-white font-bold shadow-inner">
                            GST
                        </div>
                        <div>
                            <p className="text-sm font-extrabold text-slate-900">Input Tax Credit</p>
                            <p className="text-xs font-medium text-slate-500">Available on all orders</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

export default Hero;