import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UploadCloud,
    FileSpreadsheet,
    Download,
    AlertCircle,
    CheckCircle2,
    Trash2,
    ShoppingCart,
    ArrowRight,
    ListPlus,
    Package,
    RefreshCw,
} from 'lucide-react';
import Papa from 'papaparse';
import { useCartStore } from '../store/cartStore';
import { AuthContext } from '../AuthContext';
import api from '../utils/api.js';
import { ROUTES } from '../utils/routes';

const BulkUpload = () => {
    const navigate = useNavigate();
    const { addToCart, isLoading } = useCartStore();
    const { isAdmin } = useContext(AuthContext);

    const [activeTab, setActiveTab] = useState('UPLOAD');

    const [adminUploadType, setAdminUploadType] = useState('CATALOG');

    const [parsedData, setParsedData] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const fileInputRef = useRef(null);

    // ─── RESELLER: CSV Parsing Logic ─────────────────────────────────────────
    const processCSVText = (text) => {
        try {
            const lines = text.split('\n');
            const results = [];
            const startIndex = lines[0].toLowerCase().includes('sku') ? 1 : 0;
            for (let i = startIndex; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = lines[i].split(',');
                const sku = cols[0]?.trim();
                const qty = parseInt(cols[1]?.trim(), 10);
                if (sku && !isNaN(qty) && qty > 0) {
                    results.push({ sku, qty, status: 'pending' });
                }
            }
            if (results.length === 0) throw new Error('No valid SKU/Quantity pairs found.');
            setParsedData(results);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to parse data. Ensure format is SKU,Quantity');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid .csv file');
            return;
        }

        setError('');
        setSuccessMsg('');
        setImportResult(null);

        if (isAdmin) {
            setUploadedFile(file);
            setParsedData([{ sku: file.name, qty: '—', status: 'pending' }]);
        } else {
            setUploadedFile(null);
            const reader = new FileReader();
            reader.onload = (event) => processCSVText(event.target.result);
            reader.readAsText(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            if (fileInputRef.current) {
                fileInputRef.current.files = dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                fileInputRef.current.dispatchEvent(event);
            }
        }
    };

    const handleManualSubmit = () => {
        processCSVText(manualInput);
    };
    
    const downloadFailures = (failedData, filenamePrefix) => {
        if (!failedData || failedData.length === 0) return;

        const csv = Papa.unparse(failedData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const runAdminImport = async () => {
        if (!uploadedFile) return;
        setIsImporting(true);
        setError('');
        setSuccessMsg('');
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('csvFile', uploadedFile);

            const endpoint =
                adminUploadType === 'CATALOG' ? 'products/import-csv' : 'products/sync-inventory';

            const res = await api.post(endpoint, formData, {
                timeout: 300000,
            });

            const data = res.data?.data;
            setImportResult(data);
            setSuccessMsg(res.data?.message || 'Process complete!');
            setParsedData((prev) => prev.map((p) => ({ ...p, status: 'success' })));

            if (data?.failedSkus && data.failedSkus.length > 0) {
                downloadFailures(data.failedSkus, 'inventory_sync_failures');
            }
            if (data?.failedRows && data.failedRows.length > 0) {
                downloadFailures(data.failedRows, 'catalog_import_failures');
            }
        } catch (err) {
            const msg = err.response?.data?.message || `Process failed: ${err.message}`;
            setError(msg);
            setParsedData((prev) => prev.map((p) => ({ ...p, status: 'error' })));
        } finally {
            setIsImporting(false);
        }
    };

    const processBulkOrder = async () => {
        setError('');
        setSuccessMsg('');
        if (parsedData.length === 0) return;

        let successCount = 0;
        let failCount = 0;

        for (const item of parsedData) {
            try {
                const res = await addToCart(item.sku, item.qty, 'DROPSHIP', 0);
                if (res.success) {
                    successCount++;
                    setParsedData((prev) =>
                        prev.map((p) => (p.sku === item.sku ? { ...p, status: 'success' } : p))
                    );
                } else {
                    failCount++;
                    setParsedData((prev) =>
                        prev.map((p) => (p.sku === item.sku ? { ...p, status: 'error' } : p))
                    );
                }
            } catch {
                failCount++;
                setParsedData((prev) =>
                    prev.map((p) => (p.sku === item.sku ? { ...p, status: 'error' } : p))
                );
            }
        }

        if (successCount > 0) {
            setSuccessMsg(`Successfully added ${successCount} items to your procurement cart.`);
            setTimeout(() => navigate(ROUTES.MY_ACCOUNT), 2000);
        }
        if (failCount > 0) {
            setError(`Failed to add ${failCount} items. Check if SKUs are correct and in stock.`);
        }
    };

    const removeRow = (indexToRemove) => {
        setParsedData(parsedData.filter((_, idx) => idx !== indexToRemove));
        if (isAdmin) setUploadedFile(null);
    };

    const downloadTemplate = () => {
        let csvContent = '';
        let filename = '';

        if (isAdmin) {
            if (adminUploadType === 'CATALOG') {
                csvContent =
                    'data:text/csv;charset=utf-8,Handle,Title,Body (HTML),Vendor,Type,Tags,Variant SKU,Variant Grams,Variant Price,Cost per item,Image Src,Image Position,Status\nexample-product,Example Product,<p>Description here</p>,Your Brand,Electronics,tag1,SKU-001,500,999,799,https://image.url/product.jpg,1,active\n';
                filename = 'sovely_product_import_template.csv';
            } else {
                csvContent =
                    'data:text/csv;charset=utf-8,SKU,On hand (current)\nSKU-001,500\nSKU-002,150\n';
                filename = 'sovely_inventory_sync_template.csv';
            }
        } else {
            csvContent = 'data:text/csv;charset=utf-8,SKU,Quantity\nITEM-001,50\nITEM-002,100\n';
            filename = 'sovely_bulk_order_template.csv';
        }

        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const reset = () => {
        setParsedData([]);
        setUploadedFile(null);
        setError('');
        setSuccessMsg('');
        setImportResult(null);
        setManualInput('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePrimaryAction = () => {
        if (isAdmin) runAdminImport();
        else processBulkOrder();
    };

    const primaryButtonLabel = isAdmin
        ? isImporting
            ? 'Processing Data...'
            : adminUploadType === 'CATALOG'
              ? 'Import Catalog'
              : 'Sync Inventory'
        : isLoading
          ? 'Processing Bulk Order...'
          : 'Add All to Procurement Cart';

    const primaryButtonDisabled = isAdmin
        ? isImporting || !uploadedFile
        : isLoading || parsedData.length === 0;

    return (
        <div className="mx-auto mb-20 w-full max-w-5xl px-4 py-8 font-sans md:mb-0 md:py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {isAdmin ? 'Store Management Hub' : 'Quick Procure'}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                    {isAdmin
                        ? 'Upload Shopify-format CSVs to build your catalog or sync live inventory levels.'
                        : 'Upload a CSV or paste your SKUs to instantly build your dropship cart.'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-5">
                    {}
                    {!isAdmin && (
                        <div className="flex rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
                            <button
                                onClick={() => {
                                    setActiveTab('UPLOAD');
                                    reset();
                                }}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all ${activeTab === 'UPLOAD' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <UploadCloud size={18} /> CSV Upload
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('PASTE');
                                    reset();
                                }}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all ${activeTab === 'PASTE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <ListPlus size={18} /> Quick Paste
                            </button>
                        </div>
                    )}

                    {}
                    {isAdmin && (
                        <div className="flex rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
                            <button
                                onClick={() => {
                                    setAdminUploadType('CATALOG');
                                    reset();
                                }}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all ${adminUploadType === 'CATALOG' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Package size={18} /> Catalog Import
                            </button>
                            <button
                                onClick={() => {
                                    setAdminUploadType('INVENTORY');
                                    reset();
                                }}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all ${adminUploadType === 'INVENTORY' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <RefreshCw size={18} /> Inventory Sync
                            </button>
                        </div>
                    )}

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        {activeTab === 'UPLOAD' || isAdmin ? (
                            <div className="space-y-4">
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                                >
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                    <FileSpreadsheet
                                        size={40}
                                        className={`mb-3 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`}
                                    />
                                    <p className="text-sm font-extrabold text-slate-700">
                                        {uploadedFile
                                            ? uploadedFile.name
                                            : 'Drag & Drop your CSV here'}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                        {uploadedFile
                                            ? `${(uploadedFile.size / 1024).toFixed(1)} KB — click to change`
                                            : 'or click to browse files'}
                                    </p>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 py-3 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
                                >
                                    <Download size={16} /> Download{' '}
                                    {isAdmin
                                        ? adminUploadType === 'CATALOG'
                                            ? 'Catalog'
                                            : 'Inventory'
                                        : 'Order'}{' '}
                                    Template
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <p>
                                        Format: One item per line as{' '}
                                        <span className="rounded border border-amber-200 bg-white px-1 font-mono">
                                            SKU,Quantity
                                        </span>
                                    </p>
                                </div>
                                <textarea
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder={'ITEM-A123, 50\nITEM-B456, 150'}
                                    className="custom-scrollbar h-48 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700 outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={!manualInput.trim()}
                                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                                >
                                    Process Text
                                </button>
                            </div>
                        )}
                    </div>

                    {}
                    {isAdmin && adminUploadType === 'CATALOG' && (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
                            <p className="mb-1 font-extrabold">
                                ✅ Supported Format: Shopify Product Export CSV
                            </p>
                            <p className="font-medium text-blue-700">
                                Required columns:{' '}
                                <span className="font-mono">
                                    Handle, Title, Variant Price, Type, Image Src, Status
                                </span>
                            </p>
                            <p className="mt-1 font-medium text-blue-700">
                                Existing SKUs will be updated, new ones inserted.
                            </p>
                        </div>
                    )}

                    {}
                    {isAdmin && adminUploadType === 'INVENTORY' && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800">
                            <p className="mb-1 font-extrabold">
                                ✅ Supported Format: Shopify Inventory Export CSV
                            </p>
                            <p className="font-medium text-amber-700">
                                Required columns:{' '}
                                <span className="font-mono">SKU, On hand (current)</span> OR{' '}
                                <span className="font-mono">On hand (new)</span>
                            </p>
                            <p className="mt-1 font-medium text-amber-700">
                                Only updates stock for existing products in the database.
                            </p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-7">
                    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                                {isAdmin ? (
                                    <Package size={20} className="text-slate-400" />
                                ) : (
                                    <ShoppingCart size={20} className="text-slate-400" />
                                )}
                                {isAdmin ? 'Processing Preview' : 'Order Preview'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                                    {parsedData.length} {isAdmin ? 'File' : 'Valid Rows'}
                                </span>
                                {parsedData.length > 0 && (
                                    <button
                                        onClick={reset}
                                        className="flex items-center gap-1 text-xs font-bold text-slate-400 transition-colors hover:text-red-500"
                                    >
                                        <RefreshCw size={12} /> Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                                <AlertCircle size={16} className="shrink-0" /> <p>{error}</p>
                            </div>
                        )}
                        {successMsg && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                                <CheckCircle2 size={16} className="shrink-0" /> <p>{successMsg}</p>
                            </div>
                        )}

                        {}
                        {importResult && (
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                {importResult.inserted !== undefined && (
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                                        <p className="text-2xl font-black text-emerald-600">
                                            {importResult.inserted}
                                        </p>
                                        <p className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                                            New Products
                                        </p>
                                    </div>
                                )}
                                {importResult.updated !== undefined && (
                                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
                                        <p className="text-2xl font-black text-blue-600">
                                            {importResult.updated}
                                        </p>
                                        <p className="text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                                            Updated
                                        </p>
                                    </div>
                                )}
                                {importResult.skipped !== undefined && (
                                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                                        <p className="text-2xl font-black text-amber-600">
                                            {importResult.skipped}
                                        </p>
                                        <p className="text-[10px] font-bold tracking-wider text-amber-700 uppercase">
                                            Skipped
                                        </p>
                                    </div>
                                )}
                                {importResult.notFound !== undefined && (
                                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
                                        <p className="text-2xl font-black text-red-600">
                                            {importResult.notFound}
                                        </p>
                                        <p className="text-[10px] font-bold tracking-wider text-red-700 uppercase">
                                            Not Found
                                        </p>
                                    </div>
                                )}
                                {importResult.errors?.length > 0 && (
                                    <div className="col-span-3 rounded-xl border border-red-100 bg-red-50 p-3">
                                        <p className="mb-1 text-[10px] font-extrabold text-red-700 uppercase">
                                            Errors / Warnings:
                                        </p>
                                        <div className="custom-scrollbar max-h-24 overflow-y-auto">
                                            {importResult.errors.map((e, i) => (
                                                <p
                                                    key={i}
                                                    className="font-mono text-[10px] text-red-600"
                                                >
                                                    {e}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {parsedData.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-slate-400">
                                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                                    <FileSpreadsheet size={32} className="text-slate-300" />
                                </div>
                                <p className="font-extrabold text-slate-600">No data loaded</p>
                                <p className="mt-1 max-w-[250px] text-sm">
                                    {isAdmin
                                        ? 'Select an action above and upload a CSV to begin.'
                                        : 'Upload a file or paste SKUs to see your order preview here.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="custom-scrollbar max-h-[400px] flex-1 overflow-hidden overflow-y-auto rounded-2xl border border-slate-100">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-extrabold text-slate-500 uppercase shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    {isAdmin ? 'File Name' : 'SKU'}
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    {isAdmin ? 'Size' : 'Qty'}
                                                </th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parsedData.map((row, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="transition-colors hover:bg-slate-50"
                                                >
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                                        {row.sku}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                                                        {isAdmin && uploadedFile
                                                            ? `${(uploadedFile.size / 1024).toFixed(0)} KB`
                                                            : row.qty}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {row.status === 'pending' && (
                                                            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 uppercase">
                                                                {isImporting
                                                                    ? 'Working...'
                                                                    : 'Ready'}
                                                            </span>
                                                        )}
                                                        {row.status === 'success' && (
                                                            <span className="mx-auto flex w-fit items-center justify-center gap-1 rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 uppercase">
                                                                <CheckCircle2 size={10} /> Done
                                                            </span>
                                                        )}
                                                        {row.status === 'error' && (
                                                            <span className="mx-auto flex w-fit items-center justify-center gap-1 rounded bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700 uppercase">
                                                                <AlertCircle size={10} /> Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => removeRow(idx)}
                                                            disabled={
                                                                isLoading ||
                                                                isImporting ||
                                                                row.status === 'success'
                                                            }
                                                            className="text-slate-400 transition-colors hover:text-red-500 disabled:opacity-30"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 border-t border-slate-100 pt-6">
                                    <button
                                        onClick={handlePrimaryAction}
                                        disabled={primaryButtonDisabled}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-extrabold tracking-widest text-white uppercase shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        {isImporting && (
                                            <span className="mr-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        )}
                                        {primaryButtonLabel} <ArrowRight size={18} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkUpload;
