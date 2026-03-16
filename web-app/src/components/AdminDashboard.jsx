import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Users, Package, TrendingUp, Upload } from 'lucide-react';
import Navbar from './Navbar';
import BulkUpload from './BulkUpload';

// We will create these components next!
import AdminOverview from './admin/AdminOverview';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminUsers from './admin/AdminUsers';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('orders'); 

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <AdminOverview setActiveTab={setActiveTab} />;
            case 'orders': return <AdminOrders />;
            case 'products': return <AdminProducts />;
            case 'bulk-upload': return <BulkUpload />;
            case 'users': return <AdminUsers />;
            default: return <AdminOrders />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-accent/30">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-white border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar hidden md:flex">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 px-3">Admin Control</h3>
                    {[
                        { id: 'overview', icon: TrendingUp, label: 'Overview' },
                        { id: 'orders', icon: ShoppingBag, label: 'Orders & Fulfillment' },
                        { id: 'products', icon: Package, label: 'Catalog / Products' },
                        { id: 'bulk-upload', icon: Upload, label: 'Bulk Upload' },
                        { id: 'users', icon: Users, label: 'Customers & Roles' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-accent' : 'text-slate-400'} />
                            {tab.label}
                        </button>
                    ))}
                </aside>

                {/* CONTENT AREA */}
                <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight capitalize mb-8 drop-shadow-sm">
                        {activeTab.replace('-', ' ')}
                    </h2>
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;