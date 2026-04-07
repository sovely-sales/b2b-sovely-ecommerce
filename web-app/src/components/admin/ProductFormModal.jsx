import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Package, Save } from 'lucide-react';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';

const ProductFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState([]);
    const isEditMode = !!initialData;

    const defaultForm = {
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
    };

    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title || '',
                sku: initialData.sku || '',
                dropshipBasePrice: initialData.dropshipBasePrice || '',
                suggestedRetailPrice: initialData.suggestedRetailPrice || '',
                stock: initialData.inventory?.stock || '',
                moq: initialData.moq || '1',
                weightGrams: initialData.weightGrams || '',
                hsnCode: initialData.hsnCode || '',
                gstSlab: initialData.gstSlab || '18',
                status: initialData.status || 'active',
                descriptionHTML: initialData.descriptionHTML || '',
                categoryId:
                    initialData.categoryId?._id ||
                    initialData.categoryId ||
                    '60d5ecb54ab24c001f3e3a4b',
            });
            setImages([]);
        } else if (isOpen && !initialData) {
            setFormData(defaultForm);
            setImages([]);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 8);
        setImages(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();

        Object.keys(formData).forEach((key) => {
            if (formData[key] !== '' && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        data.append(
            'inventory',
            JSON.stringify({ stock: Number(formData.stock || 0), alertThreshold: 10 })
        );

        data.append('tieredPricing', JSON.stringify([]));

        images.forEach((image) => {
            data.append('images', image);
        });

        try {
            if (isEditMode) {
                await api.put(`/products/${initialData._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Product updated successfully');
            } else {
                await api.post('/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Product created successfully');
            }
            onSuccess();
            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            toast.error(`Failed to save product: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="custom-scrollbar max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">
                            {isEditMode ? 'Edit Catalog Item' : 'Create Catalog Item'}
                        </h3>
                        <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
                            B2B Dropship & Wholesale Pipeline
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-6">
                    {}
                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <h4 className="text-sm font-bold text-slate-900">Core Identity</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    Product Title *
                                </label>
                                <input
                                    required
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                    placeholder="e.g. Wireless Earbuds"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    SKU *
                                </label>
                                <input
                                    required
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    disabled={isEditMode}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:opacity-50"
                                    placeholder="e.g. TECH-WE-001"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    Description (HTML supported)
                                </label>
                                <textarea
                                    name="descriptionHTML"
                                    value={formData.descriptionHTML}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                    placeholder="Detailed product description..."
                                />
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                        <h4 className="text-sm font-bold text-amber-900">Pricing Strategy</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold text-amber-700 uppercase">
                                    Platform Base Cost (₹) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="dropshipBasePrice"
                                    value={formData.dropshipBasePrice}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-amber-200 p-3 text-sm font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                    placeholder="e.g. 450"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold text-amber-700 uppercase">
                                    Suggested Retail (SRP) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="suggestedRetailPrice"
                                    value={formData.suggestedRetailPrice}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-amber-200 p-3 text-sm font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                    placeholder="e.g. 999"
                                />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-amber-600">
                            The system automatically calculates the Reseller Margin % based on these
                            inputs.
                        </p>
                    </div>

                    {}
                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <h4 className="text-sm font-bold text-slate-900">Logistics & Compliance</h4>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    Current Stock *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-slate-400"
                                    placeholder="100"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    Min Order Qty *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="moq"
                                    value={formData.moq}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-slate-400"
                                    placeholder="1"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    HSN Code *
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="hsnCode"
                                    value={formData.hsnCode}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-slate-400"
                                    placeholder="1234"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    GST Slab *
                                </label>
                                <select
                                    name="gstSlab"
                                    value={formData.gstSlab}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none focus:border-slate-400"
                                >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                    <option value="28">28%</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    Dead Weight (Grams) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="weightGrams"
                                    value={formData.weightGrams}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-slate-400"
                                    placeholder="e.g. 500"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none focus:border-slate-400"
                                >
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
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
                                    ? `${images.length} new images selected`
                                    : isEditMode
                                      ? 'Upload New Images (Will replace existing)'
                                      : 'Upload Product Images (Max 8)'}
                            </span>
                        </div>
                        {isEditMode && initialData.images?.length > 0 && images.length === 0 && (
                            <p className="mt-2 text-[10px] font-bold text-slate-400">
                                Currently has {initialData.images.length} images attached. Uploading
                                new files will overwrite them.
                            </p>
                        )}
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
                            ) : isEditMode ? (
                                <Save size={16} />
                            ) : (
                                <Package size={16} />
                            )}
                            {isSubmitting
                                ? 'Saving...'
                                : isEditMode
                                  ? 'Update Product'
                                  : 'Inject into Catalog'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;
