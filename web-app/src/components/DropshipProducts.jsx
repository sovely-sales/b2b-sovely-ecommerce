import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// ── Product catalogue (20 products) ──────────────────────────────────────────
const ALL_PRODUCTS = [
    // Kitchen - under ₹1000
    { id: 101, skuId: 'SVL-DSP-101', name: 'Stainless Steel Spice Box Set', category: 'Kitchen', price: 549, originalPrice: 899, rating: 4.6, reviews: 312, sale: true, shipping: '3-5', image: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80' },
    { id: 102, skuId: 'SVL-DSP-102', name: 'Silicone Spatula Set (6 pcs)', category: 'Kitchen', price: 399, originalPrice: 699, rating: 4.4, reviews: 187, sale: true, shipping: '3-5', image: 'https://images.unsplash.com/photo-1556909172-8c2f041fca1e?w=500&q=80' },
    { id: 103, skuId: 'SVL-DSP-103', name: 'Bamboo Cutting Board', category: 'Kitchen', price: 799, originalPrice: 1299, rating: 4.9, reviews: 421, sale: false, shipping: '7-14', image: 'https://images.unsplash.com/photo-1596647466820-802c63bd8e50?w=500&q=80' },
    { id: 104, skuId: 'SVL-DSP-104', name: 'Portable Blender Cup', category: 'Kitchen', price: 1849, originalPrice: 2949, rating: 4.1, reviews: 67, sale: true, shipping: '10-20', image: 'https://images.unsplash.com/photo-1622241944227-ae279379cc80?w=500&q=80' },
    { id: 105, skuId: 'SVL-DSP-105', name: 'Cast Iron Mini Tadka Pan', category: 'Kitchen', price: 649, originalPrice: 999, rating: 4.7, reviews: 256, sale: true, shipping: '3-5', image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500&q=80' },
    { id: 106, skuId: 'SVL-DSP-106', name: 'Premium Chef Knife', category: 'Kitchen', price: 1299, originalPrice: 1999, rating: 4.8, reviews: 198, sale: false, shipping: '7-14', image: 'https://images.unsplash.com/photo-1566454419290-57a0589c9b17?w=500&q=80' },

    // Electronics
    { id: 107, skuId: 'SVL-DSP-107', name: 'Wireless Earbuds Pro', category: 'Electronics', price: 2999, originalPrice: 4999, rating: 4.4, reviews: 175, sale: true, shipping: '7-14', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80' },
    { id: 108, skuId: 'SVL-DSP-108', name: 'Smart Fitness Tracker', category: 'Electronics', price: 3749, originalPrice: 5499, rating: 4.2, reviews: 214, sale: true, shipping: '10-20', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b0?w=500&q=80' },
    { id: 109, skuId: 'SVL-DSP-109', name: 'LED Ring Light Set', category: 'Electronics', price: 3199, originalPrice: 4599, rating: 4.6, reviews: 142, sale: false, shipping: '3-7', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=500&q=80' },
    { id: 110, skuId: 'SVL-DSP-110', name: 'Bluetooth Desk Speaker', category: 'Electronics', price: 2499, originalPrice: 3599, rating: 4.5, reviews: 89, sale: true, shipping: '7-14', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80' },
    { id: 111, skuId: 'SVL-DSP-111', name: 'USB-C 65W Fast Charger', category: 'Electronics', price: 899, originalPrice: 1499, rating: 4.3, reviews: 504, sale: false, shipping: '3-5', image: 'https://images.unsplash.com/photo-1601999009162-2459b78386c9?w=500&q=80' },

    // Home Decor
    { id: 112, skuId: 'SVL-DSP-112', name: 'Minimalist Ceramic Vase', category: 'Home Decor', price: 2099, originalPrice: 3299, rating: 4.8, reviews: 128, sale: true, shipping: '7-14', image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80' },
    { id: 113, skuId: 'SVL-DSP-113', name: 'Macramé Wall Hanging', category: 'Home Decor', price: 1199, originalPrice: 1799, rating: 4.6, reviews: 93, sale: false, shipping: '7-14', image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&q=80' },
    { id: 114, skuId: 'SVL-DSP-114', name: 'Scented Soy Candle Set', category: 'Home Decor', price: 799, originalPrice: 1299, rating: 4.5, reviews: 267, sale: true, shipping: '3-5', image: 'https://images.unsplash.com/photo-1602607144291-9ba25e3a3c78?w=500&q=80' },

    // Fitness
    { id: 115, skuId: 'SVL-DSP-115', name: 'Yoga Mat with Alignment Lines', category: 'Fitness', price: 2449, originalPrice: 3699, rating: 4.7, reviews: 98, sale: false, shipping: '3-5', image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80' },
    { id: 116, skuId: 'SVL-DSP-116', name: 'Resistance Band Set (5 pcs)', category: 'Fitness', price: 599, originalPrice: 999, rating: 4.5, reviews: 342, sale: true, shipping: '3-5', image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500&q=80' },
    { id: 117, skuId: 'SVL-DSP-117', name: 'Adjustable Dumbbell Pair', category: 'Fitness', price: 5999, originalPrice: 8499, rating: 4.8, reviews: 61, sale: false, shipping: '7-14', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80' },

    // Furniture
    { id: 118, skuId: 'SVL-DSP-118', name: 'Ergonomic Desk Chair', category: 'Furniture', price: 12499, originalPrice: 16999, rating: 4.5, reviews: 86, sale: true, shipping: '3-7', image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80' },
    { id: 119, skuId: 'SVL-DSP-119', name: 'Floating Wall Shelf Set', category: 'Furniture', price: 1699, originalPrice: 2499, rating: 4.3, reviews: 134, sale: false, shipping: '7-14', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80' },

    // Beauty
    { id: 120, skuId: 'SVL-DSP-120', name: 'Rose Quartz Facial Roller', category: 'Beauty', price: 699, originalPrice: 1199, rating: 4.7, reviews: 387, sale: true, shipping: '3-5', image: 'https://images.unsplash.com/photo-1620756235880-07b3dd0804a0?w=500&q=80' },
];

const CATEGORIES = ['All', 'Kitchen', 'Electronics', 'Home Decor', 'Fitness', 'Furniture', 'Beauty'];
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

function DropshipProducts({ externalCategory, onCategoryChange }) {
    // ── Filter state ─────────────────────────────────────────────────────────
    const [category, setCategory] = useState(externalCategory || 'All');
    const [sort, setSort] = useState('default');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [shipping, setShipping] = useState([]);
    const [minRating, setMinRating] = useState(0);
    const [saleOnly, setSaleOnly] = useState(false);
    const [addedIds, setAddedIds] = useState([]);
    const [wishlistIds, setWishlistIds] = useState([]);

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


    // ── Derived filtered + sorted list ───────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...ALL_PRODUCTS];

        if (category !== 'All') list = list.filter(p => p.category === category);
        if (saleOnly) list = list.filter(p => p.sale);
        if (minPrice !== '') list = list.filter(p => p.price >= Number(minPrice));
        if (maxPrice !== '') list = list.filter(p => p.price <= Number(maxPrice));
        if (minRating > 0) list = list.filter(p => p.rating >= minRating);
        if (shipping.length > 0) list = list.filter(p => shipping.includes(p.shipping));

        switch (sort) {
            case 'price-asc': list.sort((a, b) => a.price - b.price); break;
            case 'price-desc': list.sort((a, b) => b.price - a.price); break;
            case 'rating': list.sort((a, b) => b.rating - a.rating); break;
            case 'reviews': list.sort((a, b) => b.reviews - a.reviews); break;
            default: break;
        }
        return list;
    }, [category, sort, minPrice, maxPrice, shipping, minRating, saleOnly]);

    const toggleShipping = (val) =>
        setShipping(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);

    const resetFilters = () => {
        handleSetCategory('All'); setSort('default'); setMinPrice(''); setMaxPrice('');
        setShipping([]); setMinRating(0); setSaleOnly(false);
    };

    const handleAdd = (id) => {
        setAddedIds(prev => [...prev, id]);
        setTimeout(() => setAddedIds(prev => prev.filter(x => x !== id)), 1800);
    };

    const toggleWishlist = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setWishlistIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <section className="dropship-section">
            <div className="section-container">
                <div className="section-header dropship-header">
                    <div>
                        <h2 className="section-title">Featured Products</h2>
                        <p className="section-subtitle">Curated products ready to add to your store</p>
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
                            {CATEGORIES.map(cat => (
                                <li key={cat}>
                                    <label className={category === cat ? 'filter-active-label' : ''}>
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={category === cat}
                                            onChange={() => handleSetCategory(cat)}
                                        />
                                        {cat}
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
                    {filtered.length === 0 ? (
                        <div className="no-results">
                            <span>😕</span>
                            <p>No products match your filters.</p>
                            <button className="btn-primary" onClick={resetFilters}>Clear Filters</button>
                        </div>
                    ) : (
                        <>
                            <p className="results-count">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
                            <div className="dropship-grid">
                                {filtered.map(product => {
                                    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                                    const isAdded = addedIds.includes(product.id);
                                    const isWishlisted = wishlistIds.includes(product.id);
                                    return (
                                        <Link to={`/product/${product.id}`} className="dropship-card" key={product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="pc-image-wrap">
                                                <img src={product.image} alt={product.name} className="pc-image" />
                                                {product.sale && <span className="pc-badge pc-badge-sale">SALE</span>}
                                                <span className="pc-badge pc-badge-discount">−{discount}%</span>
                                                <button
                                                    className={`pc-wishlist-btn ${isWishlisted ? 'pc-wishlist-active' : ''}`}
                                                    onClick={(e) => toggleWishlist(e, product.id)}
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
                                                <button
                                                    className={`pc-cart-btn ${isAdded ? 'pc-cart-btn-added' : ''}`}
                                                    onClick={(e) => { e.preventDefault(); handleAdd(product.id); }}
                                                >
                                                    {isAdded ? '✓ Added!' : '🛒 Add to Cart'}
                                                </button>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

export default DropshipProducts;
