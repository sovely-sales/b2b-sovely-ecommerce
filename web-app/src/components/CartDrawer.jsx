import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../CartContext';
import { X, Trash2, Package, ArrowRight, ShieldCheck } from 'lucide-react';

function CartDrawer({ isOpen, onClose }) {
    const { cartItems, updateQuantity, removeFromCart } = useContext(CartContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const totalAmount = cartItems.reduce((acc, item) => {
        return acc + ((item.product?.price || item.price) * item.quantity);
    }, 0);

    const totalEstimatedWeight = cartItems.reduce((acc, item) => {
        return acc + ((item.product?.weight || 0.5) * item.quantity); 
    }, 0);

    const handleCheckout = () => {
        onClose();
        const checkoutItems = cartItems.map(item => ({
            productId: item.product?._id || item.product?.id || item.id, 
            qty: item.quantity,
            product: item.product || item 
        }));
        navigate('/checkout', { state: { items: checkoutItems } });
    };

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 z-[9999] flex justify-end">

            {}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {}
            <div 
                className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" 
                onClick={(e) => e.stopPropagation()}
            >
                {}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                            Procurement Cart
                            <span className="bg-primary text-white text-xs font-bold py-1 px-2.5 rounded-full shadow-sm">
                                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Units
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">Ready for Wholesale Checkout</p>
                    </div>
                    <button 
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" 
                        onClick={onClose}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 custom-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-2">
                                <Package size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900 mb-1">No items selected</h3>
                                <p className="text-slate-500 text-sm font-medium px-6">Your bulk order list is empty. Browse the catalog to start sourcing.</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="mt-6 px-8 py-3 bg-primary text-white font-bold rounded-full shadow-lg hover:shadow-primary/30 hover:bg-primary-light transition-all"
                            >
                                Browse Wholesale Catalog
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cartItems.map((item) => {

                                const product = item.product || item;
                                const itemKey = product._id || product.id;
                                const price = product.price || 0;
                                const moq = product.minQuantity || product.moq || 1; 

                                let safeThumb = 'https://via.placeholder.com/150';
                                if (product.image) {
                                    safeThumb = typeof product.image === 'string' ? product.image : (product.image.url || safeThumb);
                                } else if (product.images?.[0]) {
                                    safeThumb = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
                                }

                                return (
                                    <div key={itemKey} className="flex gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm relative group">

                                        {}
                                        <div className="w-24 h-28 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                                            <img src={safeThumb} alt={product.name} className="w-full h-full object-cover" />
                                        </div>

                                        {}
                                        <div className="flex flex-col flex-1 justify-between py-1 pr-1">

                                            <div className="flex justify-between items-start gap-2 pr-6">
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.category || 'Item'}</span>
                                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                                                        {product.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            {}
                                            <button 
                                                className="absolute top-3 right-3 text-slate-300 hover:text-danger p-1.5 hover:bg-danger/10 rounded-md transition-colors" 
                                                onClick={() => removeFromCart(itemKey)}
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="mt-auto">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-extrabold text-slate-900">
                                                        ₹{price.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-medium">/ unit</span>
                                                    </span>
                                                </div>

                                                {}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 h-8">
                                                        <button 
                                                            className="w-7 h-full flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-slate-900 hover:bg-slate-100 font-bold transition-colors disabled:opacity-50" 

                                                            onClick={() => updateQuantity(itemKey, -moq)}
                                                            disabled={item.quantity <= moq}
                                                        >
                                                            −
                                                        </button>
                                                        <span className="text-xs font-bold text-slate-900 w-10 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button 
                                                            className="w-7 h-full flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-slate-900 hover:bg-slate-100 font-bold transition-colors" 

                                                            onClick={() => updateQuantity(itemKey, moq)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {}
                                                    <span className="text-sm font-bold text-primary">
                                                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                {moq > 1 && (
                                                     <p className="text-[10px] text-slate-400 mt-1 font-medium">Orders in multiples of {moq}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-slate-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">

                        {}
                        <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 border border-green-100 rounded-lg text-green-700 text-xs font-bold">
                            <ShieldCheck size={14} /> GST Invoice generated at checkout
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center text-sm text-slate-500">
                                <span>Estimated Est. Weight</span>
                                <span className="font-semibold text-slate-700">{totalEstimatedWeight.toFixed(1)} kg</span>
                            </div>
                            <div className="flex justify-between items-end border-t border-slate-100 pt-2">
                                <span className="text-slate-700 font-bold text-sm">Total (Excl. GST)</span>
                                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                    ₹{totalAmount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        <button 
                            className="w-full h-14 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl font-bold tracking-wide hover:bg-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300" 
                            onClick={handleCheckout}
                        >
                            Proceed to Bulk Checkout <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CartDrawer;