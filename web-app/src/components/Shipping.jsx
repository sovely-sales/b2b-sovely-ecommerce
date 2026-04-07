import React from 'react';
import { Truck, Clock, Map } from 'lucide-react';

const Shipping = () => (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-24 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Truck size={32} />
            </div>
            <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-900">
                Freight & Shipping Protocol
            </h1>
            <p className="mb-8 border-b border-slate-100 pb-8 text-lg font-medium text-slate-500">
                Sovely operates a centralized fulfillment network designed for high-volume B2B
                sourcing and D2C dropshipping.
            </p>

            <div className="space-y-8 font-medium text-slate-600">
                <div className="flex gap-4">
                    <Clock className="mt-1 shrink-0 text-slate-400" />
                    <div>
                        <h3 className="mb-1 text-lg font-bold text-slate-900">
                            Dispatch Timelines (SLA)
                        </h3>
                        <p>
                            Standard orders are processed and dispatched from our fulfillment
                            centers within 48 hours of ledger confirmation. Wholesale LTL (Less Than
                            Truckload) freight may require an additional 24 hours for palletization.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Map className="mt-1 shrink-0 text-slate-400" />
                    <div>
                        <h3 className="mb-1 text-lg font-bold text-slate-900">
                            Pan-India Coverage
                        </h3>
                        <p>
                            Through our tier-1 logistics partners (Delhivery, Xpressbees, Bluedart,
                            eKart), we service over 20,000 pincodes across India. Remote or
                            high-risk pincodes may incur extended delivery timelines of 7-10
                            business days.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default Shipping;
