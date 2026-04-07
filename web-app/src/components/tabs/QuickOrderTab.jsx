import React, { useState, useRef, useContext, useMemo } from 'react';
import {
    FileSpreadsheet,
    CheckCircle2,
    Loader2,
    Package,
    Download,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import { AuthContext } from '../../AuthContext';
import api from '../../utils/api';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

export default function QuickOrderTab() {
    const { user, refreshUser } = useContext(AuthContext);
    const [parsedOrders, setParsedOrders] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [viewFilter, setViewFilter] = useState('ALL');

    const fileInputRef = useRef(null);

    const totalEstimatedCost = useMemo(() => {
        return parsedOrders
            .filter((o) => o.status === 'valid')
            .reduce((sum, ord) => sum + (ord.calculatedCost || 0), 0);
    }, [parsedOrders]);

    const validCount = parsedOrders.filter((i) => i.status === 'valid').length;
    const errorCount = parsedOrders.filter((i) => i.status === 'error').length;

    const downloadTemplate = () => {
        const headers = [
            'SKU',
            'Quantity',
            'Customer Name',
            'Phone',
            'Shipping Address1',
            'Shipping Address2',
            'City',
            'State',
            'Pincode',
            'Selling Price',
            'Payment Status',
        ];
        const sampleRow = [
            'SAMPLE-SKU-001',
            '1',
            'Rahul Sharma',
            '9876543210',
            'Flat 402, Block B',
            'MG Road',
            'Bengaluru',
            'Karnataka',
            '560001',
            '999',
            'COD',
        ];
        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'sovely_bulk_order_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsValidating(true);
        setSuccessMessage('');
        setViewFilter('ALL');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase(),
            complete: async (results) => {
                if (results.errors.length > 0 && results.data.length === 0) {
                    toast.error('Failed to parse the CSV file.');
                    setIsValidating(false);
                    return;
                }
                await processParsedData(results.data);
            },
            error: (error) => {
                toast.error(`Error parsing file: ${error.message}`);
                setIsValidating(false);
            },
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processParsedData = async (data) => {
        if (!data || data.length === 0) {
            toast.error('CSV is empty.');
            setIsValidating(false);
            return;
        }

        const rawOrders = [];
        const skusToFetch = new Set();

        data.forEach((row, i) => {
            const sku = row['sku']?.replace(/["'\r\n]/g, '').trim();
            const qty = parseInt(row['quantity']?.trim(), 10);

            if (sku && qty > 0) {
                skusToFetch.add(sku);
                const street =
                    `${row['shipping address1'] || ''} ${row['shipping address2'] || ''}`.trim();
                rawOrders.push({
                    id: `row-${Date.now()}-${i}`,
                    sku,
                    qty,
                    customerName: row['customer name']?.trim(),
                    phone: row['phone']?.trim() || '0000000000',
                    street: street || 'Address Not Provided',
                    city: row['city']?.trim(),
                    state: row['state']?.trim(),
                    zip: row['pincode']?.trim(),
                    resellerSellingPrice:
                        parseFloat(row['selling price'] || row['sellling price'] || '0') || 0,
                    paymentMethod:
                        row['payment status']?.trim().toLowerCase() === 'cod'
                            ? 'COD'
                            : 'PREPAID_WALLET',
                    status: 'pending',
                });
            }
        });

        try {
            const res = await api.post('/products/validate-bulk', {
                skus: Array.from(skusToFetch),
            });
            const dbProducts = res.data.data;

            const validatedOrders = rawOrders.map((order) => {
                const dbProduct = dbProducts.find((p) => p.sku === order.sku);

                if (!dbProduct) return { ...order, status: 'error', message: 'SKU not found' };
                if (dbProduct.inventory?.stock < order.qty)
                    return {
                        ...order,
                        status: 'error',
                        message: `Only ${dbProduct.inventory.stock} in stock`,
                    };

                const itemCost = dbProduct.dropshipBasePrice * order.qty;
                const totalItemCost = itemCost + itemCost * (dbProduct.gstSlab / 100);

                return {
                    ...order,
                    productId: dbProduct._id,
                    title: dbProduct.title,
                    status: 'valid',
                    calculatedCost: totalItemCost,
                };
            });

            setParsedOrders(validatedOrders);
            if (validatedOrders.some((o) => o.status === 'error')) {
                toast('Some items need your attention.', { icon: '⚠️' });
            }
        } catch (error) {
            toast.error('Validation failed against server data.');
        } finally {
            setIsValidating(false);
        }
    };

    // --- NEW: Staging Area Controls ---
    const removeRow = (id) => {
        setParsedOrders((prev) => prev.filter((o) => o.id !== id));
    };

    const clearAllErrors = () => {
        setParsedOrders((prev) => prev.filter((o) => o.status === 'valid'));
        setViewFilter('ALL');
        toast.success('Removed all problematic rows.');
    };

    const handleDirectProcurement = async () => {
        const validOrders = parsedOrders.filter((o) => o.status === 'valid');
        if (validOrders.length === 0) return;

        setIsProcessing(true);
        try {
            await api.post('/orders/bulk-dropship', {
                orders: validOrders.map((o) => ({
                    productId: o.productId,
                    qty: o.qty,
                    resellerSellingPrice: o.resellerSellingPrice,
                    paymentMethod: o.paymentMethod,
                    endCustomerDetails: {
                        name: o.customerName,
                        phone: o.phone,
                        address: { street: o.street, city: o.city, state: o.state, zip: o.zip },
                    },
                })),
            });
            await refreshUser();
            setSuccessMessage(`Successfully dispatched ${validOrders.length} dropship orders!`);
            setParsedOrders([]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transaction failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const displayedOrders = parsedOrders.filter((o) => {
        if (viewFilter === 'VALID') return o.status === 'valid';
        if (viewFilter === 'ERROR') return o.status === 'error';
        return true;
    });

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-16 text-center transition-colors hover:border-indigo-400">
                    <FileSpreadsheet size={48} className="mb-4 text-indigo-400" />
                    <h3 className="text-lg font-extrabold text-indigo-900">Upload Store CSV</h3>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isValidating}
                        className="mt-6 flex w-full max-w-[200px] items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isValidating ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            'Select CSV File'
                        )}
                    </button>

                    <button
                        onClick={downloadTemplate}
                        className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-800"
                    >
                        <Download size={14} /> Download CSV Template
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-8">
                {successMessage ? (
                    <div className="flex h-full flex-col items-center justify-center p-12 text-center">
                        <CheckCircle2 size={56} className="mb-4 text-emerald-500" />
                        <p className="text-lg font-bold text-slate-900">{successMessage}</p>
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                        >
                            Upload another batch
                        </button>
                    </div>
                ) : (
                    <>
                        {/* NEW: Staging Area Header & Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-t-3xl border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewFilter('ALL')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${viewFilter === 'ALL' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                >
                                    All ({parsedOrders.length})
                                </button>
                                <button
                                    onClick={() => setViewFilter('VALID')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${viewFilter === 'VALID' ? 'bg-emerald-600 text-white' : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'}`}
                                >
                                    Ready ({validCount})
                                </button>
                                <button
                                    onClick={() => setViewFilter('ERROR')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${viewFilter === 'ERROR' ? 'bg-red-600 text-white' : 'border border-red-200 bg-white text-red-700 hover:bg-red-50'}`}
                                >
                                    Errors ({errorCount})
                                </button>
                            </div>

                            {errorCount > 0 && (
                                <button
                                    onClick={clearAllErrors}
                                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={14} /> Discard All Errors
                                </button>
                            )}
                        </div>

                        <div className="custom-scrollbar max-h-[400px] flex-1 overflow-y-auto p-0">
                            <table className="relative w-full text-left text-sm">
                                <thead className="sticky top-0 z-10 bg-white text-[10px] font-bold tracking-wider text-slate-400 uppercase shadow-sm">
                                    <tr>
                                        <th className="p-4">Customer & Dest.</th>
                                        <th className="p-4">SKU / Qty</th>
                                        <th className="p-4 text-right">Status</th>
                                        <th className="w-10 p-4 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {parsedOrders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="p-12 text-center font-medium text-slate-400"
                                            >
                                                No data parsed yet. Upload a CSV to preview.
                                            </td>
                                        </tr>
                                    ) : displayedOrders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="p-12 text-center font-medium text-slate-400"
                                            >
                                                No items match this filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedOrders.map((ord) => (
                                            <tr
                                                key={ord.id}
                                                className={`group transition-colors ${ord.status === 'error' ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50/80'}`}
                                            >
                                                <td className="p-4">
                                                    <p
                                                        className={`font-bold ${ord.status === 'error' ? 'text-red-900' : 'text-slate-900'}`}
                                                    >
                                                        {ord.customerName}
                                                    </p>
                                                    <p
                                                        className={`text-xs ${ord.status === 'error' ? 'text-red-500' : 'text-slate-500'}`}
                                                    >
                                                        {ord.city}, {ord.zip}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-mono text-xs font-bold text-slate-700">
                                                        {ord.sku}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Qty: {ord.qty} •{' '}
                                                        {ord.paymentMethod === 'COD'
                                                            ? 'COD'
                                                            : 'Prepaid'}
                                                    </p>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {ord.status === 'error' ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-red-700 uppercase">
                                                                <AlertCircle size={12} /> Error
                                                            </span>
                                                            <span className="text-[10px] text-red-500">
                                                                {ord.message}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase">
                                                            Ready
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => removeRow(ord.id)}
                                                        className="rounded p-1.5 text-slate-300 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col items-center justify-between gap-4 rounded-b-3xl border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:p-6">
                            <div>
                                <span className="mb-0.5 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                                    Est. Platform Cost (Valid Only)
                                </span>
                                <span className="text-xl font-black text-slate-900">
                                    ₹
                                    {totalEstimatedCost.toLocaleString('en-IN', {
                                        maximumFractionDigits: 0,
                                    })}
                                </span>
                            </div>
                            <button
                                onClick={handleDirectProcurement}
                                disabled={
                                    isProcessing ||
                                    validCount === 0 ||
                                    user?.walletBalance < totalEstimatedCost
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                {isProcessing ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Package size={18} />
                                )}
                                Dispatch {validCount} Orders
                            </button>
                        </div>
                        {user?.walletBalance < totalEstimatedCost && validCount > 0 && (
                            <p className="-mt-4 rounded-b-3xl bg-slate-50 px-6 pb-4 text-center text-xs font-bold text-red-500">
                                Insufficient wallet balance. You need ₹
                                {(totalEstimatedCost - user.walletBalance).toLocaleString('en-IN')}{' '}
                                more.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
