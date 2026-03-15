import React, { useState, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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

function Stars({ rating }) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
        <span className="pc-stars" aria-label={`Rating: ${rating} out of 5 stars`}>
            {'★'.repeat(full)}
            {half ? '⯨' : ''}
            <span style={{ opacity: 0.3 }}>{'★'.repeat(empty)}</span>
        </span>
    );
}

function DropshipProducts({ 
    externalCategory, 
    onCategoryChange, 
    globalSearchQuery = '',
    customTitle = "Featured Products",
    customSubtitle = "Curated products ready to add to your store"
}) {
    const { cartItems, addToCart, updateQuantity } = useContext(CartContext);
    // Fetch categories first (suspended) to map category names to IDs
    const { data: rawCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: productApi.getCategories
    });
    const dbCategories = useMemo(
        () =>
            rawCategories.filter((cat, index, list) => {
                const normalizedName = cat.name.trim().toLowerCase();
                return index === list.findIndex(item => item.name.trim().toLowerCase() === normalizedName);
            }),
        [rawCategories]
    );

    // ── Filter state ─────────────────────────────────────────────────────────
    const [category, setCategory] = useState(externalCategory || 'All');
    const [sort, setSort] = useState('default');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [shipping, setShipping] = useState([]);
    const [minRating, setMinRating] = useState(0);
    const [saleOnly, setSaleOnly] = useState(false);
    const [addedIds, setAddedIds] = useState([]);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);

    const selectedCatId = useMemo(() => {
        if (category === 'All') return null;
        const found = dbCategories.find(c => c.name === category);
        return found ? found._id : null;
    }, [category, dbCategories]);

    // Fetch products using useInfiniteQuery, now driven entirely by the backend!
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage
    } = useInfiniteQuery({
        // Add globalSearchQuery to the queryKey so it refetches when the search changes!
        queryKey: ['products', selectedCatId, sort, minPrice, maxPrice, shipping, minRating, saleOnly, globalSearchQuery],
        queryFn: ({ pageParam = 1 }) => productApi.getProducts({
            page: pageParam,
            limit: 24,
            categoryId: selectedCatId,
            sort,
            minPrice,
            maxPrice,
            shipping,
            minRating,
            saleOnly,
            query: globalSearchQuery // PASS TO API
        }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
        const page = lastPage?.pagination?.page ?? 1;
        const pages = lastPage?.pagination?.pages ?? 1;
        return page < pages ? page + 1 : undefined;
        }
    });

    // We no longer need local filtering! Just flatten the pages and use the REAL DB values.
    const displayProducts = useMemo(() => {
        if (!data) return [];
        const allProducts = data.pages.flatMap(page => page.products || []);
        
        return allProducts.map(p => ({
            id: p._id,
            skuId: p.sku,
            name: p.title,
            category: p.categoryId?.name || p.productType || 'All',
            price: p.platformSellPrice,
            originalPrice: p.compareAtPrice || Math.floor(p.platformSellPrice * 1.2),
            // Now using REAL database values instead of Math.random()
            rating: p.averageRating || 4.5,
            reviews: p.reviewCount || 0,
            sale: p.discountPercent > 0,
            shipping: p.shippingDays || '3-5',
            image: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80'
        }));
    }, [data]);

    // Sync external category (from navbar/categories section) into internal state
    React.useEffect(() => {
        if (externalCategory && externalCategory !== category) {
            setCategory(externalCategory);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalCategory]);

    // When internal category changes, notify parent too
    const handleSetCategory = (cat) => {
        setCategory(cat);
        if (onCategoryChange) onCategoryChange(cat);
    };

    const toggleShipping = (val) =>
        setShipping(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);

    const resetFilters = () => {
        handleSetCategory('All'); setSort('default'); setMinPrice(''); setMaxPrice('');
        setShipping([]); setMinRating(0); setSaleOnly(false);
        // Clear the URL search param if it exists
        if (globalSearchQuery) window.history.pushState({}, '', '/');
    };

    const handleAdd = (id) => {
        setAddedIds(prev => [...prev, id]);
        setTimeout(() => setAddedIds(prev => prev.filter(x => x !== id)), 1800);
    };

    return (
        <section className="dropship-section">
            <div className="section-container">
                <div className="section-header dropship-header">
                    <div>
                        <h2 className="section-title">{customTitle}</h2>
                        <p className="section-subtitle">{customSubtitle}</p>
                    </div>
                    {/* Sort dropdown */}
                    <div className="ds-sort-wrapper">
                        <label className="ds-sort-label">Sort by</label>
                        <select
                            className="ds-sort-select"
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="dropship-layout">
                {/* ── Filter Sidebar ── */}
                <aside className="dropship-filters">
                    <div className="filter-panel-header">
                        <span className="filter-panel-title">🎛️ Filters</span>
                        <button className="filter-reset-btn" onClick={resetFilters}>Reset</button>
                    </div>

                    {/* Sale toggle */}
                    <div className="filter-group">
                        <label className="filter-toggle-label">
                            <span className="filter-title">On Sale Only</span>
                            <button
                                className={`filter-toggle ${saleOnly ? 'filter-toggle-on' : ''}`}
                                onClick={() => setSaleOnly(v => !v)}
                                aria-pressed={saleOnly}
                            >
                                <span className="filter-toggle-knob" />
                            </button>
                        </label>
                    </div>

                    {/* Category */}
                    <div className="filter-group">
                        <h4 className="filter-title">Category</h4>
                        <ul className="filter-list">
                            {[{ _id: 'All', name: 'All' }, ...dbCategories].map(cat => (
                                <li key={cat._id || cat.name}>
                                    <label className={category === cat.name ? 'filter-active-label' : ''}>
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={category === cat.name}
                                            onChange={() => handleSetCategory(cat.name)}
                                        />
                                        {cat.name}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Price Range */}
                    <div className="filter-group">
                        <h4 className="filter-title">Price Range (₹)</h4>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                className="form-input"
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                            />
                            <span>–</span>
                            <input
                                type="number"
                                placeholder="Max"
                                className="form-input"
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                            />
                        </div>
                        {/* Quick presets */}
                        <div className="price-presets">
                            <button className={`price-preset-btn ${maxPrice === '999' && minPrice === '' ? 'price-preset-active' : ''}`} onClick={() => { setMinPrice(''); setMaxPrice('999'); }}>Under ₹1k</button>
                            <button className={`price-preset-btn ${minPrice === '1000' && maxPrice === '5000' ? 'price-preset-active' : ''}`} onClick={() => { setMinPrice('1000'); setMaxPrice('5000'); }}>₹1k - ₹5k</button>
                            <button className={`price-preset-btn ${minPrice === '5000' && maxPrice === '' ? 'price-preset-active' : ''}`} onClick={() => { setMinPrice('5000'); setMaxPrice(''); }}>₹5k+</button>
                        </div>
                    </div>

                    {/* Shipping Time */}
                    <div className="filter-group">
                        <h4 className="filter-title">Shipping Time</h4>
                        <ul className="filter-list">
                            {[['3-5', '3–5 days (Express)'], ['3-7', '3–7 days (Fast)'], ['7-14', '7–14 days'], ['10-20', '10–20 days']].map(([val, label]) => (
                                <li key={val}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={shipping.includes(val)}
                                            onChange={() => toggleShipping(val)}
                                        />
                                        {label}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Min Rating */}
                    <div className="filter-group">
                        <h4 className="filter-title">Minimum Rating</h4>
                        <div className="rating-filter">
                            {[0, 3.5, 4.0, 4.5].map(r => (
                                <button
                                    key={r}
                                    className={`rating-btn ${minRating === r ? 'rating-btn-active' : ''}`}
                                    onClick={() => setMinRating(r)}
                                >
                                    {r === 0 ? 'Any' : `${r}+ ★`}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── Product Grid ── */}
                <div>
                    {isLoading ? (
                        <>
                            <p className="results-count">Loading products...</p>
                            <div className="dropship-grid">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="dropship-card skeleton-card" style={{ height: '360px', opacity: 0.7, animation: 'pulse 1.5s infinite' }}>
                                        <div style={{ width: '100%', height: '200px', backgroundColor: '#e2e8f0', borderRadius: '12px 12px 0 0' }}></div>
                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ width: '40%', height: '12px', backgroundColor: '#cbd5e1', borderRadius: '4px' }}></div>
                                            <div style={{ width: '80%', height: '16px', backgroundColor: '#cbd5e1', borderRadius: '4px' }}></div>
                                            <div style={{ width: '60%', height: '16px', backgroundColor: '#cbd5e1', borderRadius: '4px' }}></div>
                                            <div style={{ marginTop: 'auto', width: '100%', height: '36px', backgroundColor: '#e2e8f0', borderRadius: '6px' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : displayProducts.length === 0 ? (
                        <div className="no-results">
                            <span>😕</span>
                            <p>No products match your filters.</p>
                            <button className="btn-primary" onClick={resetFilters}>Clear Filters</button>
                        </div>
                    ) : (
                        <>
                            <p className="results-count">{displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''} found</p>
                            <div className="dropship-grid">
                                {displayProducts.map(product => {
                                    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                                    const isAdded = addedIds.includes(product.id);
                                    const isWishlisted = isInWishlist(product.id);
                                    return (
                                        <Link to={`/product/${product.id}`} className="dropship-card" key={product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="pc-image-wrap">
                                                <img src={product.image} alt={product.name} className="pc-image" />
                                                {product.sale && <span className="pc-badge pc-badge-sale">SALE</span>}
                                                <span className="pc-badge pc-badge-discount">−{discount}%</span>
                                                <button
                                                    className={`pc-wishlist-btn ${isWishlisted ? 'pc-wishlist-active' : ''}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleWishlist({ id: product.id, ...product });
                                                    }}
                                                    aria-label="Toggle Wishlist"
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="pc-body">
                                                <span className="pc-category">{product.category}</span>
                                                <h3 className="pc-name">{product.name}</h3>
                                                <p className="product-sku-text">SKU: {product.skuId}</p>
                                                <div className="pc-reviews">
                                                    <Stars rating={product.rating} />
                                                    <span className="pc-review-count">({product.reviews})</span>
                                                </div>
                                                <div className="pc-price-row">
                                                    <span className="pc-price">₹{product.price.toLocaleString('en-IN')}</span>
                                                    <span className="pc-original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                                                </div>
                                                {(() => {
                                                    const cartItem = cartItems.find(item => item.product.id === product.id);
                                                    if (cartItem) {
                                                        return (
                                                            <div className="cart-quantity-controls">
                                                                <button aria-label="Decrease quantity" onClick={(e) => { e.preventDefault(); updateQuantity(product.id, -1); }}>-</button>
                                                                <span>{cartItem.quantity}</span>
                                                                <button aria-label="Increase quantity" onClick={(e) => { e.preventDefault(); updateQuantity(product.id, 1); }}>+</button>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <button
                                                            className={`pc-cart-btn ${isAdded ? 'pc-cart-btn-added' : ''}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleAdd(product.id);
                                                                addToCart({
                                                                    id: product.id,
                                                                    name: product.name,
                                                                    price: product.price,
                                                                    image: product.image,
                                                                    sku: product.skuId
                                                                });
                                                            }}
                                                        >
                                                            {isAdded ? '✓ Added!' : '🛒 Add to Cart'}
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {hasNextPage && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        style={{ minWidth: '200px' }}
                                    >
                                        {isFetchingNextPage ? 'Loading...' : 'Load More Options'}
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
