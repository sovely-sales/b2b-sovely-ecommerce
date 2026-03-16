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
        
        // FIX: Keep these as raw numbers!
        price: p.platformSellPrice,
        oldPrice: p.compareAtPrice || null,
        monthlyPrice: Math.round(p.platformSellPrice / 6),
        
        descriptionHTML: p.descriptionHTML || p.description || p.title, 
        images: p.images?.length > 0 ? p.images.map(img => img.url) : ['https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80'],
        rating: 4.5,
        reviewCount: Math.floor(Math.random() * 200) + 10,
        stock: p.inventory?.stock || 0,
        colors: ['#0f172a', '#94a3b8', '#f8fafc'], // Adjusted to valid hex colors for tailwind compatibility
        returnPolicy: 'Free 30-Day returns'
    }
}, [p]);

    const similarProducts = []; // Omitted for now unless another query is added

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [productId]);

    if (!product) return null;

    const handleQuantityChange = (delta) => {
        if (product.stock <= 0) return;
        setQuantity((prev) => Math.max(1, Math.min(prev + delta, product.stock)));
    };

    const fullStars = Math.floor(product.rating);
    const hasHalf = product.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-accent/30 flex flex-col">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 overflow-x-auto whitespace-nowrap">
                    <Link to="/" className="hover:text-accent transition-colors">Home</Link>
                    <span>›</span>
                    <span className="hover:text-accent transition-colors cursor-pointer">{product.category}</span>
                    <span>›</span>
                    <span className="hover:text-accent transition-colors cursor-pointer">{product.subcategory}</span>
                    <span>›</span>
                    <span className="text-slate-900">{product.name}</span>
                </nav>

                {/* Product Detail Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">
                    
                    {/* Image Gallery */}
                    <div className="flex flex-col-reverse md:flex-row gap-4 h-fit sticky top-28">
                        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar pb-2 md:pb-0 md:pr-2">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`w-20 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-accent shadow-md' : 'border-transparent hover:border-slate-300'}`}
                                    onClick={() => setSelectedImage(i)}
                                >
                                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 aspect-[4/5] flex items-center justify-center overflow-hidden relative group">
                            <img
                                src={product.images[selectedImage] || product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                            />
                            <button 
                                className={`absolute top-6 right-6 p-3 rounded-full shadow-md transition-all duration-300 border ${isInWishlist(product.id) ? 'bg-danger text-white border-danger' : 'bg-white/80 backdrop-blur text-slate-400 border-white hover:bg-white hover:text-danger hover:scale-110'}`}
                                onClick={(e) => { e.preventDefault(); toggleWishlist({ id: product.id, ...product }); }}
                            >
                                <svg width="20" height="20" fill={isInWishlist(product.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            </button>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-accent/10 text-accent font-extrabold text-[10px] uppercase tracking-widest rounded-full mb-4">
                                {product.subcategory}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                                {product.name}
                            </h1>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-center text-yellow-400">
                                    {Array(fullStars).fill(null).map((_, i) => <span key={`full-${i}`}>★</span>)}
                                    {hasHalf && <span>★</span>}
                                    {Array(emptyStars).fill(null).map((_, i) => <span key={`empty-${i}`} className="text-slate-200">★</span>)}
                                </div>
                                <span className="text-sm font-bold text-slate-900">{product.rating} Rating</span>
                                <span className="text-sm font-medium text-slate-400 underline decoration-slate-200 underline-offset-4 cursor-pointer hover:text-slate-900">Read {product.reviewCount} Reviews</span>
                            </div>
                        </div>

                        <div className="py-6 border-y border-slate-200 my-6">
                            <div className="flex items-end gap-4 mb-2">
                                <span className="text-4xl font-extrabold text-slate-900 tracking-tighter">₹{product.price.toLocaleString('en-IN')}</span>
                                {product.oldPrice && (
                                    <span className="text-lg font-semibold text-slate-400 line-through mb-1">₹{product.oldPrice.toLocaleString('en-IN')}</span>
                                )}
                            </div>
                            <p className="text-sm font-medium text-slate-500">
                                Or pay <span className="font-bold text-slate-900">₹{product.monthlyPrice.toLocaleString('en-IN')}/mo</span> for 6 months with special financing.
                            </p>
                        </div>

                        {/* Color Picker */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Color</h3>
                            <div className="flex items-center gap-3">
                                {product.colors.map((color, i) => (
                                    <button
                                        key={i}
                                        className={`w-10 h-10 rounded-full border border-slate-200 shadow-sm transition-all ${selectedColor === i ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(i)}
                                        aria-label={`Color option ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Quantity + Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-full p-1 w-32 shadow-sm">
                                    <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 font-bold transition-colors disabled:opacity-50" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>−</button>
                                    <span className="font-extrabold text-slate-900">{quantity}</span>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 font-bold transition-colors disabled:opacity-50" onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>+</button>
                                </div>
                                <span className={`text-xs font-bold mt-2 text-center ${product.stock <= 12 ? 'text-danger' : 'text-green-600'}`}>
                                    {product.stock <= 12 ? `Only ${product.stock} left!` : 'In Stock'}
                                </span>
                            </div>

                            <div className="flex-1 flex flex-col gap-3">
                                <button
                                    className="w-full py-4 bg-slate-900 text-white rounded-full font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed"
                                    disabled={product.stock <= 0}
                                    onClick={() => navigate('/checkout', { state: { items: [{ productId: product.id, qty: quantity, product }] } })}
                                >
                                    {product.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
                                </button>
                                <button
                                    className="w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold tracking-wide hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={product.stock <= 0}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (product.stock <= 0) return;
                                        let safeImage = 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80';
                                        if (product.images && product.images.length > 0) {
                                            safeImage = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
                                        }
                                        addToCart({
                                            _id: product.id, id: product.id, name: product.name, price: product.price, image: safeImage, sku: product.skuId
                                        }, quantity);
                                        alert(`Added ${quantity === 1 ? '1 item' : quantity + ' items'} to cart!`);
                                    }}
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 mt-auto">
                            <div className="flex gap-4">
                                <div className="text-2xl pt-1 text-slate-400">🚚</div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Free Delivery</h4>
                                    <p className="text-sm text-slate-500 font-medium underline decoration-slate-200 underline-offset-4 cursor-pointer hover:text-slate-900">Enter your Postal code for availability</p>
                                </div>
                            </div>
                            <div className="w-full h-px bg-slate-100"></div>
                            <div className="flex gap-4">
                                <div className="text-2xl pt-1 text-slate-400">🔄</div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Return Delivery</h4>
                                    <p className="text-sm text-slate-500 font-medium">{product.returnPolicy}. <span className="text-slate-900 font-bold underline cursor-pointer">Details</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description HTML */}
                <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 mb-20 prose prose-slate max-w-none">
                     <BeautifulDescription rawHtml={product.descriptionHTML} />
                </section>

                {/* Similar Items Section */}
                {similarProducts.length > 0 && (
                    <section className="mb-20">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Similar Items You Might Like</h2>
                                <p className="text-slate-500 font-medium">Products from the same category</p>
                            </div>
                            <Link to="/" className="hidden md:flex items-center gap-2 font-bold text-accent hover:text-slate-900 transition-colors">
                                View All <span>→</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Similar products would map here, adopting the same style as DropshipProducts cards */}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default ProductPage;
