import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlignJustify, LayoutGrid, Box, ShoppingCart, X, FilterX } from 'lucide-react';

import api from '../utils/api.js';
import { useDebounce } from '../hooks/useDebounce';
import { useCartStore } from '../store/cartStore';
import { ROUTES } from '../utils/routes';

import ProductCard from '../components/ProductCard';
import ProductTableRow from '../components/ProductTableRow';
import ProductSkeleton from '../components/ProductSkeleton';

const SORT_OPTIONS = [
    { value: 'default', label: 'Latest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
];

const BRAND_OPTIONS = [
    'All Brands',
    'Aditi',
    'Apex',
    'Badz',
    'Beautiful Basics',
    'Bellavita',
    'Camel',
    'Chocotown',
    'Electro Play',
    'Eyelet',
    'Freshee',
    'Funwood',
    'Ganesh',
    'Home Chef',
    'IKI',
    "In' Lief",
    'Kangaro',
    'Konex',
    'Konvex',
    'Lapcare',
    'Liger',
    'Live Touch',
    'Maniarrs',
    'Nekza',
    'Next',
    'OG Beauty',
    'Oracle',
    'Orbit',
    'Pexpo',
    'Prexo',
    'Pro Clean',
    'Ritu',
    'Sameo',
    'Signature',
    'Supermom',
    'Truzo',
    'Ved Sanjeevani',
    'Vegnar',
    'Wagtail',
    'Zequz',
];

export default function DropshipProducts({
    globalSearchQuery = '',
    initialCategory = 'All Categories',
}) {
    const addToCart = useCartStore((state) => state.addToCart);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('table');

    const loadMoreRef = useRef(null);

    const [filters, setFilters] = useState({
        category: searchParams.get('category') || initialCategory,
        brand: searchParams.get('brand') || 'All Brands',
        sort: searchParams.get('sort') || 'default',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        minWeight: searchParams.get('minWeight') || '',
        maxWeight: searchParams.get('maxWeight') || '',
    });

    // 2. BULK CART STATE
    const [bulkCart, setBulkCart] = useState({});
    const [isAddingBulk, setIsAddingBulk] = useState(false);

    const debouncedMinPrice = useDebounce(filters.minPrice, 500);
    const debouncedMaxPrice = useDebounce(filters.maxPrice, 500);
    const debouncedMinWeight = useDebounce(filters.minWeight, 500);
    const debouncedMaxWeight = useDebounce(filters.maxWeight, 500);

    // Sync state changes back to the URL quietly
    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        const updateParam = (key, value, defaultVal) => {
            if (value && value !== defaultVal) params.set(key, value);
            else params.delete(key);
        };

        updateParam('category', filters.category, 'All Categories');
        updateParam('brand', filters.brand, 'All Brands');
        updateParam('sort', filters.sort, 'default');
        updateParam('minPrice', filters.minPrice, '');
        updateParam('maxPrice', filters.maxPrice, '');
        updateParam('minWeight', filters.minWeight, '');
        updateParam('maxWeight', filters.maxWeight, '');

        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    useEffect(() => {
        if (initialCategory && !searchParams.get('category')) {
            setFilters((prev) => ({ ...prev, category: initialCategory }));
        }
    }, [initialCategory]);

    useEffect(() => {
        if (globalSearchQuery) {
            setFilters({
                category: 'All Categories',
                brand: 'All Brands',
                sort: 'default',
                minPrice: '',
                maxPrice: '',
                minWeight: '',
                maxWeight: '',
            });
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
        if (filters.category === 'All Categories') return null;
        const found = dbCategories.find((c) => c.name === filters.category);
        return found ? found._id : null;
    }, [filters.category, dbCategories]);

    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: [
            'products',
            selectedCatId,
            filters.brand,
            filters.sort,
            debouncedMinPrice,
            debouncedMaxPrice,
            debouncedMinWeight,
            debouncedMaxWeight,
            globalSearchQuery,
        ],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({ page: pageParam, limit: 30 });

            if (selectedCatId) params.append('category', selectedCatId);
            if (globalSearchQuery) params.append('search', globalSearchQuery);
            if (filters.sort !== 'default') params.append('sort', filters.sort);
            if (filters.brand !== 'All Brands') params.append('vendor', filters.brand);
            if (debouncedMinPrice) params.append('minBasePrice', debouncedMinPrice);
            if (debouncedMaxPrice) params.append('maxBasePrice', debouncedMaxPrice);

            if (debouncedMinWeight)
                params.append(
                    'minWeight',
                    String(Math.floor(parseFloat(debouncedMinWeight) * 1000))
                );
            if (debouncedMaxWeight)
                params.append(
                    'maxWeight',
                    String(Math.floor(parseFloat(debouncedMaxWeight) * 1000))
                );

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
        return data.pages
            .flatMap((page) => page.products || [])
            .map((p) => {
                const wholesalePrice = p.platformSellPrice || p.dropshipBasePrice;
                const retailMrp = p.compareAtPrice || Math.floor(wholesalePrice * 1.8);
                return {
                    id: p._id,
                    skuId: p.sku || 'N/A',
                    vendor: p.vendor || 'Verified Supplier',
                    stock: p.inventory?.stock ?? 0,
                    name: p.title,
                    moq: p.moq || 10,
                    category: p.categoryId?.name || p.productType || 'Uncategorized',
                    price: wholesalePrice,
                    originalPrice: retailMrp,
                    image: p.images?.[0]?.url || 'https://via.placeholder.com/200',
                };
            });
    }, [data]);

    const totalProducts = data?.pages?.[0]?.pagination?.total || 0;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: '400px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleUpdateBulkCart = (product, qty, isSelected) => {
        setBulkCart((prev) => {
            const next = { ...prev };
            if (isSelected) {
                next[product.id] = { product, qty };
            } else {
                delete next[product.id];
            }
            return next;
        });
    };

    const bulkItemsCount = Object.keys(bulkCart).length;
    const bulkTotalPrice = Object.values(bulkCart).reduce(
        (acc, item) => acc + item.product.price * item.qty,
        0
    );

    const executeBulkAdd = async () => {
        setIsAddingBulk(true);
        for (const itemId of Object.keys(bulkCart)) {
            const { product, qty } = bulkCart[itemId];
            await addToCart(product.id, qty, 'DROPSHIP', 0);
        }
        setBulkCart({});
        setIsAddingBulk(false);
        navigate(ROUTES.MY_ACCOUNT);
    };

    const resetAll = () => {
        setFilters({
            category: 'All Categories',
            brand: 'All Brands',
            sort: 'default',
            minPrice: '',
            maxPrice: '',
            minWeight: '',
            maxWeight: '',
        });
    };

    const hasActiveFilters =
        filters.category !== 'All Categories' ||
        filters.brand !== 'All Brands' ||
        filters.minPrice ||
        filters.maxPrice ||
        filters.minWeight ||
        filters.maxWeight ||
        filters.sort !== 'default';

    return (
        <section className="relative z-10 w-full px-4 font-sans sm:px-6 lg:px-8">
            {}
            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:gap-4">
                    <div className="relative">
                        <select
                            value={filters.category}
                            onChange={(e) =>
                                setFilters((p) => ({ ...p, category: e.target.value }))
                            }
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm font-semibold text-slate-900 shadow-sm transition-shadow outline-none hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
                        >
                            <option value="All Categories">All Categories</option>
                            {dbCategories.map((cat) => (
                                <option key={cat._id} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={filters.brand}
                            onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm font-semibold text-slate-900 shadow-sm transition-shadow outline-none hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
                        >
                            {BRAND_OPTIONS.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Min ₹"
                            value={filters.minPrice}
                            onChange={(e) =>
                                setFilters((p) => ({
                                    ...p,
                                    minPrice: e.target.value.replace(/\D/g, ''),
                                }))
                            }
                            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-shadow outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <span className="text-slate-300">-</span>
                        <input
                            type="number"
                            placeholder="Max ₹"
                            value={filters.maxPrice}
                            onChange={(e) =>
                                setFilters((p) => ({
                                    ...p,
                                    maxPrice: e.target.value.replace(/\D/g, ''),
                                }))
                            }
                            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-shadow outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Min Kg"
                            value={filters.minWeight}
                            onChange={(e) =>
                                setFilters((p) => ({
                                    ...p,
                                    minWeight: e.target.value.replace(/[^0-9.]/g, ''),
                                }))
                            }
                            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-shadow outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <span className="text-slate-300">-</span>
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Max Kg"
                            value={filters.maxWeight}
                            onChange={(e) =>
                                setFilters((p) => ({
                                    ...p,
                                    maxWeight: e.target.value.replace(/[^0-9.]/g, ''),
                                }))
                            }
                            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-shadow outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 xl:border-t-0 xl:pt-0">
                    <div className="flex items-center gap-4">
                        {hasActiveFilters && (
                            <button
                                onClick={resetAll}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-rose-500"
                            >
                                <FilterX size={14} /> Clear
                            </button>
                        )}
                        <div className="relative flex items-center gap-3">
                            <span className="hidden text-xs font-bold tracking-widest text-slate-400 uppercase sm:block">
                                Sort
                            </span>
                            <div className="relative">
                                <select
                                    value={filters.sort}
                                    onChange={(e) =>
                                        setFilters((p) => ({ ...p, sort: e.target.value }))
                                    }
                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm font-semibold text-slate-900 shadow-sm transition-shadow outline-none hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
                                >
                                    {SORT_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* NEW: Total Product Count Indicator */}
                        {!isLoading && (
                            <span className="hidden text-xs font-bold text-slate-400 sm:block">
                                {totalProducts} Products
                            </span>
                        )}
                        <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`rounded-md px-3 py-1.5 transition-all ${viewMode === 'grid' ? 'bg-slate-100 font-bold text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`rounded-md px-3 py-1.5 transition-all ${viewMode === 'table' ? 'bg-slate-100 font-bold text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <AlignJustify size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="w-full pb-32">
                {isLoading ? (
                    <div
                        className={
                            viewMode === 'table'
                                ? 'flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white'
                                : 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                        }
                    >
                        {[...Array(10)].map((_, i) => (
                            <ProductSkeleton key={i} viewMode={viewMode} />
                        ))}
                    </div>
                ) : displayProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center shadow-sm">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                            <Box className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                        {hasActiveFilters && (
                            <button
                                onClick={resetAll}
                                className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <AnimatePresence>
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            layout="position"
                            className={
                                viewMode === 'table'
                                    ? 'flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'
                                    : 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                            }
                        >
                            {viewMode === 'table' && (
                                <div className="hidden grid-cols-[40px_auto_1fr_120px_120px_160px] items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase md:grid">
                                    <div className="text-center">✔</div>
                                    <div className="w-14">Image</div>
                                    <div>Details</div>
                                    <div className="text-center">Logistics</div>
                                    <div className="text-right">Wholesale Price</div>
                                    <div className="text-center">Action</div>
                                </div>
                            )}
                            {displayProducts.map((product) =>
                                viewMode === 'table' ? (
                                    <ProductTableRow
                                        key={`${product.id}-table`}
                                        product={product}
                                        bulkCartQty={bulkCart[product.id]?.qty}
                                        onUpdateBulkCart={handleUpdateBulkCart}
                                    />
                                ) : (
                                    <ProductCard
                                        key={`${product.id}-${viewMode}`}
                                        product={product}
                                    />
                                )
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {}
                <div
                    ref={loadMoreRef}
                    className="mt-8 flex h-16 w-full items-center justify-center"
                >
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
                            Loading catalog...
                        </div>
                    )}
                </div>
            </div>

            {}
            <AnimatePresence>
                {bulkItemsCount > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-3xl -translate-x-1/2 items-center justify-between rounded-2xl bg-slate-900 px-6 py-4 shadow-2xl ring-1 ring-white/10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {bulkItemsCount} Item{bulkItemsCount > 1 ? 's' : ''} Selected
                                </p>
                                <p className="text-xs font-medium text-slate-400">
                                    Total: ₹{bulkTotalPrice.toLocaleString('en-IN')} (Excl. GST)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setBulkCart({})}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={executeBulkAdd}
                                disabled={isAddingBulk}
                                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {isAddingBulk ? 'Adding...' : 'Add All to Cart'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
