import React from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import DropshipProducts from '../pages/DropshipProducts';

function LandingPage() {
    const [searchParams] = useSearchParams();
    const { categoryName } = useParams();
    const globalSearchQuery = searchParams.get('search') || '';

    return (
        <div className="flex min-h-screen w-full flex-col bg-slate-50 font-sans">
            <main className="flex w-full flex-1 flex-col pt-6 pb-12">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <DropshipProducts
                        globalSearchQuery={globalSearchQuery}
                        initialCategory={
                            categoryName ? decodeURIComponent(categoryName) : 'All Categories'
                        }
                    />
                </div>
            </main>
        </div>
    );
}

export default LandingPage;
