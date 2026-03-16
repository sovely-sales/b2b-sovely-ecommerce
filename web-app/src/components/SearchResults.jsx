import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DropshipProducts from './DropshipProducts';

function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [selectedCat, setSelectedCat] = useState('All');
    
    // Scroll to top when search changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [query]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 z-10 animate-[fadeIn_0.3s_ease-out]">
            <DropshipProducts 
                externalCategory={selectedCat} 
                onCategoryChange={setSelectedCat}
                globalSearchQuery={query}
                customTitle={`Search Results for "${query}"`}
                customSubtitle="Explore top matches based on your search"
            />
        </div>
    );
}

export default SearchResults;