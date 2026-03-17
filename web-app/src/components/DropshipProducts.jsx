import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
    Star,
    Heart,
    Check,
    SlidersHorizontal,
    ChevronDown,
    X,
    ShieldCheck,
    Box,
    TrendingUp,
    Clock,
    Percent,
} from 'lucide-react';
import { productApi } from '../features/products/api/productApi.js';
import { useCartStore } from '../store/cartStore';
import { WishlistContext } from '../WishlistContext.jsx';
import B2BFilterBar from './B2BFilterBar';

const SORT_OPTIONS = [
    { value: 'default', label: 'Recommended Suppliers' },
    { value: 'price-asc', label: 'Bulk Price: Low to High' },
    { value: 'price-desc', label: 'Bulk Price: High to Low' },
    { value: 'rating', label: 'Top Rated Suppliers' },
    { value: 'margin', label: 'Highest Profit Margin' },
];

function DropshipProducts({
    filters = {},
    globalSearchQuery = '',
    initialCategory = 'All Categories',
    customTitle = 'Verified Wholesale Inventory',
    customSubtitle = 'Source direct from manufacturers. Maximize your retail margins.',
    hideTitle = false,
}) {
    const addToCart = useCartStore((state) => state.addToCart);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);

    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [category, setCategory] = useState('All Categories');
    const [sort, setSort] = useState('default');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [addedIds, setAddedIds] = useState([]);

    const [b2bFilters, setB2bFilters] = useState({
        moq: filters.moq || 'all',
        margin: filters.margin || 'all',
        readyToShip: filters.readyToShip || false,
    });

    const handleFilterChange = (key, value) => {
        setB2bFilters((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (initialCategory) {
            setCategory(initialCategory);
        }
    }, [initialCategory]);

    const { data: rawCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: productApi.getCategories,
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
            setMinPrice('');
            setMaxPrice('');
            setMinRating(0);
        }
    }, [globalSearchQuery]);

    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: [
            'products',
            selectedCatId,
            sort,
            minPrice,
            maxPrice,
            minRating,
            filters,
            globalSearchQuery,
        ],
        queryFn: ({ pageParam = 1 }) =>
            productApi.getProducts({
                page: pageParam,
                limit: 24,
                categoryId: selectedCatId,
                sort,
                minPrice,
                maxPrice,
                minRating,
                inStock: filters.readyToShip ? true : undefined,
                moqTier: filters.moq !== 'all' ? filters.moq : undefined,
                marginFilter: filters.margin !== 'all' ? filters.margin : undefined,
                query: globalSearchQuery,
            }),
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
                const wholesalePrice = p.platformSellPrice;
                const retailMrp = p.compareAtPrice || Math.floor(wholesalePrice * 1.8);
                const estMargin = Math.round(((retailMrp - wholesalePrice) / retailMrp) * 100);

                return {
                    id: p._id,
                    skuId: p.sku || 'N/A',
                    vendor: p.vendor || 'Verified Supplier',
                    stock: p.inventory?.stock ?? 'In Stock',
                    name: p.title,
                    category: p.categoryId?.name || p.productType || 'Uncategorized',
                    price: wholesalePrice,
                    originalPrice: retailMrp,
                    margin: estMargin,
                    rating: p.averageRating || 4.5,
                    reviews: p.reviewCount || 0,
                    image:
                        p.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80',
                    moq: p.moq || Math.floor(Math.random() * 50) + 10,
                    gst: p.gstPercent || 18,
                    isVerified: p.isVerifiedSupplier || true,
                    dispatchDays: p.dispatchDays || 2,
                };
            });
    }, [data]);

    const resetFilters = () => {
        setCategory('All Categories');
        setSort('default');
        setMinPrice('');
        setMaxPrice('');
        setMinRating(0);

        if (globalSearchQuery) {
            window.history.pushState({}, '', window.location.pathname);
        }
    };

    const handleAdd = (product, e) => {
        e.preventDefault();
        e.stopPropagation();
        setAddedIds((prev) => [...prev, product.id]);
        addToCart(
            {
                _id: product.id,
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                sku: product.skuId,
                minQuantity: product.moq,
            },
            product.moq
        );
        setTimeout(() => setAddedIds((prev) => prev.filter((x) => x !== product.id)), 1800);
    };

    return (
        <section className="relative z-10 w-full">
            {!hideTitle && (
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
                            {customTitle}
                        </h2>
                        {globalSearchQuery ? (
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Search results for:{' '}
                                <span className="text-primary font-bold">
                                    "{globalSearchQuery}"
                                </span>
                            </p>
                        ) : (
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                {customSubtitle}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 md:hidden"
                            onClick={() => setIsMobileFilterOpen(true)}
                        >
                            <SlidersHorizontal size={16} /> Filters
                        </button>

                        <div className="focus-within:border-primary focus-within:ring-primary/20 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 shadow-sm transition-all focus-within:ring-2">
                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Sort:
                            </span>
                            <div className="relative">
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                    className="cursor-pointer appearance-none bg-transparent py-1 pr-6 text-sm font-bold text-slate-700 outline-none"
                                >
                                    {SORT_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-start gap-8 md:flex-row">
                {isMobileFilterOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
                        onClick={() => setIsMobileFilterOpen(false)}
                    />
                )}

                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 md:relative md:sticky md:top-32 md:z-0 md:h-fit md:w-64 md:translate-x-0 md:rounded-2xl md:border md:border-slate-200 md:bg-white md:p-6 md:shadow-sm ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-lg font-extrabold text-slate-900">Advanced Filters</h3>
                        <div className="flex items-center gap-3">
                            <button
                                className="text-primary hover:text-primary-light text-xs font-bold transition-colors"
                                onClick={resetFilters}
                            >
                                Clear
                            </button>
                            <button
                                className="p-1 text-slate-400 hover:text-slate-900 md:hidden"
                                onClick={() => setIsMobileFilterOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                <Box size={14} /> Categories
                            </h4>
                            <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2">
                                {[{ _id: 'All', name: 'All Categories' }, ...dbCategories].map(
                                    (cat) => (
                                        <label
                                            key={cat._id || cat.name}
                                            className="group flex cursor-pointer items-center gap-3"
                                        >
                                            <div
                                                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${category === cat.name ? 'border-primary bg-primary' : 'group-hover:border-primary border-slate-300'}`}
                                            >
                                                {category === cat.name && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                                )}
                                            </div>
                                            <input
                                                type="radio"
                                                className="hidden"
                                                checked={category === cat.name}
                                                onChange={() => setCategory(cat.name)}
                                            />
                                            <span
                                                className={`text-sm font-semibold transition-colors ${category === cat.name ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}
                                            >
                                                {cat.name}
                                            </span>
                                        </label>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Unit Price (₹)
                            </h4>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="focus:border-primary focus:ring-primary w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 transition-all outline-none focus:ring-1"
                                    />
                                </div>
                                <span className="font-bold text-slate-300">-</span>
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="focus:border-primary focus:ring-primary w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 transition-all outline-none focus:ring-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Supplier Rating
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {[4.5, 4.0, 3.5, 0].map((r) => (
                                    <button
                                        key={r}
                                        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${minRating === r ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                        onClick={() => setMinRating(r)}
                                    >
                                        {r === 0 ? (
                                            'Any'
                                        ) : (
                                            <>
                                                {r}+ <Star size={12} fill="currentColor" />
                                            </>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="w-full flex-1">
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                                >
                                    <div className="mb-4 aspect-[4/5] animate-pulse rounded-xl bg-slate-100"></div>
                                    <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-slate-100"></div>
                                    <div className="mb-4 h-4 w-1/2 animate-pulse rounded bg-slate-100"></div>
                                    <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100"></div>
                                </div>
                            ))}
                        </div>
                    ) : displayProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-24 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <Box size={32} />
                            </div>
                            <h3 className="mb-2 text-xl font-extrabold text-slate-900">
                                No matching inventory
                            </h3>
                            <p className="mb-6 font-medium text-slate-500">
                                Try adjusting your filters, MOQ requirements, or categories.
                            </p>
                            <button
                                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                                onClick={resetFilters}
                            >
                                Reset All Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {displayProducts.map((product) => {
                                    const isAdded = addedIds.includes(product.id);
                                    const isWishlisted = isInWishlist(product.id);

                                    return (
                                        <div
                                            className="group hover:border-primary/50 relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl"
                                            key={product.id}
                                        >
                                            <Link to={`/product/${product.id}`} className="block">
                                                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        loading="lazy"
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />

                                                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                                                        {product.isVerified && (
                                                            <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur">
                                                                <ShieldCheck
                                                                    size={12}
                                                                    className="text-green-600"
                                                                />{' '}
                                                                Verified Supplier
                                                            </span>
                                                        )}
                                                        {product.margin >= 40 && (
                                                            <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-100/95 px-2 py-1 text-[10px] font-bold text-amber-800 shadow-sm backdrop-blur">
                                                                <TrendingUp size={12} /> High Margin
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>

                                            <button
                                                className={`absolute top-6 right-6 rounded-full border p-2 shadow-md transition-all duration-300 ${isWishlisted ? 'bg-danger border-danger text-white' : 'hover:text-danger border-white bg-white/90 text-slate-400 backdrop-blur hover:scale-110'}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggleWishlist({ id: product.id, ...product });
                                                }}
                                            >
                                                <Heart
                                                    size={16}
                                                    fill={isWishlisted ? 'currentColor' : 'none'}
                                                />
                                            </button>

                                            <div className="flex flex-1 flex-col">
                                                <div className="mb-1 flex items-start justify-between">
                                                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                        {product.category}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                        <Clock size={10} /> Dispatches in{' '}
                                                        {product.dispatchDays}d
                                                    </span>
                                                </div>

                                                <Link to={`/product/${product.id}`}>
                                                    <h3 className="group-hover:text-primary mb-1 line-clamp-2 text-sm leading-snug font-bold text-slate-900 transition-colors">
                                                        {product.name}
                                                    </h3>
                                                </Link>

                                                {}
                                                <div className="mb-3 flex items-center justify-between text-[10px] text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
                                                            SKU: {product.skuId}
                                                        </span>
                                                        {product.stock > 0 &&
                                                            product.stock <= 50 && (
                                                                <span className="text-danger font-bold">
                                                                    Only {product.stock} left
                                                                </span>
                                                            )}
                                                    </div>
                                                    <span className="max-w-[45%] truncate font-medium">
                                                        By {product.vendor}
                                                    </span>
                                                </div>

                                                <div className="mb-3 grid grid-cols-3 gap-2 divide-x divide-slate-200 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                                                    <div className="pl-1">
                                                        <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                            MOQ
                                                        </span>
                                                        <span className="font-bold text-slate-900">
                                                            {product.moq} Units
                                                        </span>
                                                    </div>
                                                    <div className="pl-3">
                                                        <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                            GST
                                                        </span>
                                                        <span className="font-bold text-slate-900">
                                                            {product.gst}%
                                                        </span>
                                                    </div>
                                                    <div className="pl-3">
                                                        <span className="mb-0.5 block flex items-center gap-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                            <Percent size={10} /> Margin
                                                        </span>
                                                        <span className="font-bold text-emerald-600">
                                                            ~{product.margin}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto border-t border-slate-100 pt-4">
                                                    <div className="mb-4 flex items-end justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-slate-400 line-through">
                                                                Retail MRP: ₹
                                                                {product.originalPrice.toLocaleString(
                                                                    'en-IN'
                                                                )}
                                                            </span>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                                                                    ₹
                                                                    {product.price.toLocaleString(
                                                                        'en-IN'
                                                                    )}
                                                                </span>
                                                                <span className="text-xs font-medium text-slate-500">
                                                                    /unit
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold shadow-sm transition-all duration-300 ${isAdded ? 'border-green-500 bg-green-500 text-white shadow-green-500/20' : 'bg-primary border-primary hover:bg-primary-light text-white'}`}
                                                        onClick={(e) => handleAdd(product, e)}
                                                    >
                                                        {isAdded ? (
                                                            <>
                                                                <Check size={16} /> Added Bulk
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Box size={16} /> Add Bulk Order
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {hasNextPage && (
                                <div className="mt-12 flex justify-center">
                                    <button
                                        className="rounded-full border border-slate-200 bg-white px-8 py-3 font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                    >
                                        {isFetchingNextPage ? 'Loading...' : 'Load More Inventory'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

export default DropshipProducts;
