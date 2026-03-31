import React, { useState } from 'react';
import { X, Upload, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '../../utils/api.js';

const CreateProductModal = ({ isOpen, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState([]);

    
    const [formData, setFormData] = useState({
        title: '',
        sku: '',
        dropshipBasePrice: '',
        suggestedRetailPrice: '',
        stock: '',
        moq: '1',
        weightGrams: '',
        hsnCode: '',
        gstSlab: '18',
        status: 'active',
        descriptionHTML: '',
        categoryId: '60d5ecb54ab24c001f3e3a4b', 
    });

    
    const [tiers, setTiers] = useState([]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 8);
        setImages(files);
    };

    const addTier = () => {
        setTiers([...tiers, { minQty: '', maxQty: '', pricePerUnit: '' }]);
    };

    const removeTier = (index) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const updateTier = (index, field, value) => {
        const newTiers = [...tiers];
        newTiers[index][field] = value;
        setTiers(newTiers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();

        // Append standard string fields
        Object.keys(formData).forEach((key) => {
            data.append(key, formData[key]);
        });

        // Append the inventory object specifically formatted for Mongoose
        data.append(
            'inventory',
            JSON.stringify({ stock: Number(formData.stock), alertThreshold: 10 })
        );

        
        if (tiers.length > 0) {
            
            const cleanedTiers = tiers.map((t) => ({
                minQty: Number(t.minQty),
                maxQty: t.maxQty ? Number(t.maxQty) : undefined,
                pricePerUnit: Number(t.pricePerUnit),
            }));
            data.append('tieredPricing', JSON.stringify(cleanedTiers));
        }

        images.forEach((image) => {
            data.append('images', image);
        });

        try {
            
            await api.post('/products', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSuccess();
            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            alert(`Failed to create B2B product: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="custom-scrollbar max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Create Catalog Item</h3>
                        <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
                            B2B Dropship & Wholesale Pipeline
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-6">
                    {}
                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <h4 className="text-sm font-bold text-slate-900">Core Identity</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none"
                                placeholder="Product Title *"
                            />
                            <input
                                required
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className="rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none"
                                placeholder="SKU *"
                            />
                            <textarea
                                name="descriptionHTML"
                                value={formData.descriptionHTML}
                                onChange={handleChange}
                                rows="2"
                                className="resize-none rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none md:col-span-2"
                                placeholder="Description (Optional)"
                            />
                        </div>
                    </div>

                    {}
                    <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                        <h4 className="text-sm font-bold text-amber-900">
                            Dropship Pricing (Per Unit)
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-amber-700 uppercase">
                                    Platform Base Cost (₹) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="dropshipBasePrice"
                                    value={formData.dropshipBasePrice}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-amber-200 p-3 text-sm font-bold outline-none"
                                    placeholder="e.g. 450"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-amber-700 uppercase">
                                    Suggested Retail (SRP) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="suggestedRetailPrice"
                                    value={formData.suggestedRetailPrice}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-amber-200 p-3 text-sm font-bold outline-none"
                                    placeholder="e.g. 999"
                                />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-amber-600">
                            The system will automatically calculate the Estimated Margin % based on
                            these two values.
                        </p>
                    </div>

                    {}
                    <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-indigo-900">
                                Wholesale Volume Tiers (Optional)
                            </h4>
                            <button
                                type="button"
                                onClick={addTier}
                                className="flex items-center gap-1 rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-200"
                            >
                                <Plus size={14} /> Add Tier
                            </button>
                        </div>

                        {tiers.length === 0 ? (
                            <p className="text-xs font-medium text-indigo-400">
                                No volume discounts added. Buyers will pay the Base Cost regardless
                                of quantity.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {tiers.map((tier, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-white p-3"
                                    >
                                        <input
                                            required
                                            type="number"
                                            placeholder="Min Qty"
                                            value={tier.minQty}
                                            onChange={(e) =>
                                                updateTier(idx, 'minQty', e.target.value)
                                            }
                                            className="w-1/4 rounded border border-slate-200 p-2 text-sm outline-none"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max Qty (Opt)"
                                            value={tier.maxQty}
                                            onChange={(e) =>
                                                updateTier(idx, 'maxQty', e.target.value)
                                            }
                                            className="w-1/4 rounded border border-slate-200 p-2 text-sm outline-none"
                                        />
                                        <input
                                            required
                                            type="number"
                                            placeholder="Price /ea (₹)"
                                            value={tier.pricePerUnit}
                                            onChange={(e) =>
                                                updateTier(idx, 'pricePerUnit', e.target.value)
                                            }
                                            className="w-2/4 rounded border border-slate-200 p-2 text-sm font-bold outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeTier(idx)}
                                            className="rounded bg-red-50 p-2 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {}
                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <h4 className="text-sm font-bold text-slate-900">Logistics & Compliance</h4>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
                                    Initial Stock *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none"
                                    placeholder="100"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
                                    Dropship MOQ *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="moq"
                                    value={formData.moq}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none"
                                    placeholder="1"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
                                    HSN Code *
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="hsnCode"
                                    value={formData.hsnCode}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none"
                                    placeholder="1234"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
                                    GST Slab *
                                </label>
                                <select
                                    name="gstSlab"
                                    value={formData.gstSlab}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none"
                                >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                    <option value="28">28%</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
                                    Dead Weight (Grams) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="weightGrams"
                                    value={formData.weightGrams}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none"
                                    placeholder="e.g. 500"
                                />
                            </div>
                        </div>
                    </div>

                    {}
                    <div>
                        <div className="group relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 transition-colors hover:border-slate-400">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                            <Upload
                                size={24}
                                className="mb-2 text-slate-400 transition-colors group-hover:text-slate-600"
                            />
                            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700">
                                {images.length > 0
                                    ? `${images.length} images selected`
                                    : 'Upload Product Images (Max 8)'}
                            </span>
                        </div>
                    </div>

                    {}
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Package size={16} />
                            )}
                            {isSubmitting ? 'Creating...' : 'Inject into Catalog'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProductModal;
