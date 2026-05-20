import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import {
    History,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Database,
    Download,
    Upload,
    Info,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSyncHistory = () => {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['sync-history', page],
        queryFn: async () => {
            const res = await api.get(`/sync-history?page=${page}&limit=${limit}`);
            return res.data.data;
        },
    });

    const [selectedEntry, setSelectedEntry] = useState(null);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'SUCCESS':
                return {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    icon: CheckCircle,
                    ring: 'ring-emerald-600/20',
                };
            case 'FAILURE':
                return {
                    bg: 'bg-red-50',
                    text: 'text-red-700',
                    icon: XCircle,
                    ring: 'ring-red-600/20',
                };
            case 'PARTIAL_SUCCESS':
                return {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    icon: Clock,
                    ring: 'ring-amber-600/20',
                };
            default:
                return {
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    icon: Info,
                    ring: 'ring-slate-600/20',
                };
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'IMPORT':
                return Upload;
            case 'EXPORT':
                return Download;
            case 'SYNC':
                return Database;
            default:
                return FileText;
        }
    };

    const history = data?.history || [];
    const pagination = data?.pagination || {};

    return (
        <div className="flex flex-col gap-8 p-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900">
                        <div className="rounded-2xl bg-indigo-600 p-3 shadow-lg shadow-indigo-200">
                            <History size={24} className="text-white" />
                        </div>
                        Sync & Audit History
                    </h2>
                    <p className="mt-2 text-base font-medium text-slate-500">
                        Detailed logs of all catalog imports, inventory syncs, and data exports.
                    </p>
                </div>
            </header>

            <div className="overflow-hidden rounded-[2.5rem] border border-white bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                            <tr>
                                <th className="p-6">Operation</th>
                                <th className="p-6">Admin</th>
                                <th className="p-6">File Details</th>
                                <th className="p-6">Status</th>
                                <th className="p-6">Timestamp</th>
                                <th className="p-6 text-center">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {isLoading ? (
                                Array(5)
                                    .fill(0)
                                    .map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="bg-slate-50/20 p-8"></td>
                                        </tr>
                                    ))
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="rounded-full bg-slate-100 p-6 text-slate-300">
                                                <History size={48} />
                                            </div>
                                            <p className="text-lg font-bold text-slate-400">
                                                No sync history found
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                history.map((entry) => {
                                    const styles = getStatusStyles(entry.status);
                                    const StatusIcon = styles.icon;
                                    const TypeIcon = getTypeIcon(entry.type);

                                    return (
                                        <tr
                                            key={entry._id}
                                            className="group transition-all hover:bg-white/80"
                                        >
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`rounded-xl p-2.5 ${entry.type === 'EXPORT' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}
                                                    >
                                                        <TypeIcon size={18} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900">
                                                            {entry.purpose}
                                                        </p>
                                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                                            {entry.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
                                                        {entry.admin?.name?.charAt(0) || 'A'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">
                                                            {entry.admin?.name || 'Unknown Admin'}
                                                        </p>
                                                        <p className="text-[10px] font-medium text-slate-400">
                                                            {entry.admin?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1">
                                                    <p className="max-w-[180px] truncate text-xs font-bold text-slate-700">
                                                        {entry.filename || 'Direct Action'}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-400">
                                                        {entry.fileSize || 'N/A'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full ${styles.bg} px-3 py-1.5 text-[10px] font-black tracking-wider ${styles.text} uppercase ring-1 ${styles.ring}`}
                                                >
                                                    <StatusIcon size={12} strokeWidth={3} />{' '}
                                                    {entry.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <p className="text-xs font-bold text-slate-700">
                                                    {format(
                                                        new Date(entry.createdAt),
                                                        'dd MMM yyyy'
                                                    )}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    {format(
                                                        new Date(entry.createdAt),
                                                        'hh:mm:ss a'
                                                    )}
                                                </p>
                                            </td>
                                            <td className="p-6 text-center">
                                                <button
                                                    onClick={() => setSelectedEntry(entry)}
                                                    className="rounded-xl bg-slate-50 p-2.5 text-slate-400 shadow-sm transition-all hover:bg-slate-900 hover:text-white"
                                                >
                                                    <Info size={16} strokeWidth={2.5} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 p-6">
                        <p className="text-xs font-bold text-slate-500">
                            Showing <span className="text-slate-900">{history.length}</span> of{' '}
                            <span className="text-slate-900">{pagination.total}</span> entries
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`h-8 w-8 rounded-lg text-xs font-black transition-all ${page === i + 1 ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() =>
                                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                                }
                                disabled={page === pagination.totalPages}
                                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {}
            <AnimatePresence>
                {selectedEntry && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40"
                            onClick={() => setSelectedEntry(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl overflow-hidden rounded-[3rem] bg-white p-10 shadow-2xl"
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">
                                        {selectedEntry.purpose}
                                    </h3>
                                    <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                        Audit Details
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEntry(null)}
                                    className="rounded-full bg-slate-50 p-3 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                                        <p className="mb-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                            Status
                                        </p>
                                        <p className="text-lg font-black text-slate-900">
                                            {selectedEntry.status.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                                        <p className="mb-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                            File Size
                                        </p>
                                        <p className="text-lg font-black text-slate-900">
                                            {selectedEntry.fileSize || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] border border-indigo-100/50 bg-indigo-50/50 p-8">
                                    <p className="mb-4 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-indigo-600 uppercase">
                                        <Database size={14} /> Execution Metrics
                                    </p>
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        {Object.entries(selectedEntry.details || {}).map(
                                            ([key, value]) => {
                                                if (Array.isArray(value)) {
                                                    if (value.length === 0) return null;
                                                    return (
                                                        <div key={key} className="col-span-2 mt-4">
                                                            <p className="mb-2 text-[10px] font-extrabold tracking-widest text-red-500 uppercase">
                                                                Recent Errors
                                                            </p>
                                                            <div className="space-y-1">
                                                                {value.map((err, i) => (
                                                                    <p
                                                                        key={i}
                                                                        className="rounded-lg bg-red-50 p-2 text-xs font-medium text-red-600"
                                                                    >
                                                                        {err}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={key} className="col-span-1">
                                                        <p className="text-[10px] font-bold text-slate-400 capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1')}
                                                        </p>
                                                        <p className="font-black text-slate-700">
                                                            {typeof value === 'object'
                                                                ? JSON.stringify(value)
                                                                : value}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                                    <Clock size={16} className="text-slate-400" />
                                    <p className="text-xs font-bold text-slate-500">
                                        Executed on{' '}
                                        {format(new Date(selectedEntry.createdAt), 'PPPP p')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSyncHistory;
