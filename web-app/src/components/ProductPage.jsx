import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { productApi } from '../features/products/api/productApi.js';
import { CartContext } from '../CartContext.jsx';
import { WishlistContext } from '../WishlistContext.jsx';
import { ShieldCheck, Truck, Building2, Package, FileText, Heart, AlertCircle } from 'lucide-react'; 
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

    const [selectedImage, setSelectedImage] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const product = React.useMemo(() => {
        if (!p) return null;

        const basePrice = p.platformSellPrice;
        const moq = p.moq || Math.floor(Math.random() * 50) + 10;

        return {
            id: p._id,
            skuId: p.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            name: p.title,
            category: p.categoryId?.name || p.productType || 'Wholesale Goods',

            supplierName: p.vendor || 'Premium Industries Pvt Ltd',
            isVerifiedSupplier: true,
            supplierRating: 4.8,
            supplierYears: Math.floor(Math.random() * 10) + 2,

            basePrice: basePrice,
            moq: moq,
            gstPercent: p.gstPercent || 18,
            hsnCode: p.hsn || '85437099', 
            stock: p.inventory?.stock || Math.floor(Math.random() * 5000) + 500, 

            tiers: [
                { min: moq, max: moq * 4, price: basePrice },
                { min: (moq * 4) + 1, max: moq * 9, price: Math.floor(basePrice * 0.95) }, 
                { min: (moq * 9) + 1, max: '1000+', price: Math.floor(basePrice * 0.88) }  
            ],

            descriptionHTML: p.descriptionHTML || p.description || p.title, 
            images: p.images?.length > 0 ? p.images.map(img => img.url) : ['https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80'],
            rating: p.averageRating || 4.5,
            reviewCount: p.reviewCount || Math.floor(Math.random() * 50) + 5,
        }
    }, [p]);

    const [quantity, setQuantity] = useState(product?.moq || 1);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (product) {
            setQuantity(product.moq); 
        }
    }, [productId, product]);

    if (!product) return null;

    const currentPrice = React.useMemo(() => {
        let price = product.basePrice;
        for (const tier of product.tiers) {
            if (quantity >= tier.min) {
                price = tier.price;
            }
        }
        return price;
    }, [quantity, product]);

    const handleQuantityChange = (val) => {

        let newQty = Math.max(product.moq, val);

        newQty = Math.min(newQty, product.stock);
        setQuantity(newQty);
    };

    const fullStars = Math.floor(product.rating);
    const hasHalf = product.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary/30 flex flex-col">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

                {}
                <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 overflow-x-auto whitespace-nowrap">
                    <Link to="/" className="hover:text-primary transition-colors">Catalog</Link>
                    <span>›</span>
                    <span className="hover:text-primary transition-colors cursor-pointer">{product.category}</span>
                    <span>›</span>
                    <span className="text-slate-900 truncate max-w-[200px] inline-block">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">

                    {}
                    <div className="lg:col-span-5 flex flex-col-reverse md:flex-row gap-4 h-fit sticky top-28">
                        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar pb-2 md:pb-0 md:pr-2">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`w-20 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary shadow-md' : 'border-transparent hover:border-slate-300'}`}
                                    onClick={() => setSelectedImage(i)}
                                >
                                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 bg-white rounded-3xl p-4 shadow-sm border border-slate-200 aspect-square flex items-center justify-center overflow-hidden relative group">
                            <img
                                src={product.images[selectedImage] || product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                            />
                            <button 
                                className={`absolute top-4 right-4 p-3 rounded-full shadow-md transition-all duration-300 border ${isInWishlist(product.id) ? 'bg-danger text-white border-danger' : 'bg-white/90 backdrop-blur text-slate-400 border-slate-200 hover:text-danger hover:scale-110'}`}
                                onClick={(e) => { e.preventDefault(); toggleWishlist({ id: product.id, ...product }); }}
                            >
                                <Heart size={20} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="lg:col-span-7 flex flex-col">

                        {}
                        <div className="mb-6">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                                {product.name}
                            </h1>

                            {}
                            <div className="flex flex-wrap items-center gap-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl mb-4">
                                <div className="flex items-center gap-2">
                                    <Building2 size={18} className="text-blue-600" />
                                    <span className="text-sm font-bold text-slate-900">{product.supplierName}</span>
                                </div>
                                {product.isVerifiedSupplier && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-1 rounded-md">
                                        <ShieldCheck size={12} /> Verified Supplier
                                    </span>
                                )}
                                <span className="text-xs font-medium text-slate-500 border-l border-slate-300 pl-4">{product.supplierYears} Yrs on Platform</span>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                                <span className="text-slate-500 font-medium">SKU: <span className="font-bold text-slate-900">{product.skuId}</span></span>
                                <span className="text-slate-500 font-medium">HSN: <span className="font-bold text-slate-900">{product.hsnCode}</span></span>
                            </div>
                        </div>

                        {}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Package size={16}/> Wholesale Tiered Pricing
                            </h3>

                            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                                {product.tiers.map((tier, index) => (
                                    <div key={index} className={`p-3 rounded-xl border ${quantity >= tier.min && (tier.max === '1000+' || quantity <= tier.max) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-slate-50 border-transparent'}`}>
                                        <span className="block text-xl font-extrabold text-slate-900 mb-1">
                                            ₹{tier.price.toLocaleString('en-IN')}
                                        </span>
                                        <span className="block text-xs font-medium text-slate-500">
                                            {tier.min} - {tier.max} units
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between py-4 border-t border-slate-100">
                                <div>
                                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Excl. GST</span>
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tighter">
                                        ₹{(currentPrice * quantity).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="flex items-center justify-end gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        <FileText size={12}/> {product.gstPercent}% GST (ITC Claimable)
                                    </span>
                                    <span className="text-lg font-bold text-slate-500">
                                        + ₹{((currentPrice * quantity) * (product.gstPercent / 100)).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="flex flex-col sm:flex-row gap-6 items-end">

                                {}
                                <div className="flex-1 w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-bold text-slate-900">Procurement Quantity</label>
                                        <span className="text-xs font-medium text-slate-500">Stock: {product.stock.toLocaleString('en-IN')} units</span>
                                    </div>
                                    <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-sm h-14">
                                        <button 
                                            className="w-14 h-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-bold transition-colors disabled:opacity-50" 
                                            onClick={() => handleQuantityChange(quantity - product.moq)} 
                                            disabled={quantity <= product.moq}
                                        >−</button>
                                        <input 
                                            type="number" 
                                            className="flex-1 w-full h-full text-center font-extrabold text-lg text-slate-900 outline-none bg-transparent"
                                            value={quantity}
                                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || product.moq)}
                                            onBlur={() => {
                                                if(quantity < product.moq) setQuantity(product.moq);
                                            }}
                                        />
                                        <button 
                                            className="w-14 h-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-bold transition-colors disabled:opacity-50" 
                                            onClick={() => handleQuantityChange(quantity + product.moq)} 
                                            disabled={quantity >= product.stock}
                                        >+</button>
                                    </div>
                                    {quantity === product.moq && (
                                        <p className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-2">
                                            <AlertCircle size={12}/> Minimum Order Quantity (MOQ) is {product.moq}
                                        </p>
                                    )}
                                </div>

                                {}
                                <div className="flex-1 w-full">
                                    <button
                                        className="w-full h-14 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary-light hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        disabled={product.stock < product.moq}
                                        onClick={() => {
                                            if (product.stock < product.moq) return;
                                            let safeImage = product.images[0] || 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80';
                                            addToCart({
                                                _id: product.id, id: product.id, name: product.name, price: currentPrice, image: safeImage, sku: product.skuId, minQuantity: product.moq
                                            }, quantity);

                                            alert(`Added ${quantity} units to Procurement Cart`);
                                        }}
                                    >
                                        <Package size={20} /> Add to Bulk Order
                                    </button>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-0 divide-y divide-slate-100 mt-auto">
                            <div className="flex items-start gap-4 p-5">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Truck size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Pan-India Freight Freight</h4>
                                    <p className="text-sm text-slate-500 font-medium">Dispatches within 48 hours. LTL and FTL logistics available for heavy loads.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-5">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><FileText size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-900">GST Input Tax Credit</h4>
                                    <p className="text-sm text-slate-500 font-medium">100% compliant B2B invoicing provided to claim ITC. Ensure your GSTIN is updated in your profile.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 mb-20">
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Product Specifications</h2>
                    <div className="prose prose-slate max-w-none">
                         <BeautifulDescription rawHtml={product.descriptionHTML} />
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}

export default ProductPage;