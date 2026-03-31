import heroImg from '../assets/hero-shopping.png';
import { ShieldCheck, Truck, UploadCloud, Building2 } from 'lucide-react';

function Hero({ onShopNow }) {
    return (
        <section
            className="relative overflow-hidden bg-slate-50 pt-16 pb-24 lg:pt-24 lg:pb-32"
            id="hero"
        >
            <div className="animate-blob absolute top-0 -left-4 h-72 w-72 rounded-full bg-blue-300 opacity-60 mix-blend-multiply blur-2xl filter"></div>
            <div className="animate-blob animation-delay-2000 absolute top-0 -right-4 h-72 w-72 rounded-full bg-emerald-300 opacity-60 mix-blend-multiply blur-2xl filter"></div>
            <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-indigo-300 opacity-60 mix-blend-multiply blur-2xl filter"></div>

            <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">
                <div className="z-10 w-full text-center lg:w-1/2 lg:text-left">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md">
                        <span className="bg-primary flex h-2 w-2 animate-pulse rounded-full"></span>
                        <span className="flex items-center gap-1 text-xs font-bold tracking-widest text-slate-700 uppercase">
                            <Building2 size={12} /> Your Dedicated Procurement Partner
                        </span>
                    </div>

                    <h1 className="mb-6 text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 drop-shadow-sm md:text-6xl lg:text-7xl">
                        Source Smarter, <br className="hidden lg:block" />
                        <span className="from-primary bg-gradient-to-r to-blue-600 bg-clip-text text-transparent">
                            Scale Faster.
                        </span>
                    </h1>

                    <p className="mx-auto mt-4 mb-10 max-w-2xl text-lg leading-relaxed font-medium text-slate-600 md:text-xl lg:mx-0">
                        Direct factory pricing, verified suppliers, and seamless GST invoicing.
                        Streamline your entire supply chain with our bulk procurement platform.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                        <button
                            onClick={onShopNow}
                            className="bg-primary hover:bg-primary-light hover:shadow-primary/30 w-full rounded-full px-8 py-4 font-bold tracking-wide text-white shadow-lg transition-all duration-300 hover:-translate-y-1 sm:w-auto"
                        >
                            Browse Wholesale Catalog
                        </button>
                        {}
                        <button className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-8 py-4 font-bold tracking-wide text-slate-900 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-300 hover:bg-white sm:w-auto">
                            <UploadCloud size={18} /> Quick Bulk Order
                        </button>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-lg grid-cols-2 gap-4 lg:mx-0">
                        <div className="flex cursor-default items-center gap-4 rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md transition-colors hover:bg-white/60">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900">100% Verified</p>
                                <p className="text-xs font-medium text-slate-500">
                                    Quality-checked suppliers
                                </p>
                            </div>
                        </div>
                        <div className="flex cursor-default items-center gap-4 rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md transition-colors hover:bg-white/60">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
                                <Truck size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900">
                                    Pan-India Transit
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                    Safe bulk delivery
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-16 flex w-full justify-center lg:mt-0 lg:w-1/2">
                    <div className="animate-float relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] border-[8px] border-white/60 shadow-2xl shadow-slate-900/20 backdrop-blur-sm">
                        <img
                            src={heroImg}
                            alt="B2B Wholesale Operations"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent mix-blend-overlay"></div>
                    </div>

                    <div className="absolute -bottom-6 -left-2 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-xl sm:left-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 font-bold text-white shadow-inner">
                            GST
                        </div>
                        <div>
                            <p className="text-sm font-extrabold text-slate-900">
                                Input Tax Credit
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                                Available on all orders
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Hero;
