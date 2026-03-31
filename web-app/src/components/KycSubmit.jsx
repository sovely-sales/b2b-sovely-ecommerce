import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { ShieldCheck, AlertCircle, UploadCloud, Building, MapPin, Landmark } from 'lucide-react';

const KycSubmit = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    
    const [gstin, setGstin] = useState(user?.gstin || '');
    const [panNumber, setPanNumber] = useState('');

    // Address States
    const [street, setStreet] = useState(user?.billingAddress?.street || '');
    const [city, setCity] = useState(user?.billingAddress?.city || '');
    const [state, setState] = useState(user?.billingAddress?.state || '');
    const [zip, setZip] = useState(user?.billingAddress?.zip || '');

    // Bank States
    const [accountName, setAccountName] = useState(user?.bankDetails?.accountName || '');
    const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
    const [ifscCode, setIfscCode] = useState(user?.bankDetails?.ifscCode || '');
    const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');

    const [isLoading, setIsLoading] = useState(false);

    // If they are already approved, we shouldn't let them edit this freely
    const isApproved = user?.kycStatus === 'APPROVED';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            
            const response = await api.put('/users/kyc-update', {
                gstin: gstin.toUpperCase(),
                panNumber: panNumber.toUpperCase(),
                billingAddress: { street, city, state, zip },
                bankDetails: {
                    accountName,
                    accountNumber,
                    ifscCode: ifscCode.toUpperCase(),
                    bankName,
                },
            });

            if (response.data.success) {
                toast.success('KYC Details submitted successfully! Awaiting Admin approval.');
                
                window.location.href = '/my-account';
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit KYC details');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 py-12 font-sans md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            Business KYC
                        </h1>
                        <p className="font-medium text-slate-500">
                            Complete your verification to unlock wholesale pricing.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="transition-hover rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {}
                {isApproved ? (
                    <div className="mb-8 flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                        <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-emerald-800">KYC Approved</h3>
                            <p className="text-sm font-medium text-emerald-600">
                                Your business identity is verified. Your details are securely
                                locked.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                            <AlertCircle size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-800">
                                Verification Pending
                            </h3>
                            <p className="text-sm font-medium text-amber-600">
                                Please fill out all required details below so our team can verify
                                your business account.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {}
                    <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <Building className="text-accent" size={24} />
                            <h2 className="text-xl font-bold text-slate-900">Business Identity</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    GSTIN
                                </label>
                                <input
                                    type="text"
                                    disabled={isApproved}
                                    value={gstin}
                                    onChange={(e) => setGstin(e.target.value)}
                                    maxLength="15"
                                    placeholder="22AAAAA0000A1Z5"
                                    className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 uppercase outline-none focus:ring-1 disabled:opacity-60"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Business PAN *
                                </label>
                                <input
                                    type="text"
                                    disabled={isApproved}
                                    required
                                    value={panNumber}
                                    onChange={(e) => setPanNumber(e.target.value)}
                                    maxLength="10"
                                    placeholder="ABCDE1234F"
                                    className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 uppercase outline-none focus:ring-1 disabled:opacity-60"
                                />
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <MapPin className="text-accent" size={24} />
                            <h2 className="text-xl font-bold text-slate-900">Registered Address</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Street Address *
                                </label>
                                <input
                                    type="text"
                                    disabled={isApproved}
                                    required
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    placeholder="123 Wholesale Market"
                                    className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-60"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    disabled={isApproved}
                                    required
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Mumbai"
                                    className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-60"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        disabled={isApproved}
                                        required
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        placeholder="Maharashtra"
                                        className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-60"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        PIN Code *
                                    </label>
                                    <input
                                        type="text"
                                        disabled={isApproved}
                                        required
                                        value={zip}
                                        onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
                                        maxLength="6"
                                        placeholder="400001"
                                        className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Bank Details */}
                    <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <Landmark className="text-accent" size={24} />
                            <h2 className="text-xl font-bold text-slate-900">Bank Details</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Account Holder Name *
                                </label>
                                <input
                                    type="text"
                                    disabled={isApproved}
                                    required
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    placeholder="As per bank records"
                                    className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-60"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Account Number *
                                </label>
                                <input
                                    type="text"
                                    disabled={isApproved}
                                    required
                                    value={accountNumber}
                                    onChange={(e) =>
                                        setAccountNumber(e.target.value.replace(/\D/g, ''))
                                    }
                                    placeholder="00000000000"
                                    className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-60"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    IFSC Code *
                                </label>
                                <input
                                    type="text"
                                    disabled={isApproved}
                                    required
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value)}
                                    maxLength="11"
                                    placeholder="HDFC0001234"
                                    className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 uppercase outline-none focus:ring-1 disabled:opacity-60"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Bank Name *
                                </label>
                                <input
                                    type="text"
                                    disabled={isApproved}
                                    required
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="HDFC Bank"
                                    className="focus:border-accent focus:ring-accent w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-60"
                                />
                            </div>
                        </div>
                    </div>

                    {!isApproved && (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="hover:bg-accent hover:shadow-accent/30 w-full rounded-2xl bg-slate-900 py-4 font-bold tracking-wide text-white shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? 'Submitting Details...' : 'Submit KYC for Review'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default KycSubmit;
