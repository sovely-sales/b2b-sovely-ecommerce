import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    ArrowUpRight, 
    ArrowDownLeft, 
    User, 
    Shield, 
    ChevronLeft, 
    ChevronRight,
    Search,
    Calendar,
    IndianRupee
} from 'lucide-react';
import api from '../../utils/api.js';

const AdminWalletLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ totalCredits: 0, totalDebits: 0 });

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/admin/wallet-adjustments', {
                params: { page, limit: 10 }
            });
            setLogs(res.data.data.logs);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (err) {
            console.error('Failed to fetch wallet logs:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Financial Ledger Logs</h2>
                    <p className="text-sm text-slate-500 font-medium">Detailed audit of all manual wallet adjustments and balance corrections</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                <div className="relative min-h-[400px] overflow-x-auto">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                        </div>
                    )}
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                                <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Timestamp</th>
                                <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Target Reseller</th>
                                <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Performed By</th>
                                <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Adjustment</th>
                                <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Reference ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Shield size={48} className="mb-4 opacity-10" />
                                            <p className="font-bold text-slate-600">No adjustment records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{log.resellerId?.name || 'Unknown'}</span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{log.resellerId?.companyName || 'Individual'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                                    <Shield size={10} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{log.performedBy?.name || 'Admin'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className={`flex items-center gap-1.5 font-black ${log.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {log.type === 'CREDIT' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                <span>₹{log.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                Closing: ₹{log.closingBalance?.toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <code className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase">
                                                {log.referenceId}
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm font-bold text-slate-500">
                    Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages || 1}</span>
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default AdminWalletLog;
