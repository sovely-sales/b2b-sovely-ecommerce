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
            attachment: adminAttachment,
        });
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (
            window.confirm(
                'Are you sure you want to completely delete this ticket? This action cannot be undone.'
            )
        ) {
            deleteTicketAdminMutation.mutate(id);
        }
    };

    const filteredTickets = tickets.filter((t) => {
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
        <div className="relative min-h-screen w-full px-6 py-12">
            {}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
                        <Headphones size={28} /> Support Desk Management
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                        Respond to user queries and manage system tickets
                    </p>
                </div>
                <button
                    onClick={() => setActiveTab('overview')}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
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

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-10 text-center font-medium text-slate-500"
                                    >
                                        Loading tickets...
                                    </td>
                                </tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-10 text-center font-medium text-slate-500"
                                    >
                                        No tickets found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr
                                        key={ticket._id}
                                        className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                                        onClick={() => {
                                            setSelectedTicket(ticket);
                                            setAdminNote(ticket.adminNote || '');
                                            setTicketStatus(ticket.status);
                                            setAdminAttachment(null);
                                        }}
                                    >
                                        <td className="p-5">
                                            <p className="font-mono text-xs font-bold text-slate-900">
                                                {ticket.ticketId}
                                            </p>
                                            <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                {ticket.category}
                                            </p>
                                        </td>
                                        <td className="p-5">
                                            <p className="font-bold text-slate-900">
                                                {ticket.user?.name || 'N/A'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {ticket.user?.email || 'N/A'}
                                            </p>
                                        </td>
                                        <td className="max-w-[200px] truncate p-5 font-medium text-slate-700">
                                            {ticket.subject}
                                        </td>
                                        <td className="p-5">
                                            {ticket.status === 'RESOLVED' ? (
                                                <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black tracking-wider text-emerald-600 uppercase ring-1 ring-emerald-500/20">
                                                    <CheckCircle size={12} strokeWidth={3} />{' '}
                                                    Resolved
                                                </span>
                                            ) : (
                                                <span className="flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black tracking-wider text-amber-600 uppercase ring-1 ring-amber-500/20">
                                                    <Clock size={12} strokeWidth={3} /> Open
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            <p className="text-xs font-bold text-slate-700">
                                                {format(new Date(ticket.createdAt), 'dd MMM yyyy')}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400">
                                                {format(new Date(ticket.createdAt), 'hh:mm a')}
                                            </p>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button
                                                onClick={(e) => handleDelete(e, ticket._id)}
                                                className="rounded-xl bg-white p-2 text-slate-400 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
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

            {}
            {selectedTicket && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
                    onClick={() => setSelectedTicket(null)}
                >
                    <div
                        className="scale-in-center flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8 backdrop-blur-sm">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">
                                    {selectedTicket.subject}
                                </h2>
                                <p className="mt-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                    Ticket: {selectedTicket.ticketId} • User:{' '}
                                    {selectedTicket.user?.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-400 shadow-lg transition-all hover:scale-110 hover:text-slate-900 active:scale-95"
                                title="Close Modal"
                            >
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="custom-scrollbar flex flex-1 flex-col gap-10 overflow-y-auto p-8 lg:flex-row">
                            {}
                            <div className="flex-1">
                                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>{' '}
                                    User's Issue
                                </h3>
                                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-6 text-sm leading-relaxed font-medium whitespace-pre-wrap text-slate-700 shadow-inner">
                                    {selectedTicket.description}
                                </div>
                                {selectedTicket.attachment && (
                                    <div className="mt-6">
                                        <p className="mb-3 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                            User Attachment
                                        </p>
                                        <a
                                            href={selectedTicket.attachment}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block max-w-fit overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            <img
                                                src={selectedTicket.attachment}
                                                alt="Attachment"
                                                className="max-h-64 w-auto bg-slate-50 object-contain"
                                            />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {}
                            <div className="flex-1 lg:border-l lg:border-slate-100 lg:pl-10">
                                <form onSubmit={handleResolve} className="flex h-full flex-col">
                                    <h3 className="mb-5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-indigo-600 uppercase">
                                        <CheckCircle size={16} /> Admin Resolution Form
                                    </h3>

                                    <div className="mb-5">
                                        <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                            Update Status
                                        </label>
                                        <select
                                            value={ticketStatus}
                                            onChange={(e) => setTicketStatus(e.target.value)}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
                                        >
                                            <option value="OPEN">Keep Open</option>
                                            <option value="RESOLVED">Mark as Resolved</option>
                                        </select>
                                    </div>

                                    <div className="mb-5">
                                        <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                            Resolution Note
                                        </label>
                                        <textarea
                                            rows="5"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-sm font-medium text-slate-800 transition-all outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Write your explanation or solution here..."
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="mb-6">
                                        <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                            Add Screenshot (Optional)
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-2 border-dashed border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600">
                                                <Upload size={18} /> Choose File
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        setAdminAttachment(e.target.files[0])
                                                    }
                                                />
                                            </label>
                                            {adminAttachment && (
                                                <span className="max-w-[150px] truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                                    {adminAttachment.name}
                                                </span>
                                            )}
                                        </div>
                                        {selectedTicket.adminAttachment && !adminAttachment && (
                                            <div className="mt-4">
                                                <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                                    Current Attachment
                                                </p>
                                                <a
                                                    href={selectedTicket.adminAttachment}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
                                                >
                                                    <img
                                                        src={selectedTicket.adminAttachment}
                                                        alt="Admin Attached"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto flex justify-end gap-3 border-t border-slate-100 pt-6">
                                        <button
                                            type="submit"
                                            disabled={resolveTicketMutation.isPending}
                                            className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50"
                                        >
                                            {resolveTicketMutation.isPending
                                                ? 'Saving...'
                                                : 'Save Resolution'}
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
