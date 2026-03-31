import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Filter, AlignJustify, LayoutGrid, Box } from 'lucide-react';

import api from '../utils/api.js';
import { useDebounce } from '../hooks/useDebounce';


import ProductFilterSidebar from '../components/ProductFilterSidebar';
import ProductCard from '../components/ProductCard';
import ProductTableRow from '../components/ProductTableRow';
import ProductSkeleton from '../components/ProductSkeleton';

const SORT_OPTIONS = [
    { value: 'default', label: 'Recommended' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'margin', label: 'Highest Margin' },
];

export default function DropshipProducts({
    filters = {},
    globalSearchQuery = '',
    initialCategory = 'All Categories',
}) {
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    
    const [category, setCategory] = useState(initialCategory);
    const [sort, setSort] = useState('default');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedGst, setSelectedGst] = useState([]);
    const [maxDispatchDays, setMaxDispatchDays] = useState('');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [b2bFilters, setB2bFilters] = useState({
        moq: 'all',
        margin: 0,
        readyToShip: false,
        lowRtoRisk: false,
        vendor: 'all',
    });

    
    const debouncedMinPrice = useDebounce(minPrice, 500);
    const debouncedMaxPrice = useDebounce(maxPrice, 500);

    
    const stringifiedFilters = JSON.stringify(filters);
    useEffect(() => {
        const parsedFilters = JSON.parse(stringifiedFilters);
        setB2bFilters((prev) => ({
            ...prev,
            moq: parsedFilters.moq || 'all',
            margin: parsedFilters.margin || 0,
            readyToShip: parsedFilters.readyToShip || false,
            lowRtoRisk: parsedFilters.lowRtoRisk || false,
            vendor: parsedFilters.vendor || 'all',
        }));
    }, [stringifiedFilters]);

    useEffect(() => {
        if (globalSearchQuery) {
            setCategory('All Categories');
            resetAdvancedFilters();
        }
    }, [globalSearchQuery]);

    const { data: rawCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data.data || [];
        },
    });

    const dbCategories = useMemo(() => {
        return rawCategories.filter((cat, index, list) => {
            const normalizedName = cat.name.trim().toLowerCase();
            return (
                index ===
                list.findIndex((item) => item.name.trim().toLowerCase() === normalizedName)
            );
        });
    }, [rawCategories]);

    const selectedCatId = useMemo(() => {
        if (category === 'All Categories') return null;
        const found = dbCategories.find((c) => c.name === category);
        return found ? found._id : null;
    }, [category, dbCategories]);

    
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: [
            'products',
            selectedCatId,
            sort,
            debouncedMinPrice,
            debouncedMaxPrice,
            selectedGst,
            maxDispatchDays,
            verifiedOnly,
            b2bFilters.moq, 
            b2bFilters.readyToShip,
            b2bFilters.lowRtoRisk,
            b2bFilters.vendor,
            globalSearchQuery,
        ],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({ page: pageParam, limit: 30 });
            if (selectedCatId) params.append('category', selectedCatId);
            if (globalSearchQuery) params.append('search', globalSearchQuery);
            if (sort !== 'default') params.append('sort', sort);
            if (debouncedMinPrice) params.append('minBasePrice', debouncedMinPrice);
            if (debouncedMaxPrice) params.append('maxBasePrice', debouncedMaxPrice);
            if (selectedGst.length > 0) params.append('gstSlab', selectedGst.join(','));
            if (maxDispatchDays) params.append('maxShippingDays', maxDispatchDays);
            if (verifiedOnly) params.append('isVerifiedSupplier', 'true');

            

            if (b2bFilters.moq === 'under-50') params.append('maxMoq', '50');
            else if (b2bFilters.moq === '50-500') {
                params.append('minMoq', '50');
                params.append('maxMoq', '500');
            } else if (b2bFilters.moq === 'bulk') params.append('minMoq', '500');

            if (b2bFilters.readyToShip) params.append('inStock', 'true');
            if (b2bFilters.lowRtoRisk) params.append('lowRtoRisk', 'true');
            if (b2bFilters.vendor && b2bFilters.vendor !== 'all')
                params.append('vendor', b2bFilters.vendor);

            const res = await api.get(`/products?${params.toString()}`);
            return res.data.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const page = lastPage?.pagination?.page ?? 1;
            const pages = lastPage?.pagination?.pages ?? 1;
            return page < pages ? page + 1 : undefined;
        },
    });

    const displayProducts = useMemo(() => {
        if (!data) return [];

        let mappedProducts = data.pages
            .flatMap((page) => page.products || [])
            .map((p) => {
                const wholesalePrice = p.platformSellPrice || p.dropshipBasePrice;
                const retailMrp = p.compareAtPrice || Math.floor(wholesalePrice * 1.8);
                const estMargin = Math.round(((retailMrp - wholesalePrice) / retailMrp) * 100);

                return {
                    id: p._id,
                    skuId: p.sku || 'N/A',
                    vendor: p.vendor || 'Verified Supplier',
                    stock: p.inventory?.stock ?? 0,
                    name: p.title,
                    category: p.categoryId?.name || p.productType || 'Uncategorized',
                    price: wholesalePrice,
                    originalPrice: retailMrp,
                    margin: estMargin,
                    image: p.images?.[0]?.url || 'https://via.placeholder.com/200',
                    moq: p.moq || 10,
                    gst: p.gstSlab || 18,
                    isVerified: p.isVerifiedSupplier !== false,
                    rtoRate: p.historicalRtoRate || 0,
                    dispatchDays: p.shippingDays || 2,
                };
            });

        
        if (b2bFilters.margin > 0) {
            mappedProducts = mappedProducts.filter((p) => p.margin >= b2bFilters.margin);
        }

        return mappedProducts;
    }, [data, b2bFilters.margin]);

    const resetAdvancedFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setSelectedGst([]);
        setMaxDispatchDays('');
        setVerifiedOnly(false);
    };

    const resetAll = () => {
        setCategory('All Categories');
        setSort('default');
        resetAdvancedFilters();
    };

    return (
        <section className="relative z-10 w-full pt-4 font-sans">
            {}
            <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <button
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm md:hidden"
                    onClick={() => setIsMobileFilterOpen(true)}
                >
                    <Filter size={16} /> Filters
                </button>

                <div className="flex w-full items-center justify-between md:w-auto md:justify-end md:gap-4">
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`rounded px-3 py-1.5 transition-colors ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                            <AlignJustify size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded px-3 py-1.5 transition-colors ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm focus-within:border-slate-400">
                        <span className="text-xs font-semibold text-slate-500">Sort:</span>
                        <div className="relative">
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="cursor-pointer appearance-none bg-transparent py-1 pr-6 text-sm font-bold text-slate-900 outline-none"
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={14}
                                className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-slate-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-start gap-6 lg:flex-row">
                {isMobileFilterOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setIsMobileFilterOpen(false)}
                    />
                )}

                <ProductFilterSidebar
                    isMobileFilterOpen={isMobileFilterOpen}
                    setIsMobileFilterOpen={setIsMobileFilterOpen}
                    category={category}
                    setCategory={setCategory}
                    dbCategories={dbCategories}
                    minPrice={minPrice}
                    setMinPrice={setMinPrice}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    selectedGst={selectedGst}
                    setSelectedGst={setSelectedGst}
                    maxDispatchDays={maxDispatchDays}
                    setMaxDispatchDays={setMaxDispatchDays}
                    verifiedOnly={verifiedOnly}
                    setVerifiedOnly={setVerifiedOnly}
                    b2bFilters={b2bFilters}
                    setB2bFilters={setB2bFilters}
                    resetAll={resetAll}
                />

                {}
                <div className="no-scrollbar w-full min-w-0 flex-1 pb-12">
                    {isLoading ? (
                        <div
                            className={
                                viewMode === 'table'
                                    ? 'flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white'
                                    : 'grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4'
                            }
                        >
                            {[...Array(8)].map((_, i) => (
                                <ProductSkeleton key={i} viewMode={viewMode} />
                            ))}
                        </div>
                    ) : displayProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center shadow-sm">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                                <Box className="text-slate-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                            <button
                                onClick={resetAll}
                                className="mt-6 rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={viewMode}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className={
                                    viewMode === 'table'
                                        ? 'flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
                                        : 'grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4'
                                }
                            >
                                {viewMode === 'table' && (
                                    <div className="hidden grid-cols-[auto_1fr_120px_120px_120px_160px] items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase md:grid">
                                        <div className="w-14">Product</div>
                                        <div>Details</div>
                                        <div className="text-center">Logistics</div>
                                        <div className="text-center">Financials</div>
                                        <div className="text-right">Wholesale Price</div>
                                        <div className="text-center">Action</div>
                                    </div>
                                )}

                                {displayProducts.map((product) =>
                                    viewMode === 'table' ? (
                                        <ProductTableRow
                                            key={`${product.id}-table`}
                                            product={product}
                                        />
                                    ) : (
                                        <ProductCard key={`${product.id}-grid`} product={product} />
                                    )
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {hasNextPage && (
                        <div className="mt-10 flex justify-center">
                            <button
                                className="rounded-xl border border-slate-300 bg-white px-8 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage ? 'Loading more...' : 'Load More Products'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
