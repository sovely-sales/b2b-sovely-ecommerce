import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Star, Heart, ShoppingCart, Check, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { productApi } from '../features/products/api/productApi.js';
import { CartContext } from '../CartContext.jsx';
import { WishlistContext } from '../WishlistContext.jsx';

const SORT_OPTIONS = [
    { value: 'default', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'reviews', label: 'Most Reviewed' },
];

function DropshipProducts({ 
    externalCategory, 
    onCategoryChange, 
    globalSearchQuery = '',
    customTitle = "Featured Products",
    customSubtitle = "Curated products ready to add to your store"
}) {
    const { cartItems, addToCart, updateQuantity } = useContext(CartContext);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const { data: rawCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: productApi.getCategories
    });

    const dbCategories = useMemo(() => 
        rawCategories.filter((cat, index, list) => {
            const normalizedName = cat.name.trim().toLowerCase();
            return index === list.findIndex(item => item.name.trim().toLowerCase() === normalizedName);
        }),
    [rawCategories]);

    // Filter State
    const [category, setCategory] = useState(externalCategory || 'All');
    const [sort, setSort] = useState('default');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [saleOnly, setSaleOnly] = useState(false);
    const [addedIds, setAddedIds] = useState([]);

    const selectedCatId = useMemo(() => {
        if (category === 'All') return null;
        const found = dbCategories.find(c => c.name === category);
        return found ? found._id : null;
    }, [category, dbCategories]);

    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: ['products', selectedCatId, sort, minPrice, maxPrice, minRating, saleOnly, globalSearchQuery],
        queryFn: ({ pageParam = 1 }) => productApi.getProducts({
            page: pageParam,
            limit: 24,
            categoryId: selectedCatId,
            sort,
            minPrice,
            maxPrice,
            minRating,
            saleOnly,
            query: globalSearchQuery
        }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const page = lastPage?.pagination?.page ?? 1;
            const pages = lastPage?.pagination?.pages ?? 1;
            return page < pages ? page + 1 : undefined;
        }
    });

    const displayProducts = useMemo(() => {
        if (!data) return [];
        return data.pages.flatMap(page => page.products || []).map(p => ({
            id: p._id,
            skuId: p.sku,
            name: p.title,
            category: p.categoryId?.name || p.productType || 'All',
            price: p.platformSellPrice,
            originalPrice: p.compareAtPrice || Math.floor(p.platformSellPrice * 1.2),
            rating: p.averageRating || 4.5,
            reviews: p.reviewCount || 0,
            sale: p.discountPercent > 0,
            image: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80'
        }));
    }, [data]);

    useEffect(() => {
        if (externalCategory && externalCategory !== category) {
            setCategory(externalCategory);
        }
    }, [externalCategory]);

    const handleSetCategory = (cat) => {
        setCategory(cat);
        if (onCategoryChange) onCategoryChange(cat);
    };

    const resetFilters = () => {
        handleSetCategory('All'); setSort('default'); setMinPrice(''); setMaxPrice('');
        setMinRating(0); setSaleOnly(false);
        if (globalSearchQuery) window.history.pushState({}, '', '/');
    };

    const handleAdd = (product, e) => {
        e.preventDefault();
        e.stopPropagation();
        setAddedIds(prev => [...prev, product.id]);
        addToCart({
            _id: product.id, id: product.id, name: product.name,
            price: product.price, image: product.image, sku: product.skuId
        });
        setTimeout(() => setAddedIds(prev => prev.filter(x => x !== product.id)), 1800);
    };

    return (
        <section className="relative z-10 w-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">{customTitle}</h2>
                    {globalSearchQuery ? (
                        <p className="text-sm text-slate-500 font-medium mt-1">Search results for: <span className="text-accent">"{globalSearchQuery}"</span></p>
                    ) : (
                        <p className="text-sm text-slate-500 font-medium mt-1">{customSubtitle}</p>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-sm transition-colors" 
                        onClick={() => setIsMobileFilterOpen(true)}
                    >
                        <SlidersHorizontal size={16} /> Filters
                    </button>
                    
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
                        <div className="relative">
                            <select 
                                value={sort} 
                                onChange={e => setSort(e.target.value)}
                                className="appearance-none bg-transparent outline-none text-sm font-bold text-slate-700 pr-6 cursor-pointer py-1"
                            >
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Mobile Overlay */}
                {isMobileFilterOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileFilterOpen(false)} />
                )}

                {/* Sidebar Filters */}
                <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 md:relative md:translate-x-0 md:w-64 md:z-0 md:bg-white md:rounded-3xl md:shadow-sm md:border md:border-slate-100 md:p-6 md:h-fit md:sticky md:top-28 ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-extrabold text-slate-900">Filters</h3>
                        <div className="flex items-center gap-3">
                            <button className="text-xs font-bold text-accent hover:text-accent-glow transition-colors" onClick={resetFilters}>Clear</button>
                            <button className="md:hidden p-1 text-slate-400 hover:text-slate-900" onClick={() => setIsMobileFilterOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Category Filter */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {[{ _id: 'All', name: 'All' }, ...dbCategories].map(cat => (
                                    <label key={cat._id || cat.name} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${category === cat.name ? 'border-accent bg-accent' : 'border-slate-300 group-hover:border-accent'}`}>
                                            {category === cat.name && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <input type="radio" className="hidden" checked={category === cat.name} onChange={() => handleSetCategory(cat.name)} />
                                        <span className={`text-sm font-semibold transition-colors ${category === cat.name ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range</h4>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                                    <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                                </div>
                                <span className="text-slate-300 font-bold">-</span>
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                                    <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating</h4>
                            <div className="flex flex-wrap gap-2">
                                {[4.5, 4.0, 3.5, 0].map(r => (
                                    <button 
                                        key={r} 
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${minRating === r ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`} 
                                        onClick={() => setMinRating(r)}
                                    >
                                        {r === 0 ? 'Any' : <>{r}+ <Star size={12} fill="currentColor" /></>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sale Toggle */}
                        <label className="flex items-center justify-between cursor-pointer group pt-4 border-t border-slate-100">
                            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Sale Items Only</span>
                            <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${saleOnly ? 'bg-accent' : 'bg-slate-200'}`} onClick={() => setSaleOnly(!saleOnly)}>
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${saleOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </label>
                    </div>
                </aside>

                {/* Main Product Grid */}
                <div className="flex-1 w-full">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
                                    <div className="aspect-[4/5] bg-slate-100 rounded-2xl animate-pulse mb-4"></div>
                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4 mb-2"></div>
                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2 mb-4"></div>
                                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : displayProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center px-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <ShoppingCart size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900 mb-2">No products found</h3>
                            <p className="text-slate-500 font-medium mb-6">Try adjusting your filters or search query.</p>
                            <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-accent transition-colors shadow-lg" onClick={resetFilters}>
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {displayProducts.map(product => {
                                    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                                    const isAdded = addedIds.includes(product.id);
                                    const isWishlisted = isInWishlist(product.id);
                                    const cartItem = cartItems.find(item => item.product.id === product.id);

                                    return (
                                        <Link to={`/product/${product.id}`} className="group bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:border-accent/30 transition-all duration-300 flex flex-col" key={product.id}>
                                            <div className="aspect-[4/5] rounded-2xl overflow-hidden relative bg-slate-50 mb-4">
                                                <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                
                                                {/* Badges */}
                                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                    {product.sale && <span className="bg-danger text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">Sale</span>}
                                                    {discount > 0 && <span className="bg-white/90 backdrop-blur text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border border-white">{discount}% OFF</span>}
                                                </div>

                                                {/* Wishlist FAB */}
                                                <button 
                                                    className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-all duration-300 border ${isWishlisted ? 'bg-danger text-white border-danger' : 'bg-white/80 backdrop-blur text-slate-400 border-white hover:bg-white hover:text-danger hover:scale-110'}`}
                                                    onClick={(e) => { e.preventDefault(); toggleWishlist({ id: product.id, ...product }); }}
                                                >
                                                    <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
                                                </button>
                                            </div>

                                            <div className="flex flex-col flex-1">
                                                <span className="text-[10px] text-accent font-extrabold uppercase tracking-widest mb-1">{product.category}</span>
                                                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                                                
                                                <div className="flex items-center gap-1.5 mb-3 mt-auto">
                                                    <Star size={14} className="text-yellow-400" fill="currentColor" />
                                                    <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                                                    <span className="text-xs font-medium text-slate-400">({product.reviews})</span>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-extrabold text-slate-900 tracking-tight">₹{product.price.toLocaleString('en-IN')}</span>
                                                        {discount > 0 && <span className="text-xs font-semibold text-slate-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
                                                    </div>

                                                    {cartItem ? (
                                                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-1 h-11" onClick={e => e.preventDefault()}>
                                                            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 font-bold shadow-sm hover:text-slate-900 transition-colors" onClick={() => updateQuantity(product.id, -1)}>-</button>
                                                            <span className="font-extrabold text-slate-900 text-sm">{cartItem.quantity}</span>
                                                            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 font-bold shadow-sm hover:text-slate-900 transition-colors" onClick={() => updateQuantity(product.id, 1)}>+</button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            className={`flex items-center justify-center gap-2 w-full h-11 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm ${isAdded ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-slate-900 text-white hover:bg-accent hover:shadow-accent/30'}`}
                                                            onClick={(e) => handleAdd(product, e)}
                                                        >
                                                            {isAdded ? <><Check size={16} /> Added</> : <><ShoppingCart size={16} /> Add to Cart</>}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {hasNextPage && (
                                <div className="flex justify-center mt-12">
                                    <button 
                                        className="px-8 py-3 bg-white border border-slate-200 rounded-full font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transition-all disabled:opacity-50" 
                                        onClick={() => fetchNextPage()} 
                                        disabled={isFetchingNextPage}
                                    >
                                        {isFetchingNextPage ? 'Loading...' : 'Load More Products'}
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