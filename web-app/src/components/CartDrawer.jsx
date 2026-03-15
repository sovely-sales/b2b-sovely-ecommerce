import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../CartContext';
import { X, Trash2 } from 'lucide-react';
import './CartDrawer.css';

function CartDrawer({ isOpen, onClose }) {
    const { cartItems, updateQuantity, removeFromCart } = useContext(CartContext);
    const navigate = useNavigate();

    const totalAmount = cartItems.reduce((acc, item) => {
        const price = typeof item.product.price === 'string'
            ? parseFloat(item.product.price.replace(/[^0-9.-]+/g, ""))
            : item.product.price;
        return acc + (price * item.quantity);
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
        <div className="cart-drawer-overlay" onClick={onClose}>
            <div className={`cart-drawer ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="cart-drawer-header">
                    <h2>Your Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</h2>
                    <button className="cart-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-drawer-body">
                    {cartItems.length === 0 ? (
                        <div className="cart-drawer-empty">
                            <p>Your cart is empty.</p>
                            <button onClick={onClose} className="btn-continue">Continue Shopping</button>
                        </div>
                    ) : (
                        <div className="cart-items-list">
                            {cartItems.map((item) => {
                                let safeThumb = 'https://via.placeholder.com/64';
                                if (item.product?.image) {
                                    safeThumb = typeof item.product.image === 'string' ? item.product.image : (item.product.image.url || safeThumb);
                                } else if (item.product?.images?.[0]) {
                                    safeThumb = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
                                }

                                // Use fallback for key as well
                                const itemKey = item.product._id || item.product.id;

                                return (
                                    <div key={itemKey} className="cart-item">
                                        <img src={safeThumb} alt={item.product.name} className="cart-item-img" />
                                        <div className="cart-item-details">
                                            <h4 className="cart-item-title">{item.product.name}</h4>
                                            <div className="cart-item-price">
                                                {typeof item.product.price === 'number'
                                                    ? `₹${item.product.price.toLocaleString('en-IN')}`
                                                    : item.product.price}
                                            </div>
                                            <div className="cart-item-actions">
                                                <div className="cart-quantity-controls-small">
                                                    <button onClick={() => updateQuantity(itemKey, -1)}>−</button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(itemKey, 1)}>+</button>
                                                </div>
                                                <button className="btn-remove-item" onClick={() => removeFromCart(itemKey)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="cart-drawer-total">
                            <span>Subtotal</span>
                            <span className="total-price">₹{totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="cart-tax-note">Shipping and taxes calculated at checkout.</p>
                        <button className="btn-checkout" onClick={handleCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CartDrawer;