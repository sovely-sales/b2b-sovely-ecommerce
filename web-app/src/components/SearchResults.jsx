import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DropshipProducts from './DropshipProducts';
import { Search, ArrowLeft } from 'lucide-react';

function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [selectedCat, setSelectedCat] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [query]);

    if (!query) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <Search size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">What are you looking to source?</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Use the search bar above to find specific wholesale products, brands, or SKUs.</p>
                <button 
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-light transition-colors"
                >
                    <ArrowLeft size={18} /> Return to Catalog
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 z-10 animate-in fade-in duration-300">
            {}
            <div className="mb-8 pb-6 border-b border-slate-200">
                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Search Results</p>
                <h1 className="text-3xl font-extrabold text-slate-900">
                    Matches for "{query}"
                </h1>
                <p className="text-slate-500 mt-2">Showing wholesale availability and bulk pricing.</p>
            </div>

            <DropshipProducts 
                externalCategory={selectedCat} 
                onCategoryChange={setSelectedCat}
                globalSearchQuery={query}
                hideTitle={true} 
            />
        </div>
    );
}

export default SearchResults;