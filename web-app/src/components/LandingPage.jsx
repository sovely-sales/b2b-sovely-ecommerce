import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import Hero from './Hero';
import DropshipProducts from './DropshipProducts';
import Footer from './Footer';
import './LandingPage.css';

function LandingPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const productsRef = useRef(null);
    const [searchParams] = useSearchParams();
    const globalSearchQuery = searchParams.get('search') || '';

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
        <div className="landing-page">
            <Navbar onSelectCategory={handleSelectCategory} />
            
            <main className="main-content">
                <Hero onShopNow={scrollToProducts} />
                <div ref={productsRef}>
                    <DropshipProducts 
                        externalCategory={selectedCategory} 
                        onCategoryChange={setSelectedCategory} 
                        globalSearchQuery={globalSearchQuery}
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default LandingPage;