import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Trash2, Users, Loader2, Search, Plus, X, Building } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AddressBookTab() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
    });

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/users/saved-customers');
            setCustomers(res.data.data || []);
        } catch (error) {
            toast.error('Failed to load address book');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDelete = async (phone) => {
        if (!window.confirm('Remove this customer from your address book?')) return;
        try {
            await api.delete(`/users/saved-customers/${phone}`);
            toast.success('Customer removed');
            fetchCustomers();
        } catch (error) {
            toast.error('Failed to remove customer');
        }
    };

    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/users/saved-customers', formData);
            toast.success('Customer added to address book!');
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', street: '', city: '', state: '', zip: '' });
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save customer');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)
    );

    const inputClasses =
        'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10';
    const labelClasses =
        'mb-1 block text-[10px] font-extrabold tracking-widest text-slate-500 uppercase';

    if (loading)
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );

    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            {}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end">
                <div>
                    <h3 className="text-xl font-black text-slate-900">Dropship Directory</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Manage saved end-customer destinations for rapid dispatch.
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <div className="relative w-full sm:w-72">
                        <Search
                            size={16}
                            className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                        <Plus size={16} /> Add Customer
                    </button>
                </div>
            </div>

            {}
            {customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-24 text-center shadow-sm">
                    <div className="mb-4 rounded-full bg-slate-50 p-6">
                        <Users size={40} className="text-slate-300" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900">No Customers Saved</h4>
                    <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                        Add customers manually or save them automatically during dropship checkout.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                        + Add your first customer
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCustomers.map((customer, idx) => (
                        <div
                            key={idx}
                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                        >
                            <div>
                                <div className="mb-4 flex items-start justify-between">
                                    <h4 className="text-lg font-black text-slate-900">
                                        {customer.name}
                                    </h4>
                                    <button
                                        onClick={() => handleDelete(customer.phone)}
                                        className="rounded-lg bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <p className="flex w-fit items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-600">
                                        {customer.phone}
                                    </p>
                                    <div className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                        <MapPin
                                            size={16}
                                            className="mt-0.5 shrink-0 text-slate-400"
                                        />
                                        <p className="leading-relaxed">
                                            {customer.address.street}
                                            <br />
                                            {customer.address.city}, {customer.address.state}{' '}
                                            {customer.address.zip}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
                                <h3 className="flex items-center gap-2 font-black tracking-widest text-slate-900 uppercase">
                                    <Users size={16} className="text-indigo-600" /> Add Dropship
                                    Customer
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-full bg-slate-200/50 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveCustomer} className="p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Full Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Mobile Number *</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    phone: e.target.value.replace(/\D/g, ''),
                                                })
                                            }
                                            className={inputClasses}
                                            maxLength={10}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Street Address *</label>
                                        <input
                                            type="text"
                                            value={formData.street}
                                            onChange={(e) =>
                                                setFormData({ ...formData, street: e.target.value })
                                            }
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className={labelClasses}>City *</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({ ...formData, city: e.target.value })
                                            }
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className={labelClasses}>State *</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) =>
                                                setFormData({ ...formData, state: e.target.value })
                                            }
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>PIN Code *</label>
                                        <input
                                            type="text"
                                            value={formData.zip}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    zip: e.target.value.replace(/\D/g, ''),
                                                })
                                            }
                                            className={inputClasses}
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Customer'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
