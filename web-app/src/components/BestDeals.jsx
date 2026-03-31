import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, Tag, ArrowRight } from 'lucide-react';
import api from '../utils/api.js';

function BestDeals() {
    const [deals, setDeals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                
                const res = await api.get('/products', {
                    params: { limit: 4, sort: '-estimatedMarginPercent' },
                });

                
                const data = res.data?.data?.products || res.data?.data || res.data || [];
                setDeals(Array.isArray(data) ? data.slice(0, 4) : []);
            } catch (error) {
                console.error('Failed to fetch top deals:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeals();
    }, []);

    if (isLoading) {
        return (
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 h-8 w-64 animate-pulse rounded-lg bg-slate-200"></div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-[400px] w-full animate-pulse rounded-3xl bg-slate-100"
                            ></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (deals.length === 0) return null;

    return (
        <section className="border-b border-slate-200 bg-slate-50 py-16 lg:py-24" id="deals">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
                                Top Trending
                            </span>
                        </div>
                        <h2 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Highest Margin Deals{' '}
                            <TrendingUp size={32} className="text-emerald-500" />
                        </h2>
                        <p className="mt-2 font-medium text-slate-500">
                            Products with the highest spread between platform cost and suggested
                            retail price.
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            document
                                .getElementById('catalog')
                                ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="flex items-center gap-2 text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600"
                    >
                        View Full Catalog <ArrowRight size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {deals.map((deal) => {
                        const image = deal.images?.[0]?.url || 'https://via.placeholder.com/500';
                        const marginPercent =
                            deal.estimatedMarginPercent ||
                            Math.round(
                                ((deal.suggestedRetailPrice - deal.dropshipBasePrice) /
                                    deal.suggestedRetailPrice) *
                                    100
                            );

                        return (
                            <div
                                key={deal._id}
                                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                {}
                                <div className="absolute top-4 left-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                                    {marginPercent}% Margin
                                </div>

                                {}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 p-4">
                                    <img
                                        src={image}
                                        alt={deal.title}
                                        className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {deal.inventory?.stock <= 10 && deal.inventory?.stock > 0 && (
                                        <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-amber-600 backdrop-blur-sm">
                                            Only {deal.inventory.stock} left
                                        </div>
                                    )}
                                </div>

                                {}
                                <div className="flex flex-1 flex-col p-5">
                                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        <span className="flex items-center gap-1">
                                            <Tag size={12} /> {deal.categoryId?.name || 'Category'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Package size={12} /> MOQ: {deal.moq || 1}
                                        </span>
                                    </div>

                                    <h3 className="mb-4 line-clamp-2 text-base font-extrabold text-slate-900">
                                        {deal.title}
                                    </h3>

                                    {}
                                    <div className="mt-auto space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">
                                                Retail SRP:
                                            </span>
                                            <span className="text-sm font-bold text-slate-400 line-through">
                                                ₹{deal.suggestedRetailPrice}
                                            </span>
                                        </div>
                                        <div className="h-px w-full border-dashed bg-slate-200"></div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-slate-900 uppercase">
                                                Platform Base:
                                            </span>
                                            <span className="text-xl font-black text-emerald-600">
                                                ₹{deal.dropshipBasePrice}
                                            </span>
                                        </div>
                                    </div>

                                    {}
                                    <Link
                                        to={`/product/${deal._id}`}
                                        className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-slate-800"
                                    >
                                        View B2B Tiers
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default BestDeals;
