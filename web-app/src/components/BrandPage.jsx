import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import DropshipProducts from '../pages/DropshipProducts';
import { ROUTES } from '../utils/routes';

export default function BrandPage() {
    const { brandName } = useParams();
    const navigate = useNavigate();

    const filters = useMemo(() => ({ vendor: brandName }), [brandName]);

    return (
        <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
            <button
                onClick={() => navigate(ROUTES.CATALOG)}
                className="mb-6 flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900"
            >
                <ArrowLeft size={16} /> Back to Feed
            </button>
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-8 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <Tag size={24} className="text-blue-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900">{brandName} Wholesale</h1>
                <p className="mt-2 font-medium text-slate-600">
                    Official verified supplier catalog.
                </p>
            </div>
            {}
            <DropshipProducts filters={filters} initialCategory="All Categories" />
        </div>
    );
}
