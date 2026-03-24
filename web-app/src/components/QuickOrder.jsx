import React, { useState, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UploadCloud,
    FileText,
    ShoppingCart,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    XCircle,
    FileSpreadsheet,
    Loader2,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api'; // Needed to fetch SKU actual IDs

const QuickOrder = () => {
    const { user, isKycApproved } = useContext(AuthContext);
    const isB2BPending = user?.accountType === 'B2B' && !isKycApproved;

    const [activeTab, setActiveTab] = useState('paste');
    const [skuInput, setSkuInput] = useState('');
    const [parsedItems, setParsedItems] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fileInputRef = useRef(null);
    const addToCart = useCartStore((state) => state.addToCart);

    // --- 1. Robust Parsing & Validation ---
    const processRawText = async (text) => {
        if (!text.trim()) return;
        setIsValidating(true);
        setSuccessMessage('');
        setParsedItems([]);

        const lines = text.split('\n');
        const rawItems = [];
        const skusToFetch = [];

        // Step 1: Parse the text and gather SKUs
        lines.forEach((line) => {
            if (!line.trim()) return;
            const parts = line.split(',');
            if (parts.length >= 2) {
                const sku = parts[0].trim().toUpperCase();
                const qty = parseInt(parts[1].trim(), 10);
                if (sku && !isNaN(qty) && qty > 0) {
                    rawItems.push({ sku, qty, status: 'pending' });
                    skusToFetch.push(sku); // Collect SKU for the bulk query
                } else {
                    rawItems.push({
                        sku: parts[0] || 'Unknown',
                        qty: parts[1] || '0',
                        status: 'error',
                        message: 'Invalid format or quantity.',
                    });
                }
            } else {
                rawItems.push({
                    sku: line.trim(),
                    qty: 0,
                    status: 'error',
                    message: 'Missing comma or quantity.',
                });
            }
        });

        if (skusToFetch.length === 0) {
            setParsedItems(rawItems);
            setIsValidating(false);
            return;
        }

        // Step 2: The Ultra-Fast Bulk Database Query
        try {
            const res = await api.post('/products/validate-bulk', { skus: skusToFetch });
            const dbProducts = res.data.data; // Array of valid products from the DB

            // Step 3: Map the DB results back to the user's input to assign Statuses
            const validatedItems = rawItems.map((item) => {
                if (item.status === 'error') return item; // Skip ones that already failed parsing

                const dbProduct = dbProducts.find((p) => p.sku === item.sku);

                if (!dbProduct) {
                    return { ...item, status: 'error', message: 'SKU not found or inactive.' };
                }
                if (dbProduct.inventory?.stock < item.qty) {
                    return {
                        ...item,
                        productId: dbProduct._id,
                        status: 'error',
                        message: `Only ${dbProduct.inventory.stock} in stock.`,
                    };
                }
                if (item.qty < dbProduct.moq) {
                    return {
                        ...item,
                        productId: dbProduct._id,
                        status: 'warning',
                        message: `MOQ is ${dbProduct.moq}. Will auto-adjust.`,
                    };
                }

                return {
                    ...item,
                    productId: dbProduct._id,
                    price: dbProduct.platformSellPrice || dbProduct.dropshipBasePrice,
                    status: 'valid',
                    message: 'Ready to order.',
                };
            });

            setParsedItems(validatedItems);
        } catch (error) {
            console.error('Bulk validation failed', error);
            toast.error('Failed to validate list against server.');
        } finally {
            setIsValidating(false);
        }
    };

    // --- 2. CSV Upload Handler ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            setSkuInput(text);
            setActiveTab('paste');
            processRawText(text);
        };
        reader.readAsText(file);

        // Reset input so the same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- 3. The Add to Cart Loop ---
    const handleBulkAdd = async () => {
        const validItems = parsedItems.filter(
            (i) => i.status === 'valid' || i.status === 'warning'
        );
        if (validItems.length === 0) return toast.error('No valid items to add.');

        setIsProcessing(true);
        let successCount = 0;

        for (const item of validItems) {
            try {
                const res = await addToCart(item.productId, item.qty, 'WHOLESALE', 0);
                if (res.success) successCount++;
            } catch (error) {
                console.error(`Failed to add ${item.sku}`, error);
            }
        }

        setIsProcessing(false);
        setSuccessMessage(
            `Successfully added ${successCount} out of ${validItems.length} valid SKUs to your cart!`
        );
        setParsedItems([]);
        setSkuInput('');
    };

    // UI: Guardrail
    if (isB2BPending) {
        return (
            <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center rounded-[3rem] border border-slate-200 bg-white p-12 text-center shadow-xl shadow-slate-200/50">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                        <ShieldCheck size={48} />
                    </div>
                    <h2 className="mb-2 text-3xl font-extrabold text-slate-900">
                        Wholesale Access Locked
                    </h2>
                    <p className="mx-auto mb-8 max-w-md leading-relaxed font-medium text-slate-500">
                        The Quick Order Bulk pad is exclusively available to verified business
                        accounts. Your KYC is currently pending review.
                    </p>
                    <Link
                        to="/my-account"
                        className="rounded-full bg-slate-900 px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-slate-800"
                    >
                        Complete KYC Details
                    </Link>
                </div>
            </main>
        );
    }

    const validCount = parsedItems.filter(
        (i) => i.status === 'valid' || i.status === 'warning'
    ).length;
    const errorCount = parsedItems.filter((i) => i.status === 'error').length;

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                    Quick Order Pad
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                    Paste SKUs or upload a CSV to instantly validate stock and build your bulk cart.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* LEFT: Input Area */}
                <div className="space-y-6 lg:col-span-5">
                    <div className="flex gap-2 border-b border-slate-200 pb-px">
                        <button
                            className={`border-b-2 px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'paste' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                            onClick={() => setActiveTab('paste')}
                        >
                            Paste SKUs
                        </button>
                        <button
                            className={`border-b-2 px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'upload' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                            onClick={() => setActiveTab('upload')}
                        >
                            Upload CSV
                        </button>
                    </div>

                    {activeTab === 'paste' ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600" />
                                <p className="text-xs leading-relaxed font-medium text-blue-800">
                                    <strong>Format required:</strong> One product per line. SKU,
                                    followed by a comma, then Quantity.
                                    <br />
                                    <em>Example:</em>
                                    <br />
                                    <span className="rounded bg-blue-100/50 px-1 font-mono font-bold">
                                        SOV-A1B2C3D, 150
                                    </span>
                                    <br />
                                    <span className="rounded bg-blue-100/50 px-1 font-mono font-bold">
                                        SOV-X9Y8Z7W, 500
                                    </span>
                                </p>
                            </div>
                            <textarea
                                value={skuInput}
                                onChange={(e) => setSkuInput(e.target.value)}
                                placeholder="SOV-XXXXXXX, 100&#10;SOV-YYYYYYY, 250"
                                className="custom-scrollbar h-72 w-full rounded-2xl border border-slate-300 bg-white p-4 font-mono text-sm shadow-inner transition-all outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                            <button
                                onClick={() => processRawText(skuInput)}
                                disabled={!skuInput.trim() || isValidating}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Verifying
                                        Inventory...
                                    </>
                                ) : (
                                    'Validate List'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center transition-colors hover:border-slate-400 hover:bg-slate-100">
                            <FileSpreadsheet size={48} className="mb-4 text-slate-400" />
                            <h3 className="text-lg font-extrabold text-slate-900">
                                Upload CSV File
                            </h3>
                            <p className="mt-1 mb-6 max-w-sm text-xs font-medium text-slate-500">
                                File must contain two columns: SKU and Quantity (no headers
                                required).
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                            >
                                Select CSV File
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT: Verification & Action Console */}
                <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-7">
                    <div className="rounded-t-3xl border-b border-slate-100 bg-slate-50 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                            <FileText size={20} className="text-slate-500" /> Verification Status
                        </h3>
                    </div>

                    <div className="flex-1 p-6">
                        <AnimatePresence mode="wait">
                            {successMessage ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex h-full flex-col items-center justify-center py-12 text-center"
                                >
                                    <CheckCircle2 size={56} className="mb-4 text-emerald-500" />
                                    <p className="mb-6 text-lg font-bold text-slate-900">
                                        {successMessage}
                                    </p>
                                    <Link
                                        to="/checkout"
                                        className="rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800"
                                    >
                                        Proceed to Checkout
                                    </Link>
                                </motion.div>
                            ) : parsedItems.length > 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex h-full flex-col"
                                >
                                    {/* Stats Banner */}
                                    <div className="mb-4 flex gap-4">
                                        <div className="flex-1 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">
                                                Ready to Add
                                            </p>
                                            <p className="text-2xl font-black text-emerald-900">
                                                {validCount}
                                            </p>
                                        </div>
                                        <div className="flex-1 rounded-xl border border-red-100 bg-red-50 p-3">
                                            <p className="text-[10px] font-bold text-red-600 uppercase">
                                                Errors / Skipped
                                            </p>
                                            <p className="text-2xl font-black text-red-900">
                                                {errorCount}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Scrollable List */}
                                    <div
                                        className="custom-scrollbar mb-4 flex-1 overflow-y-auto pr-2"
                                        style={{ maxHeight: '400px' }}
                                    >
                                        <table className="w-full text-left text-sm">
                                            <thead className="sticky top-0 bg-white text-[10px] font-bold text-slate-400 uppercase">
                                                <tr>
                                                    <th className="pt-1 pb-2 font-medium">SKU</th>
                                                    <th className="pt-1 pb-2 font-medium">Qty</th>
                                                    <th className="pt-1 pb-2 font-medium">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {parsedItems.map((item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className={`${item.status === 'error' ? 'bg-red-50/50' : item.status === 'warning' ? 'bg-amber-50/50' : ''}`}
                                                    >
                                                        <td className="py-3 pr-2 font-mono font-bold text-slate-700">
                                                            {item.sku}
                                                        </td>
                                                        <td className="py-3 pr-2 font-bold text-slate-900">
                                                            {item.qty}
                                                        </td>
                                                        <td className="py-3">
                                                            {item.status === 'error' && (
                                                                <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                                                    <XCircle size={14} />{' '}
                                                                    {item.message}
                                                                </span>
                                                            )}
                                                            {item.status === 'warning' && (
                                                                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                                                    <AlertCircle size={14} />{' '}
                                                                    {item.message}
                                                                </span>
                                                            )}
                                                            {item.status === 'valid' && (
                                                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                                    <CheckCircle2 size={14} />{' '}
                                                                    {item.message}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Action Button */}
                                    <div className="border-t border-slate-100 pt-4">
                                        <button
                                            onClick={handleBulkAdd}
                                            disabled={isProcessing || validCount === 0}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-extrabold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />{' '}
                                                    Pushing to Cart...
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart size={18} /> Push {validCount}{' '}
                                                    Items to Cart
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center py-12 text-center text-slate-400">
                                    <FileText size={48} className="mb-4 opacity-50" />
                                    <p className="text-sm font-medium">
                                        Input SKUs to run a real-time inventory check.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default QuickOrder;
