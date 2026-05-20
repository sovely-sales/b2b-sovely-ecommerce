import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { AuthContext } from '../../AuthContext';
import { Plus, X, Upload, CheckCircle, Clock, Edit2, Trash2, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SupportTab() {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [viewTicket, setViewTicket] = useState(null);

    const [formData, setFormData] = useState({
        category: 'General',
        subject: '',
        description: '',
    });
    const [attachment, setAttachment] = useState(null);

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['my-tickets'],
        queryFn: async () => {
            const res = await api.get('/tickets/my-tickets');
            return res.data.data;
        },
    });

    const createTicketMutation = useMutation({
        mutationFn: async (data) => {
            const formData = new FormData();
            formData.append('category', data.category);
            formData.append('subject', data.subject);
            formData.append('description', data.description);
            if (data.attachment) {
                formData.append('attachment', data.attachment);
            }
            const res = await api.post('/tickets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['my-tickets']);
            toast.success('Ticket submitted successfully');
            setIsCreateModalOpen(false);
            setFormData({ category: 'General', subject: '', description: '' });
            setAttachment(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create ticket');
        },
    });

    const editTicketMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.put(`/tickets/${data.id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['my-tickets']);
            toast.success('Ticket updated successfully');
            setIsEditModalOpen(false);
            setSelectedTicket(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update ticket');
        },
    });

    const deleteTicketMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/tickets/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['my-tickets']);
            toast.success('Ticket deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete ticket');
        },
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createTicketMutation.mutate({ ...formData, attachment });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editTicketMutation.mutate({ id: selectedTicket._id, ...formData });
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this ticket?')) {
            deleteTicketMutation.mutate(id);
        }
    };

    const openEditModal = (e, ticket) => {
        e.stopPropagation();
        setSelectedTicket(ticket);
        setFormData({
            category: ticket.category,
            subject: ticket.subject,
            description: ticket.description,
        });
        setIsEditModalOpen(true);
    };

    return (
        <div className="w-full">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
                        <Headphones size={28} className="text-indigo-600" /> Support Desk
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                        Track and manage your assistance requests
                    </p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ category: 'General', subject: '', description: '' });
                        setAttachment(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-500/25"
                >
                    <Plus size={20} strokeWidth={3} /> Raise New Ticket
                </button>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                            <tr>
                                <th className="p-5">Ticket Details</th>
                                <th className="p-5 text-center">Actions</th>
                                <th className="p-5">Subject</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Time of Listing</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="p-12 text-center font-medium text-slate-500"
                                    >
                                        Loading your tickets...
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="p-12 text-center font-medium text-slate-500"
                                    >
                                        No active tickets. Need help? Raise a new one!
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr
                                        key={ticket._id}
                                        className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                                        onClick={() => setViewTicket(ticket)}
                                    >
                                        <td className="p-5">
                                            <p className="font-mono text-xs font-bold text-slate-900">
                                                {ticket.ticketId}
                                            </p>
                                            <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                {ticket.category}
                                            </p>
                                        </td>
                                        <td
                                            className="p-5 text-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        if (ticket.status === 'RESOLVED') {
                                                            toast.error(
                                                                'Resolved tickets cannot be edited'
                                                            );
                                                            return;
                                                        }
                                                        openEditModal(e, ticket);
                                                    }}
                                                    className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 shadow-sm transition-all hover:bg-indigo-600 hover:text-white"
                                                    title="Edit Ticket"
                                                >
                                                    <Edit2 size={14} strokeWidth={3} /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, ticket._id)}
                                                    className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 shadow-sm transition-all hover:bg-red-600 hover:text-white"
                                                    title="Delete Ticket"
                                                >
                                                    <Trash2 size={14} strokeWidth={3} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                        <td className="max-w-[250px] truncate p-5 font-medium text-slate-700">
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            {(isCreateModalOpen || isEditModalOpen) && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
                    onClick={() => {
                        setIsCreateModalOpen(false);
                        setIsEditModalOpen(false);
                    }}
                >
                    <div
                        className="scale-in-center w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">
                                    {isEditModalOpen ? 'Edit Request' : 'New Support Ticket'}
                                </h2>
                                <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    We typically respond within 4-6 hours
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setIsEditModalOpen(false);
                                }}
                                className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition-all hover:rotate-90 hover:text-slate-900"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <form
                            onSubmit={isEditModalOpen ? handleEditSubmit : handleCreateSubmit}
                            className="p-8"
                        >
                            <div className="mb-5">
                                <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                    Help Category
                                </label>
                                <select
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10"
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value })
                                    }
                                >
                                    <option value="General">General Inquiry</option>
                                    <option value="Order Issue">Order Issue</option>
                                    <option value="Technical">Technical Support</option>
                                    <option value="Billing">Billing & Wallet</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="mb-5">
                                <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                    Subject Line
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-bold text-slate-900 transition-all outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10"
                                    value={formData.subject}
                                    onChange={(e) =>
                                        setFormData({ ...formData, subject: e.target.value })
                                    }
                                    placeholder="Briefly describe the issue"
                                />
                            </div>
                            <div className="mb-5">
                                <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                    Detailed Description
                                </label>
                                <textarea
                                    required
                                    rows="5"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm leading-relaxed font-medium text-slate-700 transition-all outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Please share more details so we can help you faster..."
                                ></textarea>
                            </div>
                            {!isEditModalOpen && (
                                <div className="mb-8">
                                    <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                        Image Attachment (Optional)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="group flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-600 transition-all hover:border-indigo-600 hover:bg-slate-50 hover:text-indigo-600">
                                            <Upload
                                                size={18}
                                                className="transition-transform group-hover:-translate-y-1"
                                            />{' '}
                                            Choose Screenshot
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => setAttachment(e.target.files[0])}
                                            />
                                        </label>
                                        {attachment && (
                                            <div className="flex min-w-0 flex-col">
                                                <span className="max-w-[150px] truncate text-xs font-bold text-slate-900">
                                                    {attachment.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAttachment(null)}
                                                    className="text-left text-[10px] font-bold tracking-tighter text-red-500 uppercase hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="mt-10 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setIsEditModalOpen(false);
                                    }}
                                    className="flex-1 rounded-2xl px-6 py-4 text-sm font-black text-slate-500 transition-colors hover:bg-slate-100"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        createTicketMutation.isPending ||
                                        editTicketMutation.isPending
                                    }
                                    className="flex flex-[2] items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isEditModalOpen
                                        ? editTicketMutation.isPending
                                            ? 'Syncing...'
                                            : 'Save Updates'
                                        : createTicketMutation.isPending
                                          ? 'Sending...'
                                          : 'Confirm & Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {}
            {viewTicket && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
                    onClick={() => setViewTicket(null)}
                >
                    <div
                        className="scale-in-center flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">
                                    {viewTicket.subject}
                                </h2>
                                <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    ID: {viewTicket.ticketId} • {viewTicket.category}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewTicket(null)}
                                className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-400 shadow-lg transition-all hover:text-slate-900"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
                            <div className="mb-10">
                                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>{' '}
                                    Your Request
                                </h3>
                                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-6 text-sm leading-relaxed font-medium whitespace-pre-wrap text-slate-700 shadow-inner">
                                    {viewTicket.description}
                                </div>
                                {viewTicket.attachment && (
                                    <div className="mt-6">
                                        <p className="mb-3 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                            Attached File
                                        </p>
                                        <div className="max-w-fit overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                                            <img
                                                src={viewTicket.attachment}
                                                alt="Attachment"
                                                className="max-h-64 w-auto bg-slate-50 object-contain"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {viewTicket.adminNote && (
                                <div className="rounded-[1.5rem] border border-indigo-100/50 bg-indigo-50/50 p-8 shadow-sm">
                                    <h3 className="mb-4 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-indigo-600 uppercase">
                                        <CheckCircle size={18} /> Official Resolution
                                    </h3>
                                    <div className="text-sm leading-relaxed font-bold whitespace-pre-wrap text-indigo-900">
                                        {viewTicket.adminNote}
                                    </div>
                                    {viewTicket.adminAttachment && (
                                        <div className="mt-6">
                                            <p className="mb-3 text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">
                                                Resolution Proof
                                            </p>
                                            <div className="max-w-fit overflow-hidden rounded-2xl border border-indigo-200/50 shadow-md">
                                                <img
                                                    src={viewTicket.adminAttachment}
                                                    alt="Resolution"
                                                    className="max-h-64 w-auto bg-white object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
