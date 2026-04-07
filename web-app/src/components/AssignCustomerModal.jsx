import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Users, Save, Loader2, Trash2, Search } from 'lucide-react';
import api from '../utils/api';

const AssignCustomerModal = ({ isOpen, onClose, onAssign, currentCustomer }) => {
    const [activeTab, setActiveTab] = useState('NEW');
    const [savedCustomers, setSavedCustomers] = useState([]);
    const [isLoadingSaved, setIsLoadingSaved] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: currentCustomer?.name || '',
        phone: currentCustomer?.phone || '',
        street: currentCustomer?.address?.street || '',
        city: currentCustomer?.address?.city || '',
        state: currentCustomer?.address?.state || '',
        zip: currentCustomer?.address?.zip || '',
    });
    const [saveToAddressBook, setSaveToAddressBook] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSavedCustomers();
        }
    }, [isOpen]);

    // Auto-focus the search bar when switching to the SAVED tab
    useEffect(() => {
        if (activeTab === 'SAVED') {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else {
            setSearchQuery(''); // Clear search when leaving tab
        }
    }, [activeTab]);

    const fetchSavedCustomers = async () => {
        setIsLoadingSaved(true);
        try {
            const res = await api.get('/users/saved-customers');
            const customers = res.data.data || [];
            setSavedCustomers(customers);

            if (customers.length > 0) {
                setActiveTab('SAVED');
            } else {
                setActiveTab('NEW');
            }
        } catch (error) {
            console.error('Failed to fetch saved customers');
            setActiveTab('NEW');
        } finally {
            setIsLoadingSaved(false);
        }
    };

    const handlePinCodeChange = async (e) => {
        const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
        setFormData((prev) => ({ ...prev, zip: pin }));

        if (pin.length === 6) {
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
                const data = await response.json();
                if (data && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    setFormData((prev) => ({
                        ...prev,
                        city: postOffice.District,
                        state: postOffice.State,
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch PIN details');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await onAssign(formData, saveToAddressBook);
        setIsSubmitting(false);
        if (success) onClose();
    };

    const selectSavedCustomer = async (customer) => {
        setIsSubmitting(true);
        const success = await onAssign(
            {
                name: customer.name,
                phone: customer.phone,
                street: customer.address?.street || customer.street,
                city: customer.address?.city || customer.city,
                state: customer.address?.state || customer.state,
                zip: customer.address?.zip || customer.zip,
            },
            false
        );
        setIsSubmitting(false);
        if (success) onClose();
    };

    const handleDeleteCustomer = async (e, phone) => {
        e.stopPropagation();
        try {
            setSavedCustomers((prev) => prev.filter((c) => c.phone !== phone));
            await api.delete(`/users/saved-customers/${phone}`);
        } catch (error) {
            console.error('Failed to delete customer');
            fetchSavedCustomers();
        }
    };

    const filteredCustomers = savedCustomers.filter((cust) => {
        const query = searchQuery.toLowerCase();
        return (
            cust.name?.toLowerCase().includes(query) ||
            cust.phone?.includes(query) ||
            cust.address?.city?.toLowerCase().includes(query) ||
            cust.city?.toLowerCase().includes(query)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                {}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-5">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        <MapPin size={20} className="text-emerald-500" />
                        Assign Destination
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full bg-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-300 hover:text-slate-900"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex border-b border-slate-100 px-8 pt-5">
                    <button
                        onClick={() => setActiveTab('NEW')}
                        className={`mr-8 pb-4 text-sm font-bold transition-colors ${activeTab === 'NEW' ? 'border-b-2 border-emerald-500 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        New Address
                    </button>
                    <button
                        onClick={() => setActiveTab('SAVED')}
                        className={`flex items-center gap-1.5 pb-4 text-sm font-bold transition-colors ${activeTab === 'SAVED' ? 'border-b-2 border-emerald-500 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Users size={16} /> Saved Customers
                    </button>
                </div>

                {}
                <div className="p-8">
                    {activeTab === 'NEW' ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                                        Customer Name *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                                        Phone *
                                    </label>
                                    <input
                                        required
                                        type="tel"
                                        maxLength="10"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value.replace(/\D/g, ''),
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                                    Street Address *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) =>
                                        setFormData({ ...formData, street: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                                    placeholder="House/Flat No, Area"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                                        PIN Code *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        maxLength="6"
                                        value={formData.zip}
                                        onChange={handlePinCodeChange}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                                        placeholder="000000"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5 sm:col-span-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                                            City
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({ ...formData, city: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                                            State
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) =>
                                                setFormData({ ...formData, state: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                </div>
                            </div>
                            <label className="mt-4 flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={saveToAddressBook}
                                    onChange={(e) => setSaveToAddressBook(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                                    <Save size={16} className="text-slate-400" /> Save to my Address
                                    Book
                                </span>
                            </label>
                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-900 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:opacity-50 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    'Assign Destination'
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="flex h-[450px] flex-col">
                            {}
                            {!isLoadingSaved && savedCustomers.length > 0 && (
                                <div className="relative mb-5 shrink-0">
                                    <Search
                                        size={18}
                                        className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search by name, phone, or city..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-4 pl-12 text-sm font-medium transition-all outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                            )}

                            {}
                            <div className="custom-scrollbar -mx-2 flex-1 overflow-y-auto px-2">
                                {isLoadingSaved ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2
                                            size={32}
                                            className="animate-spin text-slate-400"
                                        />
                                    </div>
                                ) : savedCustomers.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-sm font-medium text-slate-400">
                                        No saved customers yet.
                                    </div>
                                ) : filteredCustomers.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-sm font-medium text-slate-400">
                                        No customers match your search.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredCustomers.map((cust, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => selectSavedCustomer(cust)}
                                                className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-500 hover:shadow-md"
                                            >
                                                <div className="pr-10">
                                                    <p className="text-base font-bold text-slate-900 group-hover:text-emerald-700">
                                                        {cust.name}{' '}
                                                        <span className="text-sm font-medium text-slate-500">
                                                            ({cust.phone})
                                                        </span>
                                                    </p>
                                                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
                                                        {cust.address?.street || cust.street},{' '}
                                                        {cust.address?.city || cust.city},{' '}
                                                        {cust.address?.state || cust.state} -{' '}
                                                        {cust.address?.zip || cust.zip}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) =>
                                                        handleDeleteCustomer(e, cust.phone)
                                                    }
                                                    className="absolute top-1/2 right-5 -translate-y-1/2 rounded-xl p-2.5 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
                                                    title="Delete Customer"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
export default AssignCustomerModal;
