import React, { useState, useEffect } from 'react';
import { Search, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api.js';
import CreateProductModal from './CreateProductModal';
import { Plus } from 'lucide-react';

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

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterOption, priceFilter, stockFilter]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await api.get('/products/admin/all', {
                    params: {
                        page,
                        limit: 10,
                        search: debouncedSearch,
                        status: filterOption,
                        price: priceFilter,
                        stock: stockFilter
                    }
                });

                setProducts(res.data.data.data);
                setTotalPages(res.data.data.pagination.totalPages);
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
            const res = await api.put(`/products/admin/${id}`, { 
                platformSellPrice: Number(editForm.price), 
                stock: Number(editForm.stock), 
                status: editForm.status 
            });

            setProducts(prev => prev.map(p => p._id === id ? res.data.data : p));
            setUpdatingId(null);
        } catch (err) {
            alert("Failed to update product");
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <>
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[250px] flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search Title or SKU..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="border-none outline-none ml-3 w-full text-sm font-medium text-slate-900 placeholder:text-slate-400" 
                    />
                </div>

                <select value={filterOption} onChange={(e) => setFilterOption(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer focus:border-accent">
                    <option value="ALL">All Statuses</option><option value="active">Active</option><option value="draft">Draft</option>
                </select>

                <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer focus:border-accent">
                    <option value="ALL">All Prices</option><option value="UNDER_500">Under ₹500</option><option value="OVER_1000">Over ₹1,000</option>
                </select>

                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer focus:border-accent">
                    <option value="ALL">All Stock</option><option value="IN_STOCK">In Stock ({">"}10)</option><option value="LOW_STOCK">Low Stock (1-10)</option><option value="OUT_OF_STOCK">Out of Stock (0)</option>
                </select>

                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-accent transition-colors shadow-sm"
                >
                    <Plus size={18} /> New Product
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6">
                <div className="overflow-x-auto relative min-h-[300px]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-400">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin mb-2"></div>
                        </div>
                    )}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Product</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Price (₹)</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Stock</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && products.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No products found.</td></tr> : null}
                            {products.map(p => {
                                const isEdit = updatingId === p._id;
                                return (
                                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 truncate max-w-[250px]">{p.title}</div>
                                            <div className="text-[10px] font-extrabold text-slate-400 mt-1 uppercase tracking-widest">SKU: {p.sku}</div>
                                        </td>
                                        <td className="p-4 font-extrabold text-slate-900">
                                            {isEdit ? <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="w-20 p-1.5 border border-slate-300 rounded outline-none focus:border-accent font-medium text-sm" /> : `₹${p.platformSellPrice.toLocaleString('en-IN')}`}
                                        </td>
                                        <td className="p-4">
                                            {isEdit ? <input type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} className="w-16 p-1.5 border border-slate-300 rounded outline-none focus:border-accent font-medium text-sm" /> : (
                                                <span className={`font-bold ${p.inventory?.stock === 0 ? 'text-danger' : p.inventory?.stock <= 10 ? 'text-yellow-600' : 'text-slate-900'}`}>
                                                    {p.inventory?.stock}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {isEdit ? (
                                                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="p-1.5 border border-slate-300 rounded outline-none focus:border-accent font-bold text-xs">
                                                    <option value="active">Active</option><option value="draft">Draft</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {p.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {isEdit ? (
                                                <div className="flex gap-2">
                                                    <button disabled={isSaving} onClick={() => submitProductUpdate(p._id)} className="bg-slate-900 text-white font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-accent transition-colors disabled:opacity-50">{isSaving ? '...' : 'Save'}</button>
                                                    <button onClick={() => setUpdatingId(null)} className="bg-slate-100 text-slate-600 font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-slate-200 transition-colors">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setUpdatingId(p._id); setEditForm({ price: p.platformSellPrice, stock: p.inventory?.stock, status: p.status }); }} className="text-accent hover:text-slate-900 p-2 rounded-lg bg-accent/10 hover:bg-slate-100 transition-colors"><Edit2 size={16} /></button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm font-bold text-slate-500">
                    Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages || 1}</span>
                </span>
                <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page === totalPages || totalPages === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
            <CreateProductModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={() => {
                    setPage(1); 

                }} 
            />
        </>
    );
};

export default AdminProducts;