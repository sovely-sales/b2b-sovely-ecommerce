import React from 'react';
import { RotateCcw, AlertTriangle, BadgeIndianRupee } from 'lucide-react';

const Returns = () => (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-24 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <RotateCcw size={32} />
            </div>
            <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-900">
                Returns & Claim Operations
            </h1>
            <p className="mb-8 border-b border-slate-100 pb-8 text-lg font-medium text-slate-500">
                Clear guidelines for handling defective inventory, transit damages, and Return to
                Origin (RTO) procedures.
            </p>

            <div className="space-y-8 font-medium text-slate-600">
                <div className="flex gap-4">
                    <AlertTriangle className="mt-1 shrink-0 text-slate-400" />
                    <div>
                        <h3 className="mb-1 text-lg font-bold text-slate-900">
                            Defective or Incorrect SKUs
                        </h3>
                        <p>
                            Claims for damaged or incorrect items must be raised via the Support
                            Dashboard within 48 hours of the delivery timestamp. A clear unboxing
                            video is strictly mandatory to process replacement or ledger credit.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <BadgeIndianRupee className="mt-1 shrink-0 text-slate-400" />
                    <div>
                        <h3 className="mb-1 text-lg font-bold text-slate-900">
                            RTO (Return to Origin) Protocol
                        </h3>
                        <p>
                            In the event of customer rejection or failed delivery, the package is
                            marked as RTO. The forward and return shipping freight costs will be
                            debited from the merchant's wallet. The base product cost is credited
                            back once inventory safely reaches our facility.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default Returns;
