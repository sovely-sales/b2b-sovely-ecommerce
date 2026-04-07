import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box } from 'lucide-react';
import DropshipProducts from '../pages/DropshipProducts';
import { ROUTES } from '../utils/routes';

export default function CategoryPage() {
    const { categoryName } = useParams();
    const navigate = useNavigate();

    return (
        <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
            <button
                onClick={() => navigate(ROUTES.CATALOG)}
                className="mb-6 flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900"
            >
                <ArrowLeft size={16} /> Back to Feed
            </button>
            <div className="mb-6 rounded-2xl bg-slate-900 p-8 text-white shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                    <Box size={24} className="text-blue-400" />
                </div>
                <h1 className="text-3xl font-black">{categoryName} Products</h1>
                <p className="mt-2 text-slate-400">
                    Browse all wholesale availability and variants.
                </p>
            </div>
            {}
            <DropshipProducts initialCategory={categoryName} />
        </div>
    );
}
