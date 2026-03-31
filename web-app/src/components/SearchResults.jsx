import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import DropshipProducts from '../pages/DropshipProducts';
import { Search, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../utils/routes';

function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const categoryParam = searchParams.get('category') || 'All Categories';

    const navigate = useNavigate();

    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [query, categoryParam]);

    
    const emptyFilters = useMemo(() => ({}), []);

    
    if (!query && categoryParam === 'All Categories') {
        return (
            <div className="mx-auto w-full max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Search size={32} />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                    What are you looking to source?
                </h2>
                <p className="mx-auto mb-8 max-w-md text-slate-500">
                    Use the search bar above to find specific wholesale products, brands, or SKUs.
                </p>
                <button
                    onClick={() => navigate(ROUTES.CATALOG)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-800"
                >
                    <ArrowLeft size={18} /> Return to Catalog
                </button>
            </div>
        );
    }

    
    return (
        <div className="animate-in fade-in z-10 mx-auto w-full max-w-7xl px-4 py-8 duration-300 sm:px-6 lg:px-8 lg:py-12">
            {}
            <button
                onClick={() => navigate(ROUTES.CATALOG)}
                className="mb-6 flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900"
            >
                <ArrowLeft size={16} /> Back to Catalog
            </button>

            {}
            <div className="mb-8 border-b border-slate-200 pb-6">
                <p className="mb-2 text-sm font-bold tracking-wider text-emerald-600 uppercase">
                    {query ? 'Search Results' : 'Category View'}
                </p>
                <h1 className="text-3xl font-extrabold text-slate-900">
                    {query ? `Matches for "${query}"` : `${categoryParam} Products`}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-500">
                    Showing wholesale availability and bulk pricing.
                </p>
            </div>

            {}
            <DropshipProducts
                initialCategory={categoryParam}
                globalSearchQuery={query}
                hideTitle={true}
                filters={emptyFilters} 
            />
        </div>
    );
}

export default SearchResults;
