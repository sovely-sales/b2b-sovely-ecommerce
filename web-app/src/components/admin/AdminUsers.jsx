import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Building2,
    ShieldCheck,
    Clock,
    Edit2,
    ChevronLeft,
    ChevronRight,
    FileSearch,
    MapPin,
    Landmark,
    X,
    AlertCircle,
    UserPlus,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api.js';
import { getAvatarUrl } from '../../utils/getAvatarUrl';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchInputRef = useRef(null);

    const [updateRequestFilter, setUpdateRequestFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const [updatingId, setUpdatingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const [reviewingUserUpdates, setReviewingUserUpdates] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [adminEditForm, setAdminEditForm] = useState({
        id: '',
        name: '',
        email: '',
        companyName: '',
        gstin: '',
        walletAdjustment: 0,
        role: 'CUSTOMER',
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        password: '',
        role: 'CUSTOMER',
        companyName: '',
        gstin: '',
        panNumber: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
    });

    // Global Keypress Listener for Search Autofocus
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Ignore if the user is already focused on an input, textarea, or content editable element
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
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter, updateRequestFilter]);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await api.get('/users/admin/all', {
                    params: {
                        page,
                        limit: 10,
                        search: debouncedSearch,
                        role: roleFilter === 'ALL' ? '' : roleFilter,
                        updateRequestStatus:
                            updateRequestFilter === 'ALL' ? '' : updateRequestFilter,
                    },
                });
                const data = res.data?.data?.users || res.data?.data?.data || res.data?.data || [];
                setUsers(Array.isArray(data) ? data : []);
                setTotalPages(
                    res.data?.data?.pagination?.pages || res.data?.data?.pagination?.totalPages || 1
                );
            } catch (err) {
                console.error('Failed to fetch users:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [page, debouncedSearch, roleFilter, updateRequestFilter]);

    const submitUserUpdate = async (id) => {
        setIsSaving(true);
        try {
            const res = await api.put(`/users/admin/${id}/role`, { role: editForm.role });
            setUsers((prev) => prev.map((u) => (u._id === id ? res.data.data : u)));
            setUpdatingId(null);
        } catch (err) {
            alert('Failed to update user role');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (u) => {
        setAdminEditForm({
            id: u._id,
            name: u.name || '',
            email: u.email || '',
            companyName: u.companyName || '',
            gstin: u.gstin || '',
            walletAdjustment: 0,
            role: u.role || 'CUSTOMER',
        });
        setIsEditModalOpen(true);
    };

    const handleAdminUpdate = async (e) => {
        e.preventDefault();

        if (
            !window.confirm(
                `Are you sure you want to save these changes? Wallet Adjustment: ₹${adminEditForm.walletAdjustment || 0}`
            )
        ) {
            return;
        }

        setIsSaving(true);
        try {
            const res = await api.put(`/users/admin/${adminEditForm.id}/update`, adminEditForm);
            setUsers((prev) => prev.map((u) => (u._id === adminEditForm.id ? res.data.data : u)));
            setIsEditModalOpen(false);
            alert('User profile updated successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateDecision = async (id, action) => {
        let reason = null;
        if (action === 'REJECT') {
            reason = window.prompt(
                'Please enter a reason for rejecting these profile updates:',
                'Invalid details provided'
            );
            if (!reason) return;
        } else if (
            !window.confirm(
                `Are you sure you want to ${action.toLowerCase()} these account changes?`
            )
        ) {
            return;
        }

        try {
            const res = await api.put(`/users/admin/${id}/update-request`, {
                action,
                rejectionReason: reason,
            });

            setUsers((prev) => prev.map((u) => (u._id === id ? res.data.data : u)));
            setReviewingUserUpdates(null);
        } catch (err) {
            alert('Failed to process update request.');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.post('/users/admin/create', newUserForm);

            setUsers((prev) => [res.data.data, ...prev]);
            setIsCreateModalOpen(false);
            setNewUserForm({
                name: '',
                phoneNumber: '',
                email: '',
                password: '',
                role: 'CUSTOMER',
                companyName: '',
                gstin: '',
                panNumber: '',
                street: '',
                city: '',
                state: '',
                zip: '',
                accountName: '',
                accountNumber: '',
                ifscCode: '',
                bankName: '',
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create user.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (id, name) => {
        if (
            !window.confirm(
                `Are you sure you want to PERMANENTLY DELETE user "${name}"? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await api.delete(`/users/admin/${id}`);
            setUsers((prev) => prev.filter((u) => u._id !== id));
            alert('User deleted successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user.');
        }
    };

    const getUpdateBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-amber-700 uppercase">
                        <Clock size={12} /> Pending Review
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-red-700 uppercase">
                        <XCircle size={12} /> Rejected
                    </span>
                );
            case 'NONE':
            default:
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                        <CheckCircle size={12} /> Up to Date
                    </span>
                );
        }
    };

    return (
        <>
            {}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 md:col-span-2 lg:col-span-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Start typing to search Name, Email, Company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-3 w-full border-none text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <Filter size={16} className="mr-2 text-slate-400" />
                    <select
                        value={updateRequestFilter}
                        onChange={(e) => setUpdateRequestFilter(e.target.value)}
                        className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                    >
                        <option value="ALL">All Updates</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="NONE">Up to Date</option>
                    </select>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <ShieldCheck size={16} className="mr-2 text-slate-400" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="CUSTOMER">Customer/Reseller</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
                >
                    <UserPlus size={18} /> Add User
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
                                    Reseller Identity
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Business Details
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Wallet Balance
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Update Status
                                </th>
                                <th className="p-4 text-right text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <ShieldCheck size={48} className="mb-4 opacity-20" />
                                            <p className="font-bold text-slate-600">
                                                No users match your filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const isEdit = updatingId === u._id;
                                    return (
                                        <tr
                                            key={u._id}
                                            className="group transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-100">
                                                        {u.avatar ? (
                                                            <img
                                                                src={getAvatarUrl(u.avatar)}
                                                                alt={u.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-400">
                                                                {u.name?.charAt(0).toUpperCase() ||
                                                                    'U'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 font-bold text-slate-900">
                                                            {u.name}
                                                            {u.role === 'ADMIN' && (
                                                                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] tracking-wider text-white uppercase">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-500">
                                                            {u.email || u.phoneNumber}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                    <Building2
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                    {u.companyName || 'Not Provided'}
                                                </div>
                                                <div className="mt-0.5 text-[11px] font-bold tracking-wider text-slate-500">
                                                    GSTIN:{' '}
                                                    <span className="font-mono text-slate-900">
                                                        {u.gstin || 'None'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="font-black text-emerald-600">
                                                    ₹
                                                    {u.walletBalance?.toLocaleString('en-IN') ||
                                                        '0.00'}
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {getUpdateBadge(u.updateRequestStatus)}
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <button
                                                        onClick={() => handleEditClick(u)}
                                                        title="Edit User Profile"
                                                        className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDeleteUser(u._id, u.name)
                                                        }
                                                        title="Delete User Permanently"
                                                        className="rounded-lg bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                    {u.updateRequestStatus === 'PENDING' && (
                                                        <button
                                                            onClick={() =>
                                                                setReviewingUserUpdates(u)
                                                            }
                                                            title="Review Account Updates"
                                                            className="flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-200"
                                                        >
                                                            <FileSearch size={14} /> Review Updates
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronLeft size={16} /> Previous
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
                    className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>

            {}

            {}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[2rem] bg-white shadow-2xl">
                        {}
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-6">
                            <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                                <UserPlus size={24} className="text-slate-400" /> Complete Reseller
                                Onboarding
                            </h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {}
                        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                            <form
                                id="createUserForm"
                                onSubmit={handleCreateUser}
                                className="space-y-8"
                            >
                                {}
                                <section>
                                    <h3 className="mb-4 text-sm font-bold tracking-wider text-slate-900 uppercase">
                                        1. Account & Security
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newUserForm.name}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={newUserForm.phoneNumber}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        phoneNumber: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={newUserForm.email}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        email: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Temporary Password *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newUserForm.password}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        password: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                System Role *
                                            </label>
                                            <select
                                                value={newUserForm.role}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        role: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            >
                                                <option value="CUSTOMER">
                                                    Reseller (Standard)
                                                </option>
                                                <option value="ADMIN">Administrator</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {}
                                <section>
                                    <h3 className="mb-4 text-sm font-bold tracking-wider text-slate-900 uppercase">
                                        2. Business Identity
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="md:col-span-3">
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.companyName}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        companyName: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                GSTIN
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.gstin}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        gstin: e.target.value.toUpperCase(),
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm uppercase outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                PAN Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.panNumber}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        panNumber: e.target.value.toUpperCase(),
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm uppercase outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {}
                                <section>
                                    <h3 className="mb-4 text-sm font-bold tracking-wider text-slate-900 uppercase">
                                        3. Registered Address
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="md:col-span-3">
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Street Address
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.street}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        street: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.city}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        city: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.state}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        state: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                ZIP / PIN
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.zip}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        zip: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {}
                                <section>
                                    <h3 className="mb-4 text-sm font-bold tracking-wider text-slate-900 uppercase">
                                        4. Bank & Payout Details
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Bank Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.bankName}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        bankName: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Account Holder Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.accountName}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        accountName: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Account Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.accountNumber}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        accountNumber: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                IFSC Code
                                            </label>
                                            <input
                                                type="text"
                                                value={newUserForm.ifscCode}
                                                onChange={(e) =>
                                                    setNewUserForm({
                                                        ...newUserForm,
                                                        ifscCode: e.target.value.toUpperCase(),
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm uppercase outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </form>
                        </div>

                        {}
                        <div className="flex shrink-0 justify-end gap-3 rounded-b-[2rem] border-t border-slate-100 bg-slate-50 p-6">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="createUserForm"
                                disabled={isSaving}
                                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-50"
                            >
                                {isSaving ? 'Provisioning Account...' : 'Create Reseller Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {reviewingUserUpdates && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
                                    {reviewingUserUpdates.avatar ? (
                                        <img
                                            src={getAvatarUrl(reviewingUserUpdates.avatar)}
                                            alt={reviewingUserUpdates.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl font-black text-slate-400">
                                            {reviewingUserUpdates.name?.charAt(0).toUpperCase() ||
                                                'U'}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">
                                        Review Account Updates
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500">
                                        User: {reviewingUserUpdates.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setReviewingUserUpdates(null)}
                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="custom-scrollbar max-h-[70vh] space-y-6 overflow-y-auto p-6">
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-amber-900 uppercase">
                                    <AlertCircle size={16} className="text-amber-600" /> Proposed
                                    Changes
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Company Name
                                        </p>
                                        <div className="mt-1 flex flex-col gap-1">
                                            <span className="text-xs font-medium text-slate-400 line-through">
                                                {reviewingUserUpdates.companyName || 'None'}
                                            </span>
                                            <span className="font-bold text-amber-700">
                                                {reviewingUserUpdates.pendingUpdates?.companyName ||
                                                    reviewingUserUpdates.companyName ||
                                                    'None'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            GSTIN
                                        </p>
                                        <div className="mt-1 flex flex-col gap-1">
                                            <span className="font-mono text-xs font-medium text-slate-400 uppercase line-through">
                                                {reviewingUserUpdates.gstin || 'None'}
                                            </span>
                                            <span className="font-mono font-bold text-amber-700 uppercase">
                                                {reviewingUserUpdates.pendingUpdates?.gstin ||
                                                    reviewingUserUpdates.gstin ||
                                                    'None'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Business PAN
                                        </p>
                                        <div className="mt-1 flex flex-col gap-1">
                                            <span className="font-mono text-xs font-medium text-slate-400 uppercase line-through">
                                                {reviewingUserUpdates.panNumber || 'None'}
                                            </span>
                                            <span className="font-mono font-bold text-amber-700 uppercase">
                                                {reviewingUserUpdates.pendingUpdates?.panNumber ||
                                                    reviewingUserUpdates.panNumber ||
                                                    'None'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-b-[2rem] border-t border-slate-100 bg-slate-50 p-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-500">
                                    Current Status:
                                </span>
                                {getUpdateBadge(reviewingUserUpdates.updateRequestStatus)}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() =>
                                        handleUpdateDecision(reviewingUserUpdates._id, 'REJECT')
                                    }
                                    className="rounded-xl bg-red-100 px-5 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-200"
                                >
                                    Reject Changes
                                </button>
                                <button
                                    onClick={() =>
                                        handleUpdateDecision(reviewingUserUpdates._id, 'APPROVE')
                                    }
                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                                >
                                    <CheckCircle size={16} /> Approve Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                                <Edit2 size={24} className="text-slate-400" /> Administrative
                                Profile Editor
                            </h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                            <form
                                id="adminEditForm"
                                onSubmit={handleAdminUpdate}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={adminEditForm.name}
                                            onChange={(e) =>
                                                setAdminEditForm({
                                                    ...adminEditForm,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={adminEditForm.email}
                                            onChange={(e) =>
                                                setAdminEditForm({
                                                    ...adminEditForm,
                                                    email: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            Company Name
                                        </label>
                                        <input
                                            type="text"
                                            value={adminEditForm.companyName}
                                            onChange={(e) =>
                                                setAdminEditForm({
                                                    ...adminEditForm,
                                                    companyName: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            GSTIN
                                        </label>
                                        <input
                                            type="text"
                                            value={adminEditForm.gstin}
                                            onChange={(e) =>
                                                setAdminEditForm({
                                                    ...adminEditForm,
                                                    gstin: e.target.value.toUpperCase(),
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm uppercase outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            System Role
                                        </label>
                                        <select
                                            value={adminEditForm.role}
                                            onChange={(e) =>
                                                setAdminEditForm({
                                                    ...adminEditForm,
                                                    role: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        >
                                            <option value="CUSTOMER">Customer / Reseller</option>
                                            <option value="ADMIN">Administrator</option>
                                        </select>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 md:col-span-2">
                                        <h3 className="mb-3 text-xs font-bold tracking-wider text-emerald-900 uppercase">
                                            Wallet Adjustment
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="mb-1 block text-[10px] font-bold text-emerald-700 uppercase">
                                                    Amount to Add / Subtract
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-emerald-600">
                                                        ₹
                                                    </span>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 500 or -200"
                                                        value={adminEditForm.walletAdjustment}
                                                        onChange={(e) =>
                                                            setAdminEditForm({
                                                                ...adminEditForm,
                                                                walletAdjustment: e.target.value,
                                                            })
                                                        }
                                                        className="w-full rounded-xl border border-emerald-200 bg-white py-2.5 pr-4 pl-8 text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="h-12 border-l border-emerald-200"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-emerald-700 uppercase">
                                                    Current Balance
                                                </span>
                                                <span className="text-xl font-black text-emerald-900">
                                                    ₹
                                                    {users
                                                        .find((u) => u._id === adminEditForm.id)
                                                        ?.walletBalance?.toLocaleString('en-IN') ||
                                                        '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-[10px] font-medium text-emerald-600 italic">
                                            * Updates will record a "Manual Adjustment" transaction
                                            in the user's wallet history.
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="flex shrink-0 justify-end gap-3 rounded-b-[2rem] border-t border-slate-100 bg-slate-50 p-6">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="adminEditForm"
                                disabled={isSaving}
                                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving Changes...' : 'Update Profile & Wallet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminUsers;
