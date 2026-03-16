import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hero from './Hero';
import DropshipProducts from './DropshipProducts';

function LandingPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const productsRef = useRef(null);
    const [searchParams] = useSearchParams();
    const globalSearchQuery = searchParams.get('search') || '';

    const quickCategories = ['All', 'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports'];

    const handleSelectCategory = (cat) => {
        setSelectedCategory(cat);
        if (productsRef.current) {
            productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const scrollToProducts = () => {
        if (productsRef.current) {
            productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="w-full flex flex-col min-h-screen relative">
            {/* 1. Trust Banner (Sleek dark mode banner) */}
            <div className="bg-slate-900 text-slate-100 py-2.5 px-4 text-xs md:text-sm font-medium flex justify-center gap-4 md:gap-8 flex-wrap z-20 relative">
                <span className="flex items-center gap-2">🚚 Free Shipping over $50</span>
                <span className="flex items-center gap-2">🛡️ 30-Day Guarantee</span>
                <span className="flex items-center gap-2">💳 Secure Checkout</span>
            </div>

            <main className="flex-1 w-full flex flex-col z-10">
                <Hero onShopNow={scrollToProducts} />
                
                {/* 2. Category Pills */}
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                    <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
                        {quickCategories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => handleSelectCategory(cat)}
                                className={`snap-center whitespace-nowrap px-6 py-2.5 rounded-full font-bold tracking-wide transition-all duration-300 border ${
                                    selectedCategory === cat 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Product Grid Area */}
                <div ref={productsRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">
                            {selectedCategory === 'All' ? 'Trending Right Now' : `${selectedCategory} Collection`}
                        </h2>
                    </div>
                    
                    <DropshipProducts 
                        externalCategory={selectedCategory} 
                        onCategoryChange={setSelectedCategory} 
                        globalSearchQuery={globalSearchQuery}
                    />
                </div>
            </main>
        </div>
    );
}

export default LandingPage;