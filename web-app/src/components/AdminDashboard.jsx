import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, Users, Package, TrendingUp, AlertCircle, DollarSign, Edit2, Search, Filter, Download, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import Navbar from './Navbar';
import AddProduct from './AddProduct'; // <-- 1. NEW IMPORT

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true
});

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('products'); 
    
    // Data States
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search & Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('ALL');
    const [priceFilter, setPriceFilter] = useState('ALL');
    const [stockFilter, setStockFilter] = useState('ALL');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Checkbox & Bulk Actions State
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Inline Editing States
    const [updatingId, setUpdatingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'overview') {
                    const [ordersRes, productsRes] = await Promise.all([
                        api.get('/orders/admin/all'),
                        api.get('/products/admin/all')
                    ]);
                    setOrders(ordersRes.data.data);
                    setProducts(productsRes.data.data);
                } else if (activeTab === 'orders') {
                    const res = await api.get('/orders/admin/all');
                    setOrders(res.data.data);
                } else if (activeTab === 'products') {
                    const res = await api.get('/products/admin/all');
                    setProducts(res.data.data);
                } else if (activeTab === 'users') {
                    const res = await api.get('/users/admin/all');
                    setUsers(res.data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const handleSidebarClick = (tabId) => {
        setActiveTab(tabId);
        setSearchQuery('');
        setFilterOption('ALL');
        setPriceFilter('ALL');
        setStockFilter('ALL');
        setUpdatingId(null);
        setSelectedProducts([]); 
    };

    // --- CHECKBOX HANDLERS ---
    const handleSelectAll = (e, currentData) => {
        if (e.target.checked) {
            setSelectedProducts(currentData.map(p => p._id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id) => {
        setSelectedProducts(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    // --- SUBMIT HANDLERS ---
    const submitOrderUpdate = async (id) => {
        setIsSaving(true);
        try {
            await api.put(`/orders/${id}/status`, { status: editForm.status, courierName: editForm.courierName, trackingNumber: editForm.trackingNumber });
            setUpdatingId(null);
            const res = await api.get('/orders/admin/all'); setOrders(res.data.data);
        } finally { setIsSaving(false); }
    };

    const submitProductUpdate = async (id) => {
        setIsSaving(true);
        try {
            await api.put(`/products/admin/${id}`, { platformSellPrice: Number(editForm.price), stock: Number(editForm.stock) });
            setUpdatingId(null);
            const res = await api.get('/products/admin/all'); setProducts(res.data.data);
        } finally { setIsSaving(false); }
    };

    const submitUserUpdate = async (id) => {
        setIsSaving(true);
        try {
            await api.put(`/users/admin/${id}/role`, { role: editForm.role });
            setUpdatingId(null);
            const res = await api.get('/users/admin/all'); setUsers(res.data.data);
        } finally { setIsSaving(false); }
    };

    // --- UI HELPERS ---
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return ' ↕';
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    const renderStockBadge = (stockAmount) => {
        if (stockAmount === 0) {
            return <span style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{width:'6px', height:'6px', borderRadius:'50%', background:'#ef4444'}}></span>Out of Stock</span>;
        }
        if (stockAmount <= 10) {
            return <span style={{ background: '#ffedd5', color: '#ea580c', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{width:'6px', height:'6px', borderRadius:'50%', background:'#ea580c'}}></span>Low Stock</span>;
        }
        return <span style={{ background: '#dcfce7', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{width:'6px', height:'6px', borderRadius:'50%', background:'#10b981'}}></span>In Stock</span>;
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'PENDING': return { bg: '#fef9c3', text: '#854d0e' };
            case 'PROCESSING': return { bg: '#e0f2fe', text: '#075985' };
            case 'SHIPPED': return { bg: '#fef08a', text: '#ca8a04' };
            case 'DELIVERED': return { bg: '#dcfce7', text: '#166534' };
            case 'CANCELLED': return { bg: '#fee2e2', text: '#991b1b' };
            default: return { bg: '#f1f5f9', text: '#475569' };
        }
    };

    const renderControls = (searchPlaceholder, filterOptions) => (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <Search size={18} color="#94a3b8" />
                <input 
                    type="text" 
                    placeholder={searchPlaceholder} 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    style={{ border: 'none', outline: 'none', marginLeft: '12px', width: '100%', fontSize: '0.95rem' }} 
                />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <Filter size={18} color="#94a3b8" style={{ marginRight: '8px' }}/>
                <select 
                    value={filterOption} 
                    onChange={(e) => setFilterOption(e.target.value)} 
                    style={{ border: 'none', outline: 'none', padding: '12px 0', background: 'transparent', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                    <option value="ALL">All Filters</option>
                    {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
        </div>
    );

    // --- TAB RENDERERS ---
    const renderOverview = () => {
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const processingOrdersCount = orders.filter(o => o.status === 'PROCESSING').length;
        const lowStockCount = products.filter(p => p.inventory?.stock > 0 && p.inventory?.stock <= 10).length;

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px' }}><DollarSign size={24} color="#166534" /></div>
                    <div><p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Total Revenue</p><h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>₹{totalRevenue.toLocaleString('en-IN')}</h3></div>
                </div>
                
                <div 
                    onClick={() => { setActiveTab('orders'); setFilterOption('PROCESSING'); }}
                    style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px' }}><ShoppingBag size={24} color="#1d4ed8" /></div>
                    <div><p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Orders Processing</p><h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{processingOrdersCount}</h3></div>
                </div>
                
                <div 
                    onClick={() => { setActiveTab('products'); setStockFilter('LOW_STOCK'); }}
                    style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px' }}><AlertCircle size={24} color="#b91c1c" /></div>
                    <div><p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Low Stock Alerts</p><h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{lowStockCount} Items</h3></div>
                </div>
            </div>
        );
    };

    const renderOrders = () => {
        const filteredData = orders.filter(o => {
            const matchesSearch = o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (o.customerId?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterOption === 'ALL' || o.status === filterOption;
            return matchesSearch && matchesFilter;
        });

        return (
            <>
                {renderControls("Search by Order ID or Customer Name...", [
                    { value: 'PENDING', label: 'Pending' }, { value: 'PROCESSING', label: 'Processing' }, 
                    { value: 'SHIPPED', label: 'Shipped' }, { value: 'DELIVERED', label: 'Delivered' }, 
                    { value: 'CANCELLED', label: 'Cancelled' }
                ])}
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.9rem' }}>
                                <th style={{ padding: '16px' }}>Order ID</th>
                                <th style={{ padding: '16px' }}>Customer</th>
                                <th style={{ padding: '16px' }}>Amount</th>
                                <th style={{ padding: '16px' }}>Status</th>
                                <th style={{ padding: '16px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No orders found matching your search.</td></tr> : null}
                            {filteredData.map(order => {
                                const isUpdating = updatingId === order._id;
                                const colors = getStatusColor(order.status);
                                return (
                                    <tr key={order._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>{order.orderId}</td>
                                        <td style={{ padding: '16px' }}>{order.customerId?.name || 'Unknown'}<br/><span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{order.customerId?.email}</span></td>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>₹{order.totalAmount}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ background: colors.bg, color: colors.text, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>{order.status}</span>
                                            {order.tracking?.trackingNumber && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{order.tracking.courierName}: {order.tracking.trackingNumber}</div>}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {isUpdating ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} style={{ padding: '6px' }}>
                                                        <option value="PENDING">Pending</option><option value="PROCESSING">Processing</option>
                                                        <option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option>
                                                        <option value="CANCELLED">Cancelled</option>
                                                    </select>
                                                    {(editForm.status === 'SHIPPED' || editForm.status === 'DELIVERED') && (
                                                        <>
                                                            <input type="text" placeholder="Courier" value={editForm.courierName || ''} onChange={(e) => setEditForm({...editForm, courierName: e.target.value})} style={{ padding: '6px' }} />
                                                            <input type="text" placeholder="AWB Number" value={editForm.trackingNumber || ''} onChange={(e) => setEditForm({...editForm, trackingNumber: e.target.value})} style={{ padding: '6px' }} />
                                                        </>
                                                    )}
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button 
                                                            disabled={isSaving} 
                                                            onClick={() => submitOrderUpdate(order._id)} 
                                                            style={{ 
                                                                background: isSaving ? '#94a3b8' : '#1b4332', 
                                                                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', 
                                                                cursor: isSaving ? 'not-allowed' : 'pointer' 
                                                            }}>
                                                            {isSaving ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button onClick={() => setUpdatingId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setUpdatingId(order._id); setEditForm({ status: order.status, courierName: order.tracking?.courierName, trackingNumber: order.tracking?.trackingNumber }); }} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Manage</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    const renderProducts = () => {
        let filteredData = products.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
            
            const stock = p.inventory?.stock || 0;
            let calculatedStatus = stock === 0 ? 'OUT_OF_STOCK' : (stock <= 10 ? 'LOW_STOCK' : 'IN_STOCK');
            const matchesStatus = filterOption === 'ALL' || calculatedStatus === filterOption;
            
            let matchesPrice = true;
            if (priceFilter === 'UNDER_500') matchesPrice = p.platformSellPrice < 500;
            if (priceFilter === 'OVER_1000') matchesPrice = p.platformSellPrice >= 1000;

            let matchesStock = true;
            if (stockFilter === 'OUT_OF_STOCK') matchesStock = stock === 0;
            if (stockFilter === 'LOW_STOCK') matchesStock = stock > 0 && stock <= 10;
            if (stockFilter === 'IN_STOCK') matchesStock = stock > 10;

            return matchesSearch && matchesStatus && matchesPrice && matchesStock;
        });

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                let aValue = sortConfig.key === 'stock' ? (a.inventory?.stock || 0) : a[sortConfig.key];
                let bValue = sortConfig.key === 'stock' ? (b.inventory?.stock || 0) : b[sortConfig.key];
                if (typeof aValue === 'string') return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            });
        }

        return (
            <>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <Search size={18} color="#94a3b8" />
                        <input type="text" placeholder="Search Title or SKU..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ border: 'none', outline: 'none', marginLeft: '12px', width: '100%', fontSize: '0.95rem' }} />
                    </div>
                    
                    <select value={filterOption} onChange={(e) => setFilterOption(e.target.value)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '500', outline: 'none', cursor: 'pointer' }}>
                        <option value="ALL">All Statuses</option>
                        <option value="IN_STOCK">In Stock</option>
                        <option value="LOW_STOCK">Low Stock</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>

                    <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '500', outline: 'none', cursor: 'pointer' }}>
                        <option value="ALL">All Prices</option>
                        <option value="UNDER_500">Under ₹500</option>
                        <option value="OVER_1000">Over ₹1,000</option>
                    </select>

                    <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '500', outline: 'none', cursor: 'pointer' }}>
                        <option value="ALL">All Stock Levels</option>
                        <option value="IN_STOCK">In Stock {"> 10"}</option>
                        <option value="LOW_STOCK">Low Stock (1-10)</option>
                        <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                    </select>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '20px 16px', width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedProducts.length === filteredData.length && filteredData.length > 0}
                                        onChange={(e) => handleSelectAll(e, filteredData)}
                                        style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                                    />
                                </th>
                                <th onClick={() => handleSort('title')} style={{ padding: '20px 16px', cursor: 'pointer', userSelect: 'none' }}>Product Name {getSortIcon('title')}</th>
                                <th onClick={() => handleSort('platformSellPrice')} style={{ padding: '20px 16px', cursor: 'pointer', userSelect: 'none' }}>Price {getSortIcon('platformSellPrice')}</th>
                                <th onClick={() => handleSort('stock')} style={{ padding: '20px 16px', cursor: 'pointer', userSelect: 'none' }}>Stock {getSortIcon('stock')}</th>
                                <th style={{ padding: '20px 16px' }}>Status</th>
                                <th style={{ padding: '20px 16px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No products found.</td></tr> : null}
                            {filteredData.map(p => {
                                const isEdit = updatingId === p._id;
                                const isSelected = selectedProducts.includes(p._id);
                                return (
                                    <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f8fafc' : '#fff', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => handleSelectProduct(p._id)}
                                                style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{p.title.length > 45 ? `${p.title.substring(0, 45)}...` : p.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>SKU: {p.sku}</div>
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '500', color: '#334155' }}>
                                            {isEdit ? <div style={{ display:'flex', alignItems:'center', gap:'4px'}}>₹<input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}/></div> : `₹${p.platformSellPrice.toLocaleString('en-IN')}`}
                                        </td>
                                        <td style={{ padding: '16px', color: '#334155' }}>
                                            {isEdit ? <input type="number" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}/> : p.inventory?.stock || 0}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {isEdit ? <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Auto-calculates...</span> : renderStockBadge(p.inventory?.stock || 0)}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {isEdit ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button disabled={isSaving} onClick={() => submitProductUpdate(p._id)} style={{ background: isSaving ? '#94a3b8' : '#6366f1', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: '500' }}>{isSaving ? 'Saving' : 'Save'}</button>
                                                    <button onClick={() => setUpdatingId(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setUpdatingId(p._id); setEditForm({ price: p.platformSellPrice, stock: p.inventory?.stock }); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#6366f1'} onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}><Edit2 size={18} /></button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    const renderUsers = () => {
        const filteredData = users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterOption === 'ALL' || u.role === filterOption;
            return matchesSearch && matchesFilter;
        });

        return (
            <>
                {renderControls("Search by Name or Email...", [
                    { value: 'CUSTOMER', label: 'Customer' }, { value: 'ADMIN', label: 'Admin' }
                ])}
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.9rem' }}>
                                <th style={{ padding: '16px' }}>Name</th>
                                <th style={{ padding: '16px' }}>Email</th>
                                <th style={{ padding: '16px' }}>Role</th>
                                <th style={{ padding: '16px' }}>Joined Date</th>
                                <th style={{ padding: '16px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No users found.</td></tr> : null}
                            {filteredData.map(u => {
                                const isEdit = updatingId === u._id;
                                return (
                                    <tr key={u._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>{u.name}</td>
                                        <td style={{ padding: '16px', color: '#64748b' }}>{u.email}</td>
                                        <td style={{ padding: '16px' }}>
                                            {isEdit ? (
                                                <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ padding: '4px' }}>
                                                    <option value="CUSTOMER">Customer</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            ) : (
                                                <span style={{ background: u.role === 'ADMIN' ? '#fee2e2' : '#e0f2fe', color: u.role === 'ADMIN' ? '#991b1b' : '#075985', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>{u.role}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px' }}>
                                            {isEdit ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        disabled={isSaving} 
                                                        onClick={() => submitUserUpdate(u._id)} 
                                                        style={{ 
                                                            background: isSaving ? '#94a3b8' : '#1b4332', 
                                                            color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', 
                                                            cursor: isSaving ? 'not-allowed' : 'pointer' 
                                                        }}>
                                                        {isSaving ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button onClick={() => setUpdatingId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setUpdatingId(u._id); setEditForm({ role: u.role }); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#1d4ed8' }}><Edit2 size={18} /></button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    // --- MAIN LAYOUT ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <Navbar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* SIDEBAR */}
                <aside style={{ width: '260px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '16px', marginLeft: '12px', fontWeight: '700' }}>Main Menu</h3>
                    {[
                        { id: 'overview', icon: TrendingUp, label: 'Overview' },
                        { id: 'orders', icon: ShoppingBag, label: 'Orders List' },
                        { id: 'products', icon: Package, label: 'Catalog / Products' },
                        { id: 'users', icon: Users, label: 'Customers & Roles' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleSidebarClick(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.2s ease', background: activeTab === tab.id ? '#eef2ff' : 'transparent', color: activeTab === tab.id ? '#6366f1' : '#64748b', textAlign: 'left' }}>
                            <tab.icon size={20} color={activeTab === tab.id ? '#6366f1' : '#94a3b8'} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                            {tab.label}
                        </button>
                    ))}
                </aside>

                {/* CONTENT AREA */}
                <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
                    
                    {/* Hide default header when adding a product, as AddProduct has its own header */}
                    {activeTab !== 'add-product' && (
                        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.8rem', color: '#0f172a', margin: 0, fontWeight: '700' }}>
                                {activeTab === 'products' ? 'Products List' : activeTab === 'orders' ? 'Orders List' : activeTab.replace('-', ' ')}
                            </h2>
                            
                            {/* Render Top Right Buttons Only on Products Tab */}
                            {activeTab === 'products' && (
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {selectedProducts.length > 0 ? (
                                        <>
                                            <button style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#334155', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <Download size={18} /> Bulk Export ({selectedProducts.length})
                                            </button>
                                            <button style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#b91c1c', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <Trash2 size={18} /> Delete Selected
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#334155', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <Download size={18} /> Export
                                            </button>
                                            {/* 2. UPDATED BUTTON CLICK HANDLER */}
                                            <button onClick={() => setActiveTab('add-product')} style={{ background: '#6366f1', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', fontWeight: '600', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
                                                <Plus size={18} /> Add Product
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. NEW ADD-PRODUCT TAB RENDER */}
                    {loading ? <p style={{ color: '#64748b' }}>Loading Data...</p> : (
                        <>
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'orders' && renderOrders()} 
                            {activeTab === 'products' && renderProducts()}
                            {activeTab === 'users' && renderUsers()}
                            {activeTab === 'add-product' && <AddProduct onBack={() => setActiveTab('products')} />}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;