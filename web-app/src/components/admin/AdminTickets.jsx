import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { Headphones, CheckCircle, Clock, X, Search, Filter, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminTickets({ setActiveTab }) {
    const queryClient = useQueryClient();
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [ticketStatus, setTicketStatus] = useState('OPEN');
    const [adminAttachment, setAdminAttachment] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['admin-tickets', filterStatus],
        queryFn: async () => {
            const res = await api.get(`/tickets/all?status=${filterStatus}`);
            return res.data.data;
        },
    });

    const resolveTicketMutation = useMutation({
        mutationFn: async ({ id, note, status, attachment }) => {
            const formData = new FormData();
            formData.append('adminNote', note);
            formData.append('status', status);
            if (attachment) {
                formData.append('adminAttachment', attachment);
            }
            const res = await api.put(`/tickets/${id}/resolve`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-tickets']);
            toast.success('Ticket resolution updated successfully');
            setSelectedTicket(null);
            setAdminNote('');
            setAdminAttachment(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update ticket');
        },
    });

    const deleteTicketAdminMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/tickets/admin/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-tickets']);
            toast.success('Ticket deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete ticket');
        },
    });

    const handleResolve = (e) => {
        e.preventDefault();
        resolveTicketMutation.mutate({ 
            id: selectedTicket._id, 
            note: adminNote, 
            status: ticketStatus, 
            attachment: adminAttachment 
        });
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to completely delete this ticket? This action cannot be undone.')) {
            deleteTicketAdminMutation.mutate(id);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.ticketId.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.user?.name?.toLowerCase().includes(q) ||
            t.user?.email?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="w-full px-6 py-12 relative min-h-screen">
            {/* Component Header with Close Button */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Headphones size={28}/> Support Desk Management</h2>
                    <p className="text-sm font-medium text-slate-500">Respond to user queries and manage system tickets</p>
                </div>
                <button 
                    onClick={() => setActiveTab('overview')}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
                    title="Close Support Desk"
                >
                    <X size={18} /> Close
                </button>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 md:col-span-2 lg:col-span-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Ticket ID, User, or Subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-3 w-full border-none text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <Filter size={16} className="mr-2 text-slate-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full border-none bg-transparent py-3 text-sm font-bold text-slate-700 outline-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="RESOLVED">Resolved</option>
                    </select>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                            <tr>
                                <th className="p-5">Ticket</th>
                                <th className="p-5">User Details</th>
                                <th className="p-5">Subject</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Time of Listing</th>
                                <th className="p-5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-500 font-medium">Loading tickets...</td></tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-500 font-medium">No tickets found.</td></tr>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <tr 
                                        key={ticket._id} 
                                        className="cursor-pointer transition-colors hover:bg-slate-50/80 group"
                                        onClick={() => {
                                            setSelectedTicket(ticket);
                                            setAdminNote(ticket.adminNote || '');
                                            setTicketStatus(ticket.status);
                                            setAdminAttachment(null);
                                        }}
                                    >
                                        <td className="p-5">
                                            <p className="font-mono text-xs font-bold text-slate-900">{ticket.ticketId}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">{ticket.category}</p>
                                        </td>
                                        <td className="p-5">
                                            <p className="font-bold text-slate-900">{ticket.user?.name || 'N/A'}</p>
                                            <p className="text-xs text-slate-500">{ticket.user?.email || 'N/A'}</p>
                                        </td>
                                        <td className="p-5 font-medium text-slate-700 max-w-[200px] truncate">{ticket.subject}</td>
                                        <td className="p-5">
                                            {ticket.status === 'RESOLVED' ? (
                                                <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black tracking-wider text-emerald-600 uppercase ring-1 ring-emerald-500/20">
                                                    <CheckCircle size={12} strokeWidth={3} /> Resolved
                                                </span>
                                            ) : (
                                                <span className="flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black tracking-wider text-amber-600 uppercase ring-1 ring-amber-500/20">
                                                    <Clock size={12} strokeWidth={3} /> Open
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            <p className="text-xs font-bold text-slate-700">{format(new Date(ticket.createdAt), 'dd MMM yyyy')}</p>
                                            <p className="text-[10px] font-medium text-slate-400">{format(new Date(ticket.createdAt), 'hh:mm a')}</p>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button 
                                                onClick={(e) => handleDelete(e, ticket._id)}
                                                className="rounded-xl p-2 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 transition-all shadow-sm bg-white"
                                                title="Delete Ticket"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Resolve Ticket Modal */}
            {selectedTicket && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
                    onClick={() => setSelectedTicket(null)}
                >
                    <div 
                        className="w-full max-w-4xl rounded-[2rem] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] scale-in-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 p-8 bg-slate-50/50 backdrop-blur-sm shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{selectedTicket.subject}</h2>
                                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Ticket: {selectedTicket.ticketId} • User: {selectedTicket.user?.name}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedTicket(null)} 
                                className="text-slate-400 hover:text-slate-900 transition-all p-2.5 bg-white rounded-full shadow-lg border border-slate-200 hover:scale-110 active:scale-95"
                                title="Close Modal"
                            >
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col lg:flex-row gap-10">
                            {/* Left Side: User Issue */}
                            <div className="flex-1">
                                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div> User's Issue
                                </h3>
                                <div className="bg-slate-50/80 p-6 rounded-[1.5rem] text-sm font-medium text-slate-700 whitespace-pre-wrap border border-slate-100 leading-relaxed shadow-inner">
                                    {selectedTicket.description}
                                </div>
                                {selectedTicket.attachment && (
                                    <div className="mt-6">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">User Attachment</p>
                                        <a href={selectedTicket.attachment} target="_blank" rel="noreferrer" className="block max-w-fit overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                                            <img src={selectedTicket.attachment} alt="Attachment" className="max-h-64 w-auto object-contain bg-slate-50" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Resolution */}
                            <div className="flex-1 lg:border-l lg:border-slate-100 lg:pl-10">
                                <form onSubmit={handleResolve} className="flex flex-col h-full">
                                    <h3 className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <CheckCircle size={16} /> Admin Resolution Form
                                    </h3>
                                    
                                    <div className="mb-5">
                                        <label className="mb-2 block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Update Status</label>
                                        <select 
                                            value={ticketStatus}
                                            onChange={(e) => setTicketStatus(e.target.value)}
                                            className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 bg-slate-50/50"
                                        >
                                            <option value="OPEN">Keep Open</option>
                                            <option value="RESOLVED">Mark as Resolved</option>
                                        </select>
                                    </div>

                                    <div className="mb-5">
                                        <label className="mb-2 block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Resolution Note</label>
                                        <textarea 
                                            rows="5"
                                            className="w-full rounded-2xl border border-slate-200 p-5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 bg-slate-50/50"
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Write your explanation or solution here..."
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="mb-6">
                                        <label className="mb-2 block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Add Screenshot (Optional)</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-indigo-600 shadow-sm border-dashed border-2">
                                                <Upload size={18} /> Choose File
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={(e) => setAdminAttachment(e.target.files[0])}
                                                />
                                            </label>
                                            {adminAttachment && <span className="text-xs font-medium text-slate-500 truncate max-w-[150px] bg-slate-100 px-3 py-1 rounded-full">{adminAttachment.name}</span>}
                                        </div>
                                        {selectedTicket.adminAttachment && !adminAttachment && (
                                            <div className="mt-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Attachment</p>
                                                <a href={selectedTicket.adminAttachment} target="_blank" rel="noreferrer" className="block w-24 h-24 overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                                    <img src={selectedTicket.adminAttachment} alt="Admin Attached" className="w-full h-full object-cover" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-6 flex justify-end gap-3 border-t border-slate-100">
                                        <button type="submit" disabled={resolveTicketMutation.isPending} className="w-full flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50">
                                            {resolveTicketMutation.isPending ? 'Saving...' : 'Save Resolution'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
