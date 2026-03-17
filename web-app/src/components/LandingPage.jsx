import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hero from './Hero';
import DropshipProducts from './DropshipProducts';
import { FileText, Truck, ShieldCheck, BadgePercent } from 'lucide-react'; 

function LandingPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const productsRef = useRef(null);
    const [searchParams] = useSearchParams();
    const globalSearchQuery = searchParams.get('search') || '';

    const quickCategories = ['All', 'Corporate Gifting', 'Office Electronics', 'Raw Materials', 'Wholesale Apparel', 'Industrial Packaging'];

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
            {}
            <div className="bg-primary text-slate-100 py-2.5 px-4 text-xs md:text-sm font-medium flex justify-center gap-6 md:gap-12 flex-wrap z-20 relative">
                <span className="flex items-center gap-2 font-bold tracking-wide">📦 Pan-India Delivery (Tier 1-3)</span>
                <span className="flex items-center gap-2 font-bold tracking-wide">📑 100% GST Input Credit</span>
                <span className="flex items-center gap-2 font-bold tracking-wide">🤝 Flexible Net-30 Credit Terms</span>
            </div>

            <main className="flex-1 w-full flex flex-col z-10">
                <Hero onShopNow={scrollToProducts} />

                {}
                <div className="bg-white border-y border-slate-200 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-100">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center"><FileText /></div>
                            <h3 className="font-bold text-slate-900">GST Invoicing</h3>
                            <p className="text-xs text-slate-500">Claim full ITC easily</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><BadgePercent /></div>
                            <h3 className="font-bold text-slate-900">Tiered Bulk Pricing</h3>
                            <p className="text-xs text-slate-500">More quantity, less price</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><ShieldCheck /></div>
                            <h3 className="font-bold text-slate-900">Verified Suppliers</h3>
                            <p className="text-xs text-slate-500">Quality assured sourcing</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center"><Truck /></div>
                            <h3 className="font-bold text-slate-900">End-to-End Logistics</h3>
                            <p className="text-xs text-slate-500">Safe transit nationwide</p>
                        </div>
                    </div>
                </div>

                {}
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                    <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
                        {quickCategories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => handleSelectCategory(cat)}
                                className={`snap-center whitespace-nowrap px-6 py-2.5 rounded-full font-bold tracking-wide transition-all duration-300 border ${
                                    selectedCategory === cat 
                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {}
                <div ref={productsRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">
                            {selectedCategory === 'All' ? 'Wholesale Catalog' : `${selectedCategory} Stock`}
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