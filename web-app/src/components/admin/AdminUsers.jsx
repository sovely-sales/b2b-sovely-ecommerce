import React, { useState, useEffect } from 'react';
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

    const [kycFilter, setKycFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const [updatingId, setUpdatingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const [viewKycUser, setViewKycUser] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter, kycFilter]);

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
                        kycStatus: kycFilter === 'ALL' ? '' : kycFilter,
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
    }, [page, debouncedSearch, roleFilter, kycFilter]);

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

    const updateKycStatus = async (id, newStatus) => {
        let reason = null;
        if (newStatus === 'REJECTED') {
            reason = window.prompt(
                'Please enter a rejection reason for the reseller (e.g. "GSTIN Mismatch" or "Address document blurred"):',
                'Invalid documents'
            );
            if (!reason) return;
        } else if (
            !window.confirm(`Are you sure you want to mark this Reseller as ${newStatus}?`)
        ) {
            return;
        }

        try {
            await api.put(`/users/admin/${id}/kyc-status`, {
                kycStatus: newStatus,
                kycRejectionReason: reason,
            });
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === id ? { ...u, kycStatus: newStatus, kycRejectionReason: reason } : u
                )
            );
            setViewKycUser(null);
        } catch (err) {
            alert('Failed to update KYC status.');
        }
    };

    const getKycBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase">
                        <CheckCircle size={12} /> Approved
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-red-700 uppercase">
                        <XCircle size={12} /> Rejected
                    </span>
                );
            case 'PENDING':
            default:
                return (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-amber-700 uppercase">
                        <Clock size={12} /> Pending
                    </span>
                );
        }
    };

    return (
        <>
            {}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 md:col-span-2 lg:col-span-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Name, Email, GSTIN, Company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-3 w-full border-none text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <Filter size={16} className="mr-2 text-slate-400" />
                    <select
                        value={kycFilter}
                        onChange={(e) => setKycFilter(e.target.value)}
                        className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                    >
                        <option value="ALL">All KYC Statuses</option>
                        <option value="PENDING">Pending (Action Req.)</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
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
                        <option value="CUSTOMER">Reseller / Customer</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
            </div>

            {}
            <div className="mb-6 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                <div className="relative min-h-[300px] overflow-x-auto">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 text-slate-400 backdrop-blur-sm">
                            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                            <span className="text-sm font-bold">Loading Matrix...</span>
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
                                    KYC Status
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
                                                No resellers match your filters.
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
                                                {getKycBadge(u.kycStatus)}
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                {isEdit ? (
                                                    <div className="flex justify-end gap-2">
                                                        <select
                                                            value={editForm.role}
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    role: e.target.value,
                                                                })
                                                            }
                                                            className="rounded border border-slate-300 p-1.5 text-xs font-bold outline-none focus:border-slate-900"
                                                        >
                                                            <option value="CUSTOMER">
                                                                Customer / Reseller
                                                            </option>
                                                            <option value="ADMIN">Admin</option>
                                                        </select>
                                                        <button
                                                            disabled={isSaving}
                                                            onClick={() => submitUserUpdate(u._id)}
                                                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setUpdatingId(null)}
                                                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <button
                                                            onClick={() => {
                                                                setUpdatingId(u._id);
                                                                setEditForm({ role: u.role });
                                                            }}
                                                            title="Edit System Role"
                                                            className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>

                                                        {(u.accountType === 'B2B' ||
                                                            u.gstin ||
                                                            u.panNumber ||
                                                            u.companyName) && (
                                                            <button
                                                                onClick={() => setViewKycUser(u)}
                                                                title="Review Business KYC"
                                                                className="flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-200"
                                                            >
                                                                <FileSearch size={14} /> Review KYC
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
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

            {}
            {viewKycUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
                                    {viewKycUser.avatar ? (
                                        <img
                                            src={getAvatarUrl(viewKycUser.avatar)}
                                            alt={viewKycUser.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl font-black text-slate-400">
                                            {viewKycUser.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">
                                        Review Business KYC
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500">
                                        Applicant: {viewKycUser.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewKycUser(null)}
                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="custom-scrollbar max-h-[70vh] space-y-6 overflow-y-auto p-6">
                            {}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
                                    <Building2 size={16} className="text-accent" /> Identity
                                    Documents
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Company Name
                                        </p>
                                        <p className="font-medium text-slate-900">
                                            {viewKycUser.companyName || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Business PAN
                                        </p>
                                        <p className="font-mono font-medium text-slate-900 uppercase">
                                            {viewKycUser.panNumber || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            GSTIN
                                        </p>
                                        <p className="font-mono font-medium text-slate-900 uppercase">
                                            {viewKycUser.gstin || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
                                    <MapPin size={16} className="text-accent" /> Registered Address
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Street
                                        </p>
                                        <p className="font-medium text-slate-900">
                                            {viewKycUser.billingAddress?.street || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            City
                                        </p>
                                        <p className="font-medium text-slate-900">
                                            {viewKycUser.billingAddress?.city || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            State & PIN
                                        </p>
                                        <p className="font-medium text-slate-900">
                                            {viewKycUser.billingAddress?.state || 'N/A'} -{' '}
                                            {viewKycUser.billingAddress?.zip}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
                                    <Landmark size={16} className="text-accent" /> Bank Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Account Name
                                        </p>
                                        <p className="font-medium text-slate-900">
                                            {viewKycUser.bankDetails?.accountName || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Bank Name
                                        </p>
                                        <p className="font-medium text-slate-900">
                                            {viewKycUser.bankDetails?.bankName || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Account Number
                                        </p>
                                        <p className="font-mono font-medium text-slate-900">
                                            {viewKycUser.bankDetails?.accountNumber || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            IFSC Code
                                        </p>
                                        <p className="font-mono font-medium text-slate-900 uppercase">
                                            {viewKycUser.bankDetails?.ifscCode || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-b-[2rem] border-t border-slate-100 bg-slate-50 p-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-500">
                                    Current Status:
                                </span>
                                {getKycBadge(viewKycUser.kycStatus)}
                            </div>
                            <div className="flex gap-3">
                                {viewKycUser.kycStatus !== 'REJECTED' && (
                                    <button
                                        onClick={() => updateKycStatus(viewKycUser._id, 'REJECTED')}
                                        className="rounded-xl bg-red-100 px-5 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-200"
                                    >
                                        Reject KYC
                                    </button>
                                )}
                                {viewKycUser.kycStatus !== 'APPROVED' && (
                                    <button
                                        onClick={() => updateKycStatus(viewKycUser._id, 'APPROVED')}
                                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                                    >
                                        <CheckCircle size={16} /> Approve Account
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminUsers;
