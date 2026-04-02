import React, { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import DropshipProducts from '../pages/DropshipProducts';
import B2BFilterBar from './B2BFilterBar';
import { PackageSearch, Search, X } from 'lucide-react';

function LandingPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { categoryName } = useParams();
    const globalSearchQuery = searchParams.get('search') || '';

    const [b2bFilters, setB2bFilters] = useState({
        moq: 'all',
        margin: 0,
        readyToShip: false,
        lowRtoRisk: false,
        vendor: 'all',
    });

    const handleFilterChange = (key, value) => {
        setB2bFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearSearch = () => {
        searchParams.delete('search');
        setSearchParams(searchParams);
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-slate-50 font-sans">
            <main className="flex w-full flex-1 flex-col pb-12">
                {}
                <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="relative w-full border-b border-slate-200 bg-white"
                >
                    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                            {}
                            <div>
                                <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                                    <PackageSearch
                                        className="text-emerald-600"
                                        strokeWidth={2.5}
                                        size={28}
                                    />
                                    Wholesale Catalog
                                </h1>

                                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                                    {globalSearchQuery ? (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800"
                                        >
                                            <Search size={14} strokeWidth={2.5} />
                                            Search results for "{globalSearchQuery}"
                                            <button
                                                onClick={clearSearch}
                                                className="ml-2 flex items-center justify-center rounded-full p-1 text-emerald-600 transition-colors hover:bg-emerald-200 hover:text-emerald-900"
                                                title="Clear Search"
                                            >
                                                <X size={14} strokeWidth={3} />
                                            </button>
                                        </motion.span>
                                    ) : (
                                        <p>
                                            Source verified inventory tailored to your business
                                            needs.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {}
                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2">
                                <B2BFilterBar
                                    filters={b2bFilters}
                                    onFilterChange={handleFilterChange}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {}
                <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
                    <DropshipProducts
                        filters={b2bFilters}
                        globalSearchQuery={globalSearchQuery}
                        initialCategory={categoryName ? decodeURIComponent(categoryName) : 'All Categories'}
                    />
                </div>
            </main>
        </div>
    );
}

export default LandingPage;
