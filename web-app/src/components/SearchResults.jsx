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
            <div className="mx-auto w-full px-4 py-24 text-center sm:px-6 lg:px-8">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 shadow-inner">
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
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
                >
                    <ArrowLeft size={18} /> Return to Catalog
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in z-10 w-full py-8 duration-300">
            {}
            <div className="px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate(ROUTES.CATALOG)}
                    className="mb-6 flex items-center gap-1 text-sm font-bold text-slate-500 transition-colors hover:text-indigo-600"
                >
                    <ArrowLeft size={16} /> Back to Catalog
                </button>

                <div className="mb-8 border-b border-slate-200 pb-6">
                    {}
                    <p className="mb-2 text-sm font-black tracking-wider text-indigo-600 uppercase">
                        {query ? 'Search Results' : 'Category View'}
                    </p>
                    <h1 className="text-3xl font-extrabold text-slate-900">
                        {query ? `Matches for "${query}"` : `${categoryParam} Products`}
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                        Showing wholesale availability and bulk pricing.
                    </p>
                </div>
            </div>

            {}
            <div className="px-4 sm:px-6 lg:px-8">
                <DropshipProducts
                    initialCategory={categoryParam}
                    globalSearchQuery={query}
                    hideTitle={true}
                    filters={emptyFilters}
                />
            </div>
        </div>
    );
}

export default SearchResults;
