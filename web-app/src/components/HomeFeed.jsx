import React from 'react';
import ProductRow from './ProductRow';

export default function HomeFeed() {
    return (
        <div className="min-h-screen bg-white pb-20 font-sans">
            {}

            <div className="flex flex-col pt-6">
                <ProductRow
                    title="⚡ Ready to Dispatch"
                    filterQuery="inStock=true"
                    viewAllLink="/search?readyToShip=true"
                />

                <ProductRow
                    title="💻 Top Electronics"
                    filterQuery="category=Electronics"
                    viewAllLink="/category/Electronics"
                />

                <ProductRow
                    title="🌟 High Margin Sellers"
                    filterQuery="minMargin=40"
                    viewAllLink="/search?margin=40"
                />

                <ProductRow
                    title="⌚ Official Titan Reseller"
                    filterQuery="vendor=Titan"
                    viewAllLink="/brand/Titan"
                />
            </div>
        </div>
    );
}
