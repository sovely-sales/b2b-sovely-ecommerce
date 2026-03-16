import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import api from '../../utils/api.js';

const CreateProductModal = ({ isOpen, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState([]);
    const [formData, setFormData] = useState({
        title: '', sku: '', platformSellPrice: '', stock: '', status: 'active', descriptionHTML: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        // Convert FileList to Array and enforce the 8 image limit on the frontend too
        const files = Array.from(e.target.files).slice(0, 8);
        setImages(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // We MUST use FormData when sending files + text
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        
        images.forEach(image => {
            data.append('images', image);
        });

        try {
            await api.post('/products/admin/create', data, {
                headers: { 'Content-Type': 'multipart/form-data' } // Tell Axios we are sending files
            });
            onSuccess(); // Refresh the table
            onClose();   // Close the modal
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            alert(`Failed to create product: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                    <h3 className="text-xl font-black text-slate-900">Create New Product</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Title *</label>
                            <input required name="title" value={formData.title} onChange={handleChange} className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-medium text-slate-900" placeholder="e.g. Wireless Headphones" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SKU *</label>
                            <input required name="sku" value={formData.sku} onChange={handleChange} className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-medium text-slate-900" placeholder="e.g. WH-001" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price (₹) *</label>
                            <input required type="number" name="platformSellPrice" value={formData.platformSellPrice} onChange={handleChange} className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-medium text-slate-900" placeholder="0.00" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Stock *</label>
                            <input required type="number" name="stock" value={formData.stock} onChange={handleChange} className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-medium text-slate-900" placeholder="100" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <textarea name="descriptionHTML" value={formData.descriptionHTML} onChange={handleChange} rows="3" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-medium text-slate-900 resize-none" placeholder="Product description..." />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Images (Max 8)</label>
                        <div className="relative flex items-center justify-center w-full p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-accent transition-colors group">
                            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="flex flex-col items-center text-slate-500 group-hover:text-accent">
                                <Upload size={24} className="mb-2" />
                                <span className="text-sm font-bold">{images.length > 0 ? `${images.length} files selected` : 'Click or drag images here'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-accent rounded-xl transition-colors disabled:opacity-50">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {isSubmitting ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProductModal;