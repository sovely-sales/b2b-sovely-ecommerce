import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hero from './Hero';
import DropshipProducts from './DropshipProducts';
import B2BFilterBar from './B2BFilterBar';
import {
    FileText,
    Truck,
    ShieldCheck,
    BadgePercent,
    Handshake,
    SlidersHorizontal,
    Zap,
} from 'lucide-react';

function LandingPage() {
    const productsRef = useRef(null);
    const [searchParams] = useSearchParams();
    const globalSearchQuery = searchParams.get('search') || '';

    const [b2bFilters, setB2bFilters] = useState({
        moq: 'all',
        margin: 'all',
        readyToShip: false,
    });

    const scrollToProducts = () => {
        if (productsRef.current) {
            productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleFilterChange = (key, value) => {
        setB2bFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col">
            {}
            <div className="bg-primary relative z-20 flex flex-wrap justify-center gap-6 px-4 py-2.5 text-xs font-medium text-slate-100 shadow-sm md:gap-12 md:text-sm">
                <span className="flex items-center gap-2 tracking-wide">
                    <Truck size={16} className="text-emerald-400" /> Pan-India Delivery (Tier 1-3)
                </span>
                <span className="flex items-center gap-2 tracking-wide">
                    <FileText size={16} className="text-emerald-400" /> 100% GST Input Credit
                </span>
                <span className="flex items-center gap-2 tracking-wide">
                    <Handshake size={16} className="text-emerald-400" /> Flexible Net-30 Credit
                    Terms
                </span>
            </div>

            <main className="z-10 flex w-full flex-1 flex-col">
                <Hero onShopNow={scrollToProducts} />

                {}
                <div className="relative z-20 border-y border-slate-200 bg-white py-10 shadow-sm">
                    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 divide-x divide-slate-100 px-4 text-center sm:px-6 md:grid-cols-4 lg:px-8">
                        <div className="group flex flex-col items-center gap-3">
                            <div className="bg-accent/10 text-accent group-hover:bg-accent flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-white">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 md:text-base">
                                    GST Invoicing
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">Claim full ITC easily</p>
                            </div>
                        </div>
                        <div className="group flex flex-col items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                                <BadgePercent size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 md:text-base">
                                    Tiered Bulk Pricing
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    More quantity, less price
                                </p>
                            </div>
                        </div>
                        <div className="group flex flex-col items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 md:text-base">
                                    Verified Suppliers
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Quality assured sourcing
                                </p>
                            </div>
                        </div>
                        <div className="group flex flex-col items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white">
                                <Truck size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 md:text-base">
                                    End-to-End Logistics
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Safe transit nationwide
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div
                    ref={productsRef}
                    className="sticky top-0 z-30 w-full border-b border-slate-200/60 bg-slate-50 bg-slate-50/90 pt-8 pb-4 shadow-sm backdrop-blur-xl"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-2 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                                    <SlidersHorizontal className="text-primary" size={28} />
                                    Wholesale Catalog
                                </h2>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Source inventory tailored to your business needs.
                                </p>
                            </div>

                            <B2BFilterBar
                                filters={b2bFilters}
                                onFilterChange={handleFilterChange}
                            />
                        </div>
                    </div>
                </div>

                {}
                <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {}
                    <DropshipProducts filters={b2bFilters} globalSearchQuery={globalSearchQuery} />
                </div>
            </main>
        </div>
    );
}

export default LandingPage;
