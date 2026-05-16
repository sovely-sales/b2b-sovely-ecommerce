import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Phone, Building2, TrendingUp, Search, Loader2, Copy, CheckCircle2, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminAccessRequests = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminPasswordInput, setAdminPasswordInput] = useState('');
    const [isPermanent, setIsPermanent] = useState(true);
    const [expirationDate, setExpirationDate] = useState('');
    
    const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
    const [newCredentials, setNewCredentials] = useState(null);

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
            const response = await api.get(`/access-requests${query}`);
            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching access requests:', error);
            toast.error('Failed to load access requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const handleStatusUpdate = async (id, newStatus) => {
        if (newStatus === 'APPROVED') {
            const req = requests.find(r => r._id === id);
            setSelectedRequest(req);
            setAdminPasswordInput('');
            setIsPermanent(true);
            setExpirationDate('');
            setApprovalModalOpen(true);
            return;
        }
        await updateStatusApiCall(id, newStatus);
    };

    const updateStatusApiCall = async (id, newStatus, password = null, validityDate = null) => {
        try {
            const payload = { status: newStatus };
            if (password) payload.password = password;
            if (validityDate) payload.validityDate = validityDate;

            const response = await api.put(`/access-requests/${id}/status`, payload);
            if (response.data.success) {
                toast.success(response.data.message || `Request marked as ${newStatus}`);
                
                if (newStatus === 'REJECTED') {
                    setRequests((prev) => prev.filter((req) => req._id !== id));
                } else {
                    setRequests((prev) =>
                        prev.map((req) =>
                            req._id === id ? { ...req, status: newStatus } : req
                        )
                    );
                }

                if (newStatus === 'APPROVED' && response.data.credentials) {
                    setNewCredentials(response.data.credentials);
                    setApprovalModalOpen(false);
                    setCredentialsModalOpen(true);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const filteredRequests = requests.filter(
        (req) =>
            req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.phone && req.phone.includes(searchTerm))
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'REVIEWED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'REJECTED':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    if (!isLoading && requests.length === 0 && searchTerm === '' && statusFilter === 'ALL') {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Access Requests</h2>
                    <p className="text-sm text-slate-500">
                        Manage onboarding requests from potential B2B partners
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="relative w-full sm:w-96">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20"
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                statusFilter === status
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Applicant</th>
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4">Est. Volume</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                                        Loading requests...
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No access requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req._id} className="transition-colors hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600">
                                                    {req.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {req.name}
                                                    </p>
                                                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                                        <Mail size={12} /> {req.email}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                        <Phone size={12} /> {req.phone}
                                                    </div>
                                                    <div className="mt-1 text-[10px] text-slate-400">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-medium text-slate-900">
                                                <Building2 size={14} className="text-slate-400" />
                                                {req.company}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium whitespace-nowrap">
                                                <TrendingUp size={14} className="text-emerald-500" />
                                                {req.volume === 'startup' ? '0 - 50 orders/mo' :
                                                 req.volume === 'growing' ? '50 - 500 orders/mo' :
                                                 req.volume === 'scale' ? '500 - 5,000 orders/mo' :
                                                 req.volume === 'enterprise' ? '5,000+ orders/mo' : req.volume}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="max-w-xs text-xs text-slate-600 line-clamp-3" title={req.message}>
                                                {req.message}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                                                    req.status
                                                )}`}
                                            >
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <select
                                                    value={req.status}
                                                    onChange={(e) =>
                                                        handleStatusUpdate(req._id, e.target.value)
                                                    }
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                                >
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="REVIEWED">REVIEWED</option>
                                                    <option value="APPROVED">APPROVED</option>
                                                    <option value="REJECTED">REJECTED</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approval Password Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {approvalModalOpen && selectedRequest && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Approve & Create Account</h3>
                                    </div>
                                    <button onClick={() => setApprovalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-sm text-slate-600">
                                        You are about to approve access for <span className="font-bold text-slate-900">{selectedRequest.name}</span>. Please assign a secure password for their new B2B account.
                                    </p>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Assign Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={adminPasswordInput}
                                                onChange={(e) => setAdminPasswordInput(e.target.value)}
                                                placeholder="Enter secure password"
                                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Account Validity</label>
                                        <div className="flex items-center gap-3 mb-2">
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isPermanent}
                                                    onChange={(e) => {
                                                        setIsPermanent(e.target.checked);
                                                        if (e.target.checked) setExpirationDate('');
                                                    }}
                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="text-slate-700 font-medium">Permanent (No Expiry)</span>
                                            </label>
                                        </div>
                                        {!isPermanent && (
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={expirationDate}
                                                onChange={(e) => setExpirationDate(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            onClick={() => setApprovalModalOpen(false)}
                                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => updateStatusApiCall(selectedRequest._id, 'APPROVED', adminPasswordInput, isPermanent ? 'permanent' : expirationDate)}
                                            disabled={adminPasswordInput.length < 6}
                                            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50"
                                        >
                                            Confirm & Create
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Credentials Share Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {credentialsModalOpen && newCredentials && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-emerald-50">
                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Account Created!</h3>
                                        <p className="text-xs font-medium text-emerald-700">Share these credentials with the user.</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Login ID / Email</p>
                                                <p className="font-mono text-sm font-bold text-slate-900">{newCredentials.email}</p>
                                            </div>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(newCredentials.email); toast.success('Email copied!'); }}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        <div className="h-px bg-slate-200 w-full"></div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</p>
                                                <p className="font-mono text-sm font-bold text-slate-900">{newCredentials.password}</p>
                                            </div>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(newCredentials.password); toast.success('Password copied!'); }}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCredentialsModalOpen(false);
                                            setNewCredentials(null);
                                        }}
                                        className="w-full mt-4 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default AdminAccessRequests;
