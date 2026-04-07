import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Loader2 } from 'lucide-react';
import api from '../utils/api';
import ProductCard from './ProductCard';

export default function ProductRow({ title, filterQuery, viewAllLink }) {
    const { data, isLoading } = useQuery({
        queryKey: ['productRow', filterQuery],
        queryFn: async () => {
            const res = await api.get(`/products?${filterQuery}&limit=10`);
            return res.data.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const products = data?.products || [];

    if (isLoading) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="py-6">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                {}
                <div className="mb-4 flex items-end justify-between">
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
                        {title}
                    </h2>
                    {viewAllLink && (
                        <Link
                            to={viewAllLink}
                            className="group flex items-center gap-1 text-sm font-bold text-slate-500 transition-colors hover:text-indigo-600"
                        >
                            View All
                            <ArrowRight
                                size={16}
                                className="transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    )}
                </div>

                {}
                <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
                    {}
                    <div className="no-scrollbar flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pt-2 pb-6">
                        {products.map((product) => (
                            <div
                                key={product.id || product._id}
                                className="w-[260px] shrink-0 snap-start sm:w-[280px]"
                            >
                                <ProductCard product={product} />
                            </div>
                        ))}
                        <div className="w-1 shrink-0 sm:hidden"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
