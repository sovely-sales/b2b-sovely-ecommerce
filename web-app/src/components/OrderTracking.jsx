import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import api from '../utils/api.js';
import Navbar from './Navbar';
import Footer from './Footer';

const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/orders/${id}`);
                setOrder(res.data.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-accent rounded-full animate-spin"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <FileText size={48} className="text-slate-300 mb-4" />
                    <h2 className="text-2xl font-extrabold text-slate-900">Order Not Found</h2>
                </div>
                <Footer />
            </div>
        );
    }

    const steps = [
        { id: 'PENDING', label: 'Order Placed', icon: Package, description: 'We have received your order.' },
        { id: 'PROCESSING', label: 'Processing', icon: Clock, description: 'Your order is being packed.' },
        { id: 'SHIPPED', label: 'Shipped', icon: Truck, description: 'Your order is on the way!' },
        { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, description: 'Package has been delivered.' }
    ];

    const isCancelled = order.status === 'CANCELLED';
    const currentStepIndex = isCancelled ? -1 : steps.findIndex(s => s.id === order.status);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-accent/30">
            <Navbar />
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                
                <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Orders
                </Link>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Track Order</h2>
                        <p className="text-slate-500 font-medium">Order ID: <strong className="text-slate-900 font-mono tracking-wider">{order.orderId}</strong></p>
                    </div>
                    {order.tracking?.trackingNumber && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-right w-full sm:w-auto">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Courier: {order.tracking.courierName}
                            </span>
                            {order.tracking.trackingUrl ? (
                                <a 
                                    href={order.tracking.trackingUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 font-bold text-accent hover:text-accent-glow transition-colors"
                                >
                                    AWB: {order.tracking.trackingNumber} <span className="text-lg">↗</span>
                                </a>
                            ) : (
                                <span className="font-bold text-slate-900">AWB: {order.tracking.trackingNumber}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 mb-8">
                    {isCancelled ? (
                        <div className="text-center text-danger py-8">
                            <XCircle size={64} className="mx-auto mb-4 opacity-80" />
                            <h3 className="text-2xl font-extrabold mb-2">Order Cancelled</h3>
                            <p className="font-medium opacity-80">This order has been cancelled and will not be shipped.</p>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {steps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const isLast = index === steps.length - 1;

                                return (
                                    <div key={step.id} className="relative flex gap-6">
                                        {!isLast && (
                                            <div className={`absolute top-12 left-[1.35rem] w-0.5 h-[calc(100%-1rem)] z-0 transition-colors duration-500 ${index < currentStepIndex ? 'bg-accent' : 'bg-slate-100'}`}></div>
                                        )}
                                        
                                        <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center z-10 flex-shrink-0 transition-all duration-500 ${
                                            isCurrent ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30 scale-110' 
                                            : isCompleted ? 'bg-accent border-accent text-white' 
                                            : 'bg-white border-slate-200 text-slate-300'
                                        }`}>
                                            <step.icon size={20} strokeWidth={isCurrent || isCompleted ? 3 : 2} />
                                        </div>
                                        
                                        <div className="pb-12 pt-2">
                                            <h4 className={`text-lg font-bold mb-1 transition-colors ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                                {step.label}
                                            </h4>
                                            <p className="text-sm font-medium text-slate-500 mb-2">{step.description}</p>
                                            
                                            {isCompleted && order.statusHistory?.find(h => h.status === step.id) && (
                                                <span className="inline-block px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-400">
                                                    {new Date(order.statusHistory.find(h => h.status === step.id).date).toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-6 pb-6 border-b border-slate-100">Order Details</h3>
                    <div className="space-y-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-medium">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center">{item.qty}x</span>
                                    <span className="text-slate-700 truncate max-w-[200px] sm:max-w-sm">
                                        {item.sku.length > 40 ? `${item.sku.substring(0, 40)}...` : item.sku}
                                    </span>
                                </div>
                                <div className="font-extrabold text-slate-900">
                                    ₹{(item.price * item.qty).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-8 pt-8 border-t border-dashed border-slate-200">
                        <span className="text-lg font-extrabold text-slate-900">Total Paid</span>
                        <span className="text-2xl font-black text-accent tracking-tight">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default OrderTracking;