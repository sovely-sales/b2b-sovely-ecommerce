import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../CartContext';
import { X, Trash2, ShoppingBag } from 'lucide-react';

function CartDrawer({ isOpen, onClose }) {
    const { cartItems, updateQuantity, removeFromCart } = useContext(CartContext);
    const navigate = useNavigate();

    const totalAmount = cartItems.reduce((acc, item) => {
        return acc + (item.product.price * item.quantity);
    }, 0);

    const handleCheckout = () => {
        onClose();
        const checkoutItems = cartItems.map(item => ({
            // CRITICAL FIX: Use _id for MongoDB compatibility, fallback to id if needed
            productId: item.product._id || item.product.id, 
            qty: item.quantity,
            product: item.product
        }));
        navigate('/checkout', { state: { items: checkoutItems } });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]" 
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div 
                className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md">
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        Your Cart 
                        <span className="bg-slate-900 text-white text-xs py-0.5 px-2 rounded-full">
                            {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                        </span>
                    </h2>
                    <button 
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" 
                        onClick={onClose}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                <ShoppingBag size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Your cart is empty</h3>
                                <p className="text-slate-500 text-sm font-medium">Looks like you haven't added anything yet.</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="mt-4 px-6 py-3 bg-white border border-slate-200 text-slate-900 font-bold rounded-full shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cartItems.map((item) => {
                                let safeThumb = 'https://via.placeholder.com/64';
                                if (item.product?.image) {
                                    safeThumb = typeof item.product.image === 'string' ? item.product.image : (item.product.image.url || safeThumb);
                                } else if (item.product?.images?.[0]) {
                                    safeThumb = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
                                }

                                const itemKey = item.product._id || item.product.id;

                                return (
                                    <div key={itemKey} className="flex gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                            <img src={safeThumb} alt={item.product.name} className="w-full h-full object-cover" />
                                        </div>
                                        
                                        <div className="flex flex-col flex-1 justify-between py-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                                                    {item.product.name}
                                                </h4>
                                                <button 
                                                    className="text-slate-300 hover:text-danger p-1 transition-colors" 
                                                    onClick={() => removeFromCart(itemKey)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-auto pt-2">
                                                <div className="text-sm font-extrabold text-slate-900">
                                                    ₹{item.product.price.toLocaleString('en-IN')}
                                                </div>
                                                
                                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-1">
                                                    <button 
                                                        className="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-slate-900 font-bold transition-colors" 
                                                        onClick={() => updateQuantity(itemKey, -1)}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="text-xs font-bold text-slate-900 w-4 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button 
                                                        className="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-slate-900 font-bold transition-colors" 
                                                        onClick={() => updateQuantity(itemKey, 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-500 font-semibold text-sm">Subtotal</span>
                            <span className="text-xl font-extrabold text-slate-900">
                                ₹{totalAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-4">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <button 
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300" 
                            onClick={handleCheckout}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CartDrawer;
