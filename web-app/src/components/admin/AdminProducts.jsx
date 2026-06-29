import React, { useState, useEffect, useRef } from 'react';
import { Search, Edit2, ChevronLeft, ChevronRight, Plus, Package } from 'lucide-react';
import api from '../../utils/api.js';
import ProductFormModal from './ProductFormModal';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchInputRef = useRef(null);

    const [filterOption, setFilterOption] = useState('ALL');
    const [priceFilter, setPriceFilter] = useState('ALL');
    const [stockFilter, setStockFilter] = useState('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [tempModifier, setTempModifier] = useState(100);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkAdjustValue, setBulkAdjustValue] = useState(0);

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const activeTag = document.activeElement?.tagName;
            if (
                activeTag === 'INPUT' ||
                activeTag === 'TEXTAREA' ||
                document.activeElement?.isContentEditable
            ) {
                return;
            }
            if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
                return;
            }
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        const fetchGlobalModifier = async () => {
            try {
                const res = await api.get('/products/admin/global-modifier');
                const activeModifier = res.data?.data?.modifier || 1;
                setTempModifier(activeModifier * 100);
            } catch (err) {
                console.error("Failed to fetch global modifier", err);
            }
        };
        fetchGlobalModifier();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== debouncedSearch) {
                setDebouncedSearch(searchQuery);
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearch]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products/admin/all', {
                params: {
                    page,
                    limit: 10,
                    search: debouncedSearch,
                    status: filterOption === 'ALL' ? '' : filterOption,
                    price: priceFilter === 'ALL' ? '' : priceFilter,
                    stock: stockFilter === 'ALL' ? '' : stockFilter,
                },
            });

            let fetchedProducts = res.data?.data?.products || res.data?.data?.data || [];

            fetchedProducts.sort((a, b) => {
                const stockA = a.inventory?.stock || 0;
                const stockB = b.inventory?.stock || 0;
                return stockA - stockB;
            });

            setProducts(fetchedProducts);
            setTotalPages(
                res.data?.data?.pagination?.pages || res.data?.data?.pagination?.totalPages || 1
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, debouncedSearch, filterOption, priceFilter, stockFilter]);

    const clearFilters = () => {
        setSearchQuery('');
        setDebouncedSearch('');
        setFilterOption('ALL');
        setPriceFilter('ALL');
        setStockFilter('ALL');
        setPage(1);
    };

    const hasActiveFilters =
        searchQuery || filterOption !== 'ALL' || priceFilter !== 'ALL' || stockFilter !== 'ALL';

    const handleOpenCreateModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleTempModifierSave = async (newValue) => {
        try {
            const multiplier = newValue / 100;
            await api.post('/products/admin/global-modifier', { modifier: multiplier });
            alert(`Temporary global pricing set to ${newValue}%`);
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert('Failed to update temporary pricing.');
        }
    };

    const handlePermanentBulkAdjust = async () => {
        if (
            !window.confirm(
                `WARNING: This will permanently modify all base prices in the database by ${bulkAdjustValue > 0 ? '+' : ''}${bulkAdjustValue}%. Are you sure?`
            )
        ) {
            return;
        }

        try {
            await api.post('/products/admin/bulk-adjust-price', { percentage: bulkAdjustValue });
            alert('Database successfully updated.');
            setIsBulkModalOpen(false);
            setBulkAdjustValue(0);
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert('Failed to bulk adjust database.');
        }
    };

    return (
        <>
            {}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 md:col-span-2">
                    <Search size={18} className="text-slate-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Start typing to search Title, SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-3 w-full border-none text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>

                <select
                    value={filterOption}
                    onChange={(e) => {
                        setFilterOption(e.target.value);
                        setPage(1);
                    }}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>

                <select
                    value={priceFilter}
                    onChange={(e) => {
                        setPriceFilter(e.target.value);
                        setPage(1);
                    }}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                    <option value="ALL">All Prices</option>
                    <option value="UNDER_500">Under ₹500</option>
                    <option value="OVER_1000">Over ₹1,000</option>
                </select>

                <select
                    value={stockFilter}
                    onChange={(e) => {
                        setStockFilter(e.target.value);
                        setPage(1);
                    }}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                    <option value="ALL">All Stock Levels</option>
                    <option value="IN_STOCK">In Stock ({'>'}10)</option>
                    <option value="LOW_STOCK">Low Stock (1-10)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                </select>

                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                    <Plus size={18} /> New Product
                </button>
            </div>

            {}
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                {}
                <div className="flex w-full max-w-md flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <label className="text-xs font-bold tracking-wider text-amber-700 uppercase">
                        Temporary Global Price Modifier
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="50"
                            max="200"
                            value={tempModifier}
                            onChange={(e) => setTempModifier(Number(e.target.value))}
                            onMouseUp={(e) => handleTempModifierSave(Number(e.target.value))}
                            className="w-full accent-amber-600"
                        />
                        <span className="w-14 text-right font-black text-slate-900">
                            {tempModifier}%
                        </span>
                    </div>
                </div>

                {}
                <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="flex h-fit items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold whitespace-nowrap text-red-700 shadow-sm transition-colors hover:bg-red-100"
                >
                    Permanent Bulk Adjust
                </button>
            </div>

            {}
            <div className="mb-6 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                <div className="relative min-h-[300px] overflow-x-auto">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 text-slate-400 backdrop-blur-sm">
                            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                        </div>
                    )}
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Product
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Dropship Info
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Logistics
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Status
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && products.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center">
                                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                            <Package size={40} />
                                        </div>
                                        <h3 className="mb-2 text-xl font-extrabold text-slate-900">
                                            No Products Found
                                        </h3>
                                        <p className="mb-8 font-medium text-slate-500">
                                            There are no products matching your current filters or
                                            search query.
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
                                            >
                                                Clear All Filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}

                            {products.map((p) => (
                                <tr
                                    key={p._id}
                                    className="group transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    p.images?.[0]?.url ||
                                                    'https://via.placeholder.com/40'
                                                }
                                                alt=""
                                                className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                                            />
                                            <div>
                                                <div className="max-w-[200px] truncate font-bold text-slate-900">
                                                    {p.title}
                                                </div>
                                                <div className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                    SKU: {p.sku}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-xs font-bold text-slate-500">
                                                Base Cost:{' '}
                                                <span className="text-slate-900">
                                                    ₹{p.dropshipBasePrice}
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-500">
                                                Retail SRP:{' '}
                                                <span className="text-slate-900">
                                                    ₹{p.suggestedRetailPrice}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-extrabold tracking-wider text-emerald-600">
                                                EST MARGIN: {p.estimatedMarginPercent}%
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-extrabold text-slate-900">
                                                {p.inventory?.stock}{' '}
                                                <span className="text-[10px] font-medium text-slate-500">
                                                    Units
                                                </span>
                                            </span>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span
                                                    className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase ${
                                                        p.inventory?.stock === 0
                                                            ? 'bg-red-100 text-red-700'
                                                            : p.inventory?.stock <= 10
                                                              ? 'bg-amber-100 text-amber-700'
                                                              : 'bg-green-100 text-green-700'
                                                    }`}
                                                >
                                                    {p.inventory?.stock === 0
                                                        ? 'Out of Stock'
                                                        : p.inventory?.stock <= 10
                                                          ? 'Low Stock'
                                                          : 'In Stock'}
                                                </span>
                                                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                    MOQ:{' '}
                                                    <span className="text-slate-700">
                                                        {p.moq || 1}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                                                p.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleOpenEditModal(p)}
                                            className="rounded-lg bg-slate-100 p-2 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-900"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            {products.length > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        Page
                        <input
                            type="number"
                            min={1}
                            max={totalPages || 1}
                            value={page}
                            onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : 1;
                                setPage(Math.min(totalPages || 1, Math.max(1, val)));
                            }}
                            className="w-14 [appearance:textfield] rounded-lg border border-slate-200 bg-white py-1 text-center text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        of <span className="text-slate-900">{totalPages || 1}</span>
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || totalPages === 0}
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}

            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchProducts()}
                initialData={editingProduct}
            />

            {}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="mb-4 text-xl font-black text-slate-900">
                            Permanent Bulk Adjust
                        </h2>
                        <p className="mb-6 text-sm font-medium text-slate-500">
                            This will overwrite the base prices of every product in the database.
                            This action cannot be undone.
                        </p>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                Adjustment Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={bulkAdjustValue}
                                onChange={(e) => setBulkAdjustValue(Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                placeholder="e.g., 10 for +10%, -20 for -20%"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsBulkModalOpen(false)}
                                className="rounded-xl px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePermanentBulkAdjust}
                                className="rounded-xl bg-red-600 px-6 py-2.5 font-bold text-white shadow-sm hover:bg-red-700"
                            >
                                Apply to Database
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminProducts;
