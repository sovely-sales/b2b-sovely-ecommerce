import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { productApi } from '../features/products/api/productApi.js';
import { CartContext } from '../CartContext.jsx';
import { WishlistContext } from '../WishlistContext.jsx';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BeautifulDescription from './BeautifulDescription';
import Footer from './Footer';
import './ProductPage.css';
import './LandingPage.css';

function ProductPage() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartItems } = useContext(CartContext);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);

    const { data: p } = useSuspenseQuery({
        queryKey: ['product', productId],
        queryFn: () => productApi.getProductById(productId)
    });

    const [selectedColor, setSelectedColor] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Map backend data to component needs
    const product = React.useMemo(() => {
        if (!p) return null;
        return {
            id: p._id,
            skuId: p.sku,
            name: p.title,
            category: p.categoryId?.name || p.productType || 'Shopping',
            subcategory: p.vendor || 'General',
            price: `₹${p.platformSellPrice.toLocaleString('en-IN')}`,
            oldPrice: p.compareAtPrice ? `₹${p.compareAtPrice.toLocaleString('en-IN')}` : null,
            monthlyPrice: `₹${Math.round(p.platformSellPrice / 6).toLocaleString('en-IN')}/mo`,
            
            // FIX: Pass the raw HTML straight through!
            descriptionHTML: p.descriptionHTML || p.description || p.title, 
            
            images: p.images?.length > 0 ? p.images.map(img => img.url) : ['https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80'],
            rating: 4.5,
            reviewCount: Math.floor(Math.random() * 200) + 10,
            stock: p.inventory?.stock || 50,
            colors: ['#000000', '#silver', '#ffffff'],
            returnPolicy: 'Free 30-Day returns'
        }
    }, [p]);

    const similarProducts = []; // Omitted for now unless another query is added

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [productId]);

    if (!product) return null;

    const handleQuantityChange = (delta) => {
        setQuantity((prev) => Math.max(1, Math.min(prev + delta, product.stock)));
    };

    // Generate star rating
    const fullStars = Math.floor(product.rating);
    const hasHalf = product.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
        <div className="landing-page">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <main className="product-page-main">
                {/* Breadcrumb */}
                <nav className="pp-breadcrumb">
                    <Link to="/" className="pp-breadcrumb-link">Home</Link>
                    <span className="pp-breadcrumb-sep">›</span>
                    <span className="pp-breadcrumb-link">{product.category}</span>
                    <span className="pp-breadcrumb-sep">›</span>
                    <span className="pp-breadcrumb-link">{product.subcategory}</span>
                    <span className="pp-breadcrumb-sep">›</span>
                    <span className="pp-breadcrumb-current">{product.name}</span>
                </nav>

                {/* Product Detail Grid */}
                <div className="pp-detail-grid">
                    {/* Image Gallery */}
                    <div className="pp-gallery">
                        <div className="pp-main-image-wrapper">
                            <img
                                src={product.images[selectedImage] || product.images[0]}
                                alt={product.name}
                                className="pp-main-image"
                            />
                        </div>
                        <div className="pp-thumbnail-row">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`pp-thumbnail ${selectedImage === i ? 'pp-thumbnail-active' : ''}`}
                                    onClick={() => setSelectedImage(i)}
                                >
                                    <img src={img} alt={`${product.name} view ${i + 1}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="pp-info">
                        <div className="pp-info-header">
                            {/*<h1 className="pp-title">{product.name}</h1>
                            <p className="pp-description">{product.description}</p>
                            <p className="pp-sku">SKU: {product.skuId}</p>*/}

                            {/* Rating */}
                            <div className="pp-rating">
                                <div className="pp-stars">
                                    {Array(fullStars).fill(null).map((_, i) => (
                                        <span key={`full-${i}`} className="pp-star pp-star-filled">★</span>
                                    ))}
                                    {hasHalf && <span className="pp-star pp-star-filled">★</span>}
                                    {Array(emptyStars).fill(null).map((_, i) => (
                                        <span key={`empty-${i}`} className="pp-star pp-star-empty">★</span>
                                    ))}
                                </div>
                                <span className="pp-review-count">({product.reviewCount})</span>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="pp-pricing-section">
                            <div className="pp-price-row">
                                <span className="pp-current-price">{product.price}</span>
                                {product.oldPrice && (
                                    <span className="pp-old-price">{product.oldPrice}</span>
                                )}
                                <span className="pp-monthly">or {product.monthlyPrice}</span>
                            </div>
                            <p className="pp-financing-note">Suggested payments with 6 months special financing.</p>
                        </div>

                        {/* Color Picker */}
                        <div className="pp-color-section">
                            <h3 className="pp-section-label">Choose a Color</h3>
                            <div className="pp-color-options">
                                {product.colors.map((color, i) => (
                                    <button
                                        key={i}
                                        className={`pp-color-swatch ${selectedColor === i ? 'pp-color-active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(i)}
                                        aria-label={`Color option ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Quantity + Stock */}
                        <div className="pp-quantity-section">
                            <div className="pp-quantity-selector">
                                <button
                                    className="pp-qty-btn"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1}
                                >
                                    −
                                </button>
                                <span className="pp-qty-value">{quantity}</span>
                                <button
                                    className="pp-qty-btn"
                                    onClick={() => handleQuantityChange(1)}
                                    disabled={quantity >= product.stock}
                                >
                                    +
                                </button>
                            </div>
                            <div className="pp-stock-info">
                                <span className={`pp-stock-warning ${product.stock <= 12 ? 'low' : ''}`}>
                                    {product.stock <= 12 ? `Only ${product.stock} Items Left!` : 'In Stock'}
                                </span>
                                <p className="pp-stock-note">
                                    {product.stock <= 12 ? "Don't miss it" : 'Ready to ship'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pp-actions">
                            <button
                                className="pp-btn-buy"
                                onClick={() => navigate('/checkout', {
                                    state: { items: [{ productId: product.id, qty: quantity, product }] }
                                })}
                            >
                                Buy Now
                            </button>
                            <button
                                className="pp-btn-cart"
                                onClick={(e) => {
                                    e.preventDefault();

                                    let safeImage = 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80';
                                    if (product.images && product.images.length > 0) {
                                        safeImage = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
                                    } else if (product.image) {
                                        safeImage = typeof product.image === 'string' ? product.image : product.image.url;
                                    }

                                    addToCart({
                                        _id: product.id,
                                        id: product.id,
                                        name: product.name,
                                        price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[^0-9.-]+/g, "")) : product.price,
                                        image: safeImage,
                                        sku: product.skuId
                                    }, quantity);
                                    alert(`Added ${quantity === 1 ? '1 item' : quantity + ' items'} to cart!`);
                                }}
                            >
                                Add to Cart
                            </button>
                        </div>

                        {/* Delivery Info */}
                        <div className="pp-delivery-cards">
                            <div className="pp-delivery-card">
                                <span className="pp-delivery-icon pp-icon-shipping">📦</span>
                                <div>
                                    <h4 className="pp-delivery-title">Free Delivery</h4>
                                    <p className="pp-delivery-text">
                                        Enter your Postal code for Delivery Availability
                                    </p>
                                </div>
                            </div>
                            <div className="pp-delivery-card">
                                <span className="pp-delivery-icon pp-icon-return">🔄</span>
                                <div>
                                    <h4 className="pp-delivery-title">Return Delivery</h4>
                                    <p className="pp-delivery-text">
                                        {product.returnPolicy}. <span className="pp-link-text">Details</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <section style={{ marginTop: '40px', marginBottom: '40px' }}>
                     <BeautifulDescription rawHtml={product.descriptionHTML} />
                </section>

                {/* Similar Items Section */}
                <section className="pp-similar-section">
                    <div className="pp-similar-header">
                        <div>
                            <h2 className="pp-similar-title">Similar Items You Might Like</h2>
                            <p className="pp-similar-subtitle">Products from the same category</p>
                        </div>
                        <Link to="/" className="pp-view-all">
                            View All <span className="pp-arrow">→</span>
                        </Link>
                    </div>

                    <div className="pp-similar-grid">
                        {similarProducts.map((item) => (
                            <Link
                                to={`/product/${item.id}`}
                                className="pp-similar-card"
                                key={item.id}
                            >
                                <div className="pp-similar-image-wrapper">
                                    <img src={item.image} alt={item.name} className="pp-similar-image" />
                                    <button
                                        className={`pp-wishlist-btn ${isInWishlist(item.id) ? 'pc-wishlist-active' : ''}`}
                                        style={{ color: isInWishlist(item.id) ? '#ef4444' : 'inherit' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleWishlist({ id: item.id, ...item });
                                        }}
                                    >
                                        ♥
                                    </button>
                                </div>
                                <div className="pp-similar-info">
                                    <div className="pp-similar-top-row">
                                        <h3 className="pp-similar-name">{item.name}</h3>
                                        <span className="pp-similar-price">{item.price}</span>
                                    </div>
                                    <p className="pp-similar-desc">{item.subcategory}</p>
                                    <p className="pp-similar-sku">SKU: {item.skuId}</p>
                                    <div className="pp-similar-rating">
                                        {Array(Math.floor(item.rating)).fill(null).map((_, i) => (
                                            <span key={i} className="pp-star pp-star-filled pp-star-sm">★</span>
                                        ))}
                                        {Array(5 - Math.floor(item.rating)).fill(null).map((_, i) => (
                                            <span key={i} className="pp-star pp-star-empty pp-star-sm">★</span>
                                        ))}
                                        <span className="pp-similar-rating-text">({item.rating})</span>
                                    </div>
                                    <button
                                        className="pp-similar-cart-btn"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default ProductPage;
