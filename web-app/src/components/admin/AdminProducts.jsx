import React, { useState, useEffect } from 'react';
import { Search, Edit2, ChevronLeft, ChevronRight, Plus, Package } from 'lucide-react';
import api from '../../utils/api.js';
import CreateProductModal from './CreateProductModal';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterOption, setFilterOption] = useState('ALL');
    const [priceFilter, setPriceFilter] = useState('ALL');
    const [stockFilter, setStockFilter] = useState('ALL');

    const [updatingId, setUpdatingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // OPTIMIZATION: Debounce search and explicitly reset page only when search fires
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== debouncedSearch) {
                setDebouncedSearch(searchQuery);
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearch]);

    // Fetch Products
    useEffect(() => {
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

                // Sort by stock to prioritize items needing attention
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
        fetchProducts();
    }, [page, debouncedSearch, filterOption, priceFilter, stockFilter]);

    const submitProductUpdate = async (id) => {
        setIsSaving(true);
        try {
            const res = await api.put(`/products/${id}`, {
                dropshipBasePrice: Number(editForm.dropshipBasePrice),
                suggestedRetailPrice: Number(editForm.suggestedRetailPrice),
                moq: Number(editForm.moq),
                status: editForm.status,
                inventory: { stock: Number(editForm.stock) },
            });

            setProducts((prev) => {
                const updatedList = prev.map((p) => (p._id === id ? res.data.data : p));
                return updatedList.sort(
                    (a, b) => (a.inventory?.stock || 0) - (b.inventory?.stock || 0)
                );
            });
            setUpdatingId(null);
        } catch (err) {
            alert('Failed to update product');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setDebouncedSearch('');
        setFilterOption('ALL');
        setPriceFilter('ALL');
        setStockFilter('ALL');
        setPage(1);
    };

    const hasActiveFilters = searchQuery || filterOption !== 'ALL' || priceFilter !== 'ALL' || stockFilter !== 'ALL';

    return (
        <>
            {/* FILTER BAR */}
            <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex min-w-[250px] flex-1 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Title or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-3 w-full border-none text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>

                <select
                    value={filterOption}
                    onChange={(e) => { setFilterOption(e.target.value); setPage(1); }}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>

                <select
                    value={priceFilter}
                    onChange={(e) => { setPriceFilter(e.target.value); setPage(1); }}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                    <option value="ALL">All Prices</option>
                    <option value="UNDER_500">Under ₹500</option>
                    <option value="OVER_1000">Over ₹1,000</option>
                </select>

                <select
                    value={stockFilter}
                    onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                    <option value="ALL">All Stock Levels</option>
                    <option value="IN_STOCK">In Stock ({'>'}10)</option>
                    <option value="LOW_STOCK">Low Stock (1-10)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                </select>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                    <Plus size={18} /> New B2B Product
                </button>
            </div>

            {/* TABLE */}
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
                            {/* NO PRODUCTS FOUND STATE */}
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
                                            There are no products matching your current filters or search query.
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

                            {products.map((p) => {
                                const isEdit = updatingId === p._id;
                                return (
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
                                            {isEdit ? (
                                                <div className="flex flex-col gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Base Cost"
                                                        value={editForm.dropshipBasePrice}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                dropshipBasePrice: e.target.value,
                                                            })
                                                        }
                                                        className="w-24 rounded border border-slate-300 p-1.5 text-xs font-bold outline-none focus:border-slate-900"
                                                        title="Base Cost"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Retail SRP"
                                                        value={editForm.suggestedRetailPrice}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                suggestedRetailPrice:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        className="w-24 rounded border border-slate-300 p-1.5 text-xs font-bold outline-none focus:border-slate-900"
                                                        title="Suggested Retail"
                                                    />
                                                </div>
                                            ) : (
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
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {isEdit ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 text-[10px] font-bold text-slate-400 uppercase">
                                                            Stock
                                                        </span>
                                                        <input
                                                            type="number"
                                                            value={editForm.stock}
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    stock: e.target.value,
                                                                })
                                                            }
                                                            className="w-16 rounded border border-slate-300 p-1.5 text-sm font-medium outline-none focus:border-slate-900"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 text-[10px] font-bold text-slate-400 uppercase">
                                                            MOQ
                                                        </span>
                                                        <input
                                                            type="number"
                                                            value={editForm.moq}
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    moq: e.target.value,
                                                                })
                                                            }
                                                            className="w-16 rounded border border-slate-300 p-1.5 text-sm font-medium outline-none focus:border-slate-900"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="font-extrabold text-slate-900">
                                                        {p.inventory?.stock}{' '}
                                                        <span className="text-[10px] font-medium text-slate-500">
                                                            Units
                                                        </span>
                                                    </span>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase ${p.inventory?.stock === 0
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
                                                    {p.tieredPricing?.length > 0 && (
                                                        <span className="mt-1 w-fit rounded bg-indigo-50 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-indigo-600">
                                                            Wholesale Tiers Active
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {isEdit ? (
                                                <select
                                                    value={editForm.status}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            status: e.target.value,
                                                        })
                                                    }
                                                    className="rounded border border-slate-300 p-1.5 text-xs font-bold outline-none focus:border-slate-900"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="draft">Draft</option>
                                                    <option value="archived">Archived</option>
                                                </select>
                                            ) : (
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase ${p.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                >
                                                    {p.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {isEdit ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        disabled={isSaving}
                                                        onClick={() => submitProductUpdate(p._id)}
                                                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                                                    >
                                                        {isSaving ? '...' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={() => setUpdatingId(null)}
                                                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setUpdatingId(p._id);
                                                        setEditForm({
                                                            dropshipBasePrice: p.dropshipBasePrice,
                                                            suggestedRetailPrice:
                                                                p.suggestedRetailPrice,
                                                            moq: p.moq || 1,
                                                            stock: p.inventory?.stock || 0,
                                                            status: p.status,
                                                        });
                                                    }}
                                                    className="rounded-lg bg-slate-100 p-2 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-900"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            {products.length > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-sm font-bold text-slate-500">
                        Page <span className="text-slate-900">{page}</span> of{' '}
                        <span className="text-slate-900">{totalPages || 1}</span>
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || totalPages === 0}
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}

            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => setPage(1)}
            />
        </>
    );
};

export default AdminProducts;