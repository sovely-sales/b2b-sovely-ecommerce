import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    ChevronDown,
    X,
    ShieldCheck,
    Box,
    Clock,
    ShoppingCart,
    LayoutGrid,
    AlignJustify,
    Receipt,
    Truck,
    TrendingUp,
    Minus,
    Plus,
    Filter,
} from 'lucide-react';
import api from '../utils/api.js';
import { useCartStore } from '../store/cartStore';

const SORT_OPTIONS = [
    { value: 'default', label: 'Recommended' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'margin', label: 'Highest Margin' },
];

// --- Skeleton Loader Component ---
const ProductSkeleton = ({ viewMode }) => {
    if (viewMode === 'table') {
        return (
            <div className="flex animate-pulse items-center gap-4 border-b border-slate-100 px-4 py-3">
                <div className="h-12 w-12 rounded-lg bg-slate-100"></div>
                <div className="flex-1 space-y-2.5">
                    <div className="h-3 w-1/3 rounded bg-slate-100"></div>
                    <div className="h-2 w-1/4 rounded bg-slate-100"></div>
                </div>
                <div className="w-24 space-y-2.5">
                    <div className="h-3 w-full rounded bg-slate-100"></div>
                    <div className="h-2 w-2/3 rounded bg-slate-100"></div>
                </div>
                <div className="w-24 space-y-2.5">
                    <div className="h-3 w-full rounded bg-slate-100"></div>
                    <div className="h-2 w-2/3 rounded bg-slate-100"></div>
                </div>
                <div className="w-32">
                    <div className="h-9 w-full rounded-lg bg-slate-100"></div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex animate-pulse flex-col rounded-xl border border-slate-100 p-4">
            <div className="mb-4 aspect-square rounded-lg bg-slate-100"></div>
            <div className="mb-3 h-3 w-1/2 rounded bg-slate-100"></div>
            <div className="mb-5 h-4 w-3/4 rounded bg-slate-100"></div>
            <div className="mt-auto flex justify-between">
                <div className="h-5 w-1/3 rounded bg-slate-100"></div>
                <div className="h-5 w-1/4 rounded bg-slate-100"></div>
            </div>
            <div className="mt-4 h-9 w-full rounded-lg bg-slate-100"></div>
        </div>
    );
};

function DropshipProducts({
    filters = {},
    globalSearchQuery = '',
    initialCategory = 'All Categories',
}) {
    const addToCart = useCartStore((state) => state.addToCart);

    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table');

    // --- ADVANCED FILTER STATE ---
    const [category, setCategory] = useState('All Categories');
    const [sort, setSort] = useState('default');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedGst, setSelectedGst] = useState([]);
    const [maxDispatchDays, setMaxDispatchDays] = useState('');
    const [verifiedOnly, setVerifiedOnly] = useState(false);

    const [activeQuantities, setActiveQuantities] = useState({});
    const [addedIds, setAddedIds] = useState([]);

    const [b2bFilters, setB2bFilters] = useState({
        moq: filters.moq || 'all',
        margin: filters.margin || 0,
        readyToShip: filters.readyToShip || false,
        lowRtoRisk: filters.lowRtoRisk || false,
    });

    useEffect(() => {
        setB2bFilters({
            moq: filters.moq || 'all',
            margin: filters.margin || 0,
            readyToShip: filters.readyToShip || false,
            lowRtoRisk: filters.lowRtoRisk || false,
        });
    }, [filters]);

    useEffect(() => {
        if (initialCategory) setCategory(initialCategory);
    }, [initialCategory]);

    const { data: rawCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data.data || [];
        },
    });

    const dbCategories = useMemo(
        () =>
            rawCategories.filter((cat, index, list) => {
                const normalizedName = cat.name.trim().toLowerCase();
                return (
                    index ===
                    list.findIndex((item) => item.name.trim().toLowerCase() === normalizedName)
                );
            }),
        [rawCategories]
    );

    const selectedCatId = useMemo(() => {
        if (category === 'All Categories') return null;
        const found = dbCategories.find((c) => c.name === category);
        return found ? found._id : null;
    }, [category, dbCategories]);

    useEffect(() => {
        if (globalSearchQuery) {
            setCategory('All Categories');
            resetAdvancedFilters();
        }
    }, [globalSearchQuery]);

    // --- API CALL ---
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: [
            'products',
            selectedCatId,
            sort,
            minPrice,
            maxPrice,
            selectedGst,
            maxDispatchDays,
            verifiedOnly,
            b2bFilters,
            globalSearchQuery,
        ],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({ page: pageParam, limit: 30 });
            if (selectedCatId) params.append('category', selectedCatId);
            if (globalSearchQuery) params.append('search', globalSearchQuery);
            if (sort !== 'default') params.append('sort', sort);
            if (minPrice) params.append('minBasePrice', minPrice);
            if (maxPrice) params.append('maxBasePrice', maxPrice);
            if (selectedGst.length > 0) params.append('gstSlab', selectedGst.join(','));
            if (maxDispatchDays) params.append('maxShippingDays', maxDispatchDays);
            if (verifiedOnly) params.append('isVerifiedSupplier', 'true');
            if (b2bFilters.margin && b2bFilters.margin > 0)
                params.append('minMargin', b2bFilters.margin.toString());
            if (b2bFilters.moq === 'under-50') params.append('maxMoq', '50');
            else if (b2bFilters.moq === '50-500') {
                params.append('minMoq', '50');
                params.append('maxMoq', '500');
            } else if (b2bFilters.moq === 'bulk') params.append('minMoq', '500');
            if (b2bFilters.readyToShip) params.append('inStock', 'true');
            if (b2bFilters.lowRtoRisk) params.append('lowRtoRisk', 'true');

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
    }, [data]);

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

    const handleQtyChange = (id, newQty, moq) => {
        if (newQty < moq) return;
        setActiveQuantities((prev) => ({ ...prev, [id]: newQty }));
    };

    const handleAdd = async (product, e) => {
        e.preventDefault();
        e.stopPropagation();
        const qtyToAdd = activeQuantities[product.id] || product.moq;
        setAddedIds((prev) => [...prev, product.id]);
        await addToCart(product.id, qtyToAdd, 'WHOLESALE', 0);
        setTimeout(() => setAddedIds((prev) => prev.filter((x) => x !== product.id)), 1800);
    };

    const toggleGst = (slab) =>
        setSelectedGst((prev) =>
            prev.includes(slab) ? prev.filter((g) => g !== slab) : [...prev, slab]
        );

    return (
        <section className="relative z-10 w-full pt-4 font-sans">
            {/* Utility Bar */}
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
                            title="Table View"
                        >
                            <AlignJustify size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded px-3 py-1.5 transition-colors ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition-colors focus-within:border-slate-400">
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
                {/* ADVANCED FILTERS SIDEBAR */}
                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 lg:sticky lg:top-24 lg:z-0 lg:h-fit lg:w-64 lg:translate-x-0 lg:rounded-xl lg:border lg:border-slate-200 lg:p-5 lg:shadow-sm ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-sm font-bold text-slate-900">Filters</h3>
                        <div className="flex items-center gap-2">
                            <button
                                className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
                                onClick={resetAll}
                            >
                                Clear All
                            </button>
                            <button
                                className="p-1 text-slate-400 lg:hidden"
                                onClick={() => setIsMobileFilterOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Categories */}
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <Box size={14} /> Category
                            </h4>
                            <div className="custom-scrollbar max-h-48 space-y-0.5 overflow-y-auto pr-2">
                                {[{ _id: 'All', name: 'All Categories' }, ...dbCategories].map(
                                    (cat) => (
                                        <label
                                            key={cat._id || cat.name}
                                            className="group flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                                        >
                                            <span
                                                className={`text-sm transition-colors ${category === cat.name ? 'font-bold text-emerald-600' : 'font-medium text-slate-600 group-hover:text-slate-900'}`}
                                            >
                                                {cat.name}
                                            </span>
                                            <input
                                                type="radio"
                                                className="sr-only"
                                                checked={category === cat.name}
                                                onChange={() => setCategory(cat.name)}
                                            />
                                            {category === cat.name && (
                                                <Check size={14} className="text-emerald-600" />
                                            )}
                                        </label>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Price */}
                        <div className="space-y-3 border-t border-slate-100 pt-5">
                            <h4 className="text-xs font-semibold text-slate-700">Unit Price (₹)</h4>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>

                        {/* GST Slab */}
                        <div className="space-y-3 border-t border-slate-100 pt-5">
                            <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <Receipt size={14} /> GST Slab
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[5, 12, 18, 28].map((slab) => (
                                    <label
                                        key={slab}
                                        className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg border py-2 transition-all ${selectedGst.includes(slab) ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-700' : 'border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={selectedGst.includes(slab)}
                                            onChange={() => toggleGst(slab)}
                                        />
                                        <span className="text-sm">{slab}%</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Dispatch Time */}
                        <div className="space-y-3 border-t border-slate-100 pt-5">
                            <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <Truck size={14} /> Dispatch Target
                            </h4>
                            <div className="flex flex-col gap-2">
                                {[
                                    { val: '1', label: 'Under 24 Hours' },
                                    { val: '3', label: 'Under 3 Days' },
                                    { val: '7', label: 'Under 7 Days' },
                                ].map((time) => (
                                    <button
                                        key={time.val}
                                        onClick={() =>
                                            setMaxDispatchDays(
                                                maxDispatchDays === time.val ? '' : time.val
                                            )
                                        }
                                        className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${maxDispatchDays === time.val ? 'border-slate-900 bg-slate-900 font-bold text-white' : 'border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        {time.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Verified Supplier */}
                        <div className="border-t border-slate-100 pt-5">
                            <label className="group flex cursor-pointer items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors group-hover:text-slate-900">
                                    <ShieldCheck size={16} className="text-blue-600" /> Verified
                                    Vendors
                                </span>
                                <div
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${verifiedOnly ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={verifiedOnly}
                                        onChange={() => setVerifiedOnly(!verifiedOnly)}
                                    />
                                    <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${verifiedOnly ? 'translate-x-4.5' : 'translate-x-1'}`}
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                </aside>

                {/* MAIN PRODUCT AREA */}
                <div className="w-full min-w-0 flex-1 pb-12">
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
                            <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">
                                We couldn't find any inventory matching your current filter
                                criteria.
                            </p>
                            <button
                                onClick={resetAll}
                                className="mt-6 rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className={
                                viewMode === 'table'
                                    ? 'flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
                                    : 'grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4'
                            }
                        >
                            {/* Table Header */}
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

                            <AnimatePresence>
                                {displayProducts.map((product) => {
                                    const isAdded = addedIds.includes(product.id);
                                    const currentQty = activeQuantities[product.id] || product.moq;

                                    if (viewMode === 'table') {
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={product.id}
                                                className="group flex flex-col border-b border-slate-100 p-4 transition-colors last:border-0 hover:bg-slate-50/50 md:grid md:grid-cols-[auto_1fr_120px_120px_120px_160px] md:items-center md:gap-4 md:p-3"
                                            >
                                                {/* Image */}
                                                <div className="hidden h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>

                                                {/* Details */}
                                                <div className="flex min-w-0 flex-col justify-center">
                                                    <div className="mb-0.5 flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-slate-400">
                                                            SKU: {product.skuId}
                                                        </span>
                                                        {product.isVerified && (
                                                            <ShieldCheck
                                                                size={14}
                                                                className="text-blue-500"
                                                                title="Verified Vendor"
                                                            />
                                                        )}
                                                    </div>
                                                    <Link
                                                        to={`/product/${product.id}`}
                                                        className="truncate text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    <span className="truncate text-xs font-medium text-slate-500">
                                                        By {product.vendor}
                                                    </span>
                                                </div>

                                                {/* Logistics */}
                                                <div className="hidden flex-col items-center justify-center md:flex">
                                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                                        <Clock
                                                            size={14}
                                                            className="text-slate-400"
                                                        />{' '}
                                                        {product.dispatchDays} Days
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">
                                                        Stock: {product.stock}
                                                    </span>
                                                </div>

                                                {/* Financials */}
                                                <div className="hidden flex-col items-center justify-center md:flex">
                                                    <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                                                        <TrendingUp size={14} /> {product.margin}%
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">
                                                        {product.gst}% GST
                                                    </span>
                                                </div>

                                                {/* Price */}
                                                <div className="hidden flex-col items-end justify-center md:flex">
                                                    <span className="text-base font-extrabold text-slate-900">
                                                        ₹{product.price.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400 line-through">
                                                        MRP: ₹{product.originalPrice}
                                                    </span>
                                                </div>

                                                {/* Action & Quantity */}
                                                <div className="mt-4 flex flex-col gap-2 md:mt-0">
                                                    <div className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2">
                                                        <button
                                                            onClick={() =>
                                                                handleQtyChange(
                                                                    product.id,
                                                                    currentQty - product.moq,
                                                                    product.moq
                                                                )
                                                            }
                                                            className="text-slate-400 hover:text-slate-900"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={currentQty}
                                                            onChange={(e) =>
                                                                handleQtyChange(
                                                                    product.id,
                                                                    parseInt(e.target.value) ||
                                                                        product.moq,
                                                                    product.moq
                                                                )
                                                            }
                                                            className="w-12 text-center text-sm font-bold text-slate-900 outline-none"
                                                            min={product.moq}
                                                            step={product.moq}
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                handleQtyChange(
                                                                    product.id,
                                                                    currentQty + product.moq,
                                                                    product.moq
                                                                )
                                                            }
                                                            className="text-slate-400 hover:text-slate-900"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleAdd(product, e)}
                                                        className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${isAdded ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                                    >
                                                        {isAdded ? (
                                                            <>
                                                                <Check size={14} /> Added
                                                            </>
                                                        ) : (
                                                            'Quick Add'
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    }

                                    // Grid View
                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            key={product.id}
                                            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-lg"
                                        >
                                            <Link
                                                to={`/product/${product.id}`}
                                                className="relative aspect-square overflow-hidden bg-slate-50"
                                            >
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                    {product.margin >= 40 && (
                                                        <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                                                            High Margin
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="flex flex-1 flex-col p-4">
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="text-xs font-medium text-slate-500">
                                                        SKU: {product.skuId}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        MOQ: {product.moq}
                                                    </span>
                                                </div>
                                                <Link
                                                    to={`/product/${product.id}`}
                                                    className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600"
                                                >
                                                    {product.name}
                                                </Link>
                                                <div className="mt-auto flex items-end justify-between pt-4">
                                                    <div>
                                                        <span className="block text-xs font-medium text-slate-400 line-through">
                                                            ₹{product.originalPrice}
                                                        </span>
                                                        <span className="text-lg font-extrabold text-slate-900">
                                                            ₹{product.price.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-sm font-bold text-emerald-600">
                                                            {product.margin}% Margin
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Grid Quantity & Add */}
                                                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                                                    <div className="flex h-10 w-1/3 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2">
                                                        <input
                                                            type="number"
                                                            value={currentQty}
                                                            onChange={(e) =>
                                                                handleQtyChange(
                                                                    product.id,
                                                                    parseInt(e.target.value) ||
                                                                        product.moq,
                                                                    product.moq
                                                                )
                                                            }
                                                            className="w-full bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                                                            min={product.moq}
                                                            step={product.moq}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleAdd(product, e)}
                                                        className={`flex h-10 w-2/3 items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition-all ${isAdded ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                                    >
                                                        {isAdded ? 'Added' : 'Add to Cart'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
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

export default DropshipProducts;
