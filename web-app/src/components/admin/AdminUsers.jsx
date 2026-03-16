import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api.js';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterOption, setFilterOption] = useState('ALL');

    const [updatingId, setUpdatingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterOption]);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await api.get('/users/admin/all', {
                    params: {
                        page,
                        limit: 10,
                        search: debouncedSearch,
                        role: filterOption
                    }
                });
                setUsers(res.data.data.data);
                setTotalPages(res.data.data.pagination.totalPages);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [page, debouncedSearch, filterOption]);

    const submitUserUpdate = async (id) => {
        setIsSaving(true);
        try {
            const res = await api.put(`/users/admin/${id}/role`, { role: editForm.role });
            setUsers(prev => prev.map(u => u._id === id ? res.data.data : u));
            setUpdatingId(null);
        } catch (err) {
            alert("Failed to update user");
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Name or Email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none outline-none ml-3 w-full text-sm font-medium text-slate-900 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center bg-white px-4 rounded-xl border border-slate-200 shadow-sm focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                    <Filter size={18} className="text-slate-400 mr-2" />
                    <select
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value)}
                        className="border-none outline-none py-2.5 bg-transparent text-sm font-bold text-slate-700 cursor-pointer"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="CUSTOMER">Customer</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
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
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Email</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Role</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Joined Date</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && users.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No users found.</td></tr> : null}
                            {users.map(u => {
                                const isEdit = updatingId === u._id;
                                return (
                                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900 whitespace-nowrap">{u.name}</td>
                                        <td className="p-4 text-sm font-medium text-slate-500">{u.email}</td>
                                        <td className="p-4">
                                            {isEdit ? (
                                                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="p-1.5 border border-slate-300 rounded outline-none focus:border-accent font-bold text-xs">
                                                    <option value="CUSTOMER">Customer</option><option value="ADMIN">Admin</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-danger/10 text-danger' : 'bg-blue-100 text-blue-700'}`}>
                                                    {u.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            {isEdit ? (
                                                <div className="flex gap-2">
                                                    <button disabled={isSaving} onClick={() => submitUserUpdate(u._id)} className="bg-slate-900 text-white font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-accent transition-colors disabled:opacity-50">{isSaving ? '...' : 'Save'}</button>
                                                    <button onClick={() => setUpdatingId(null)} className="bg-slate-100 text-slate-600 font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-slate-200 transition-colors">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setUpdatingId(u._id); setEditForm({ role: u.role }); }} className="text-accent hover:text-slate-900 p-2 rounded-lg bg-accent/10 hover:bg-slate-100 transition-colors"><Edit2 size={16} /></button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm font-bold text-slate-500">
                    Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages || 1}</span>
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </>
    );
};

export default AdminUsers;