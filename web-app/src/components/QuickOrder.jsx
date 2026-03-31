import React, { useState, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UploadCloud,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    XCircle,
    Loader2,
    ArrowLeft,
    MapPin,
    Package
} from 'lucide-react';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const QuickOrder = () => {
    const navigate = useNavigate();
    const { user, isKycApproved, refreshUser } = useContext(AuthContext);
    const isB2BPending = user?.accountType === 'B2B' && !isKycApproved;

    const [parsedOrders, setParsedOrders] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [totalEstimatedCost, setTotalEstimatedCost] = useState(0);

    const fileInputRef = useRef(null);

    // --- 1. CSV Parser designed for the Client's exact Export Format ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            await processCSV(text);
        };
        reader.readAsText(file);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processCSV = async (csvText) => {
        setIsValidating(true);
        setSuccessMessage('');
        
        // Simple CSV splitting handling basic commas (Note: If addresses contain commas inside quotes, you'd want to use PapaParse here)
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            toast.error('CSV is empty or missing data.');
            setIsValidating(false);
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        
        const idxSku = headers.findIndex(h => h === 'sku');
        const idxQty = headers.findIndex(h => h === 'quantity');
        const idxName = headers.findIndex(h => h === 'customer name');
        const idxPhone = headers.findIndex(h => h === 'phone');
        const idxAdd1 = headers.findIndex(h => h === 'shipping address1');
        const idxAdd2 = headers.findIndex(h => h === 'shipping address2');
        const idxCity = headers.findIndex(h => h === 'city');
        const idxState = headers.findIndex(h => h === 'state');
        const idxPin = headers.findIndex(h => h === 'pincode');
        const idxSellingPrice = headers.findIndex(h => h === 'sellling price' || h === 'selling price'); 
        const idxPayment = headers.findIndex(h => h === 'payment status');

        if (idxSku === -1 || idxQty === -1 || idxName === -1) {
            toast.error('Invalid CSV format. Missing required columns (SKU, Quantity, Customer Name).');
            setIsValidating(false);
            return;
        }

        const rawOrders = [];
        const skusToFetch = new Set();

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < headers.length) continue;

            const sku = cols[idxSku]?.replace(/["'\r\n]/g, '').trim();
            const qty = parseInt(cols[idxQty]?.trim(), 10);
            
            if (sku && qty > 0) {
                skusToFetch.add(sku);
                
                // Combine addresses
                const street = `${cols[idxAdd1] || ''} ${cols[idxAdd2] || ''}`.trim();
                const paymentStatus = cols[idxPayment]?.trim().toLowerCase();

                rawOrders.push({
                    id: `row-${i}`,
                    sku,
                    qty,
                    customerName: cols[idxName]?.trim(),
                    phone: cols[idxPhone]?.trim() || '0000000000', // Fallback for their missing phones
                    street: street || 'Address Not Provided',
                    city: cols[idxCity]?.trim(),
                    state: cols[idxState]?.trim(),
                    zip: cols[idxPin]?.trim(),
                    resellerSellingPrice: parseFloat(cols[idxSellingPrice]) || 0,
                    paymentMethod: paymentStatus === 'cod' ? 'COD' : 'PREPAID_WALLET',
                    status: 'pending'
                });
            }
        }

        try {
            // Fetch product data from backend to validate inventory and get pricing
            const res = await api.post('/products/validate-bulk', { skus: Array.from(skusToFetch) });
            const dbProducts = res.data.data;
            let estimatedTotal = 0;

            const validatedOrders = rawOrders.map(order => {
                const dbProduct = dbProducts.find(p => p.sku === order.sku);

                if (!dbProduct) return { ...order, status: 'error', message: 'SKU not found' };
                if (dbProduct.inventory?.stock < order.qty) return { ...order, status: 'error', message: `Only ${dbProduct.inventory.stock} in stock` };
                
                // Rough estimate for display (Platform Price + GST). Accurate shipping will be calculated on backend.
                const itemCost = (dbProduct.dropshipBasePrice * order.qty);
                const tax = itemCost * (dbProduct.gstSlab / 100);
                estimatedTotal += (itemCost + tax);

                return { 
                    ...order, 
                    productId: dbProduct._id, 
                    platformUnitCost: dbProduct.dropshipBasePrice,
                    title: dbProduct.title,
                    status: 'valid' 
                };
            });

            setParsedOrders(validatedOrders);
            setTotalEstimatedCost(estimatedTotal);
        } catch (error) {
            toast.error('Validation failed against server data.');
        } finally {
            setIsValidating(false);
        }
    };

    // --- 2. Process Direct Orders (Bypassing Cart) ---
    const handleDirectProcurement = async () => {
        const validOrders = parsedOrders.filter(o => o.status === 'valid');
        if (validOrders.length === 0) return toast.error('No valid orders to process.');

        setIsProcessing(true);
        
        try {
            // We are sending this to a NEW backend endpoint you need to create
            const payload = {
                orders: validOrders.map(o => ({
                    productId: o.productId,
                    qty: o.qty,
                    resellerSellingPrice: o.resellerSellingPrice,
                    paymentMethod: o.paymentMethod,
                    endCustomerDetails: {
                        name: o.customerName,
                        phone: o.phone,
                        address: {
                            street: o.street,
                            city: o.city,
                            state: o.state,
                            zip: o.zip
                        }
                    }
                }))
            };

            // Needs to be handled by a new bulk controller on backend
            const res = await api.post('/orders/bulk-dropship', payload);
            
            await refreshUser();
            setSuccessMessage(`Successfully dispatched ${res.data.data.length} dropship orders!`);
            setParsedOrders([]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transaction failed. Check wallet balance.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isB2BPending) return null; // Keep your existing KYC block here

    const validCount = parsedOrders.filter(i => i.status === 'valid').length;
    const errorCount = parsedOrders.filter(i => i.status === 'error').length;

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <button onClick={() => navigate(-1)} className="mb-6 flex w-fit items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <ArrowLeft size={16} /> Back
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Bulk Dropship Importer</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">Upload your client store exports to dispatch hundreds of orders instantly.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-4">
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-16 text-center hover:border-indigo-400">
                        <FileSpreadsheet size={48} className="mb-4 text-indigo-400" />
                        <h3 className="text-lg font-extrabold text-indigo-900">Upload Store CSV</h3>
                        <p className="mt-1 mb-6 text-xs text-indigo-700/80">Matches Shopify/WooCommerce Dropship Export format.</p>
                        
                        <button onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700">
                            {isValidating ? <Loader2 size={18} className="animate-spin" /> : 'Select CSV File'}
                        </button>
                        <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </div>

                    {validCount > 0 && (
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h4 className="font-bold text-slate-900">Wallet Check</h4>
                            <p className="mt-1 text-xs text-slate-500">Estimated cost before precise freight calculation.</p>
                            <div className="mt-4 flex justify-between items-center font-black text-xl text-slate-900">
                                <span>~ ₹{totalEstimatedCost.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                                <span className={`text-xs px-2 py-1 rounded ${user?.walletBalance >= totalEstimatedCost ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    Bal: ₹{user?.walletBalance.toLocaleString('en-IN', {maximumFractionDigits: 0})}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-8 flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 rounded-t-3xl flex justify-between items-center">
                        <h3 className="font-extrabold text-slate-900">Validation Output</h3>
                        <div className="flex gap-2">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Valid: {validCount}</span>
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Errors: {errorCount}</span>
                        </div>
                    </div>

                    <div className="flex-1 p-0 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {successMessage ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[400px] flex-col items-center justify-center p-12 text-center">
                                    <CheckCircle2 size={56} className="mb-4 text-emerald-500" />
                                    <p className="text-lg font-bold text-slate-900 mb-4">{successMessage}</p>
                                    <button onClick={() => navigate('/orders')} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800">
                                        View Live Orders
                                    </button>
                                </motion.div>
                            ) : parsedOrders.length > 0 ? (
                                <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 bg-white text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                                            <tr>
                                                <th className="p-4">Customer & Addr</th>
                                                <th className="p-4">Product Info</th>
                                                <th className="p-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parsedOrders.map((ord) => (
                                                <tr key={ord.id} className={ord.status === 'error' ? 'bg-red-50/30' : ''}>
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-900">{ord.customerName}</p>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{ord.city}, {ord.state}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-700">{ord.sku} <span className="font-medium text-slate-400">x{ord.qty}</span></p>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{ord.title || 'Unknown'}</p>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {ord.status === 'error' ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                                                <XCircle size={12}/> {ord.message}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                                                                <CheckCircle2 size={12}/> Ready
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-slate-400">
                                    <p className="text-sm font-medium">Awaiting CSV Upload...</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="border-t border-slate-100 p-6 rounded-b-3xl">
                        <button
                            onClick={handleDirectProcurement}
                            disabled={isProcessing || validCount === 0 || user?.walletBalance < totalEstimatedCost}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />}
                            {isProcessing ? 'Dispatching Orders...' : `Pay & Dispatch ${validCount} Orders`}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default QuickOrder;