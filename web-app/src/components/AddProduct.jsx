import React, { useState, useContext } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true
});

const AddProduct = ({ onBack }) => {
    const { user, loading } = useContext(AuthContext);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        sku: '',
        category: 'Electronics',
        subCategory: '',
        price: '',
        description: ''
    });
    
    const [images, setImages] = useState([]);
    const [isPublishing, setIsPublishing] = useState(false);

    // SECURITY GUARD: Must be logged in AND an Admin
    if (loading) return <p style={{ color: '#64748b' }}>Verifying credentials...</p>;
    
    if (!user || user.role !== 'ADMIN') {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <span style={{ fontSize: '2rem' }}>🛑</span>
                </div>
                <h2 style={{ color: '#991b1b', fontSize: '1.5rem', marginBottom: '8px' }}>Access Denied</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>You do not have the required administrator privileges to add products to the catalog.</p>
                <button onClick={onBack} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Go Back</button>
            </div>
        );
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        // For UI preview purposes, we store the file objects
        setImages(prev => [...prev, ...files]);
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsPublishing(true);
        
        try {
            // NOTE: To actually upload image files, you will need to switch this to a FormData object
            // and ensure your backend has Multer configured to accept 'multipart/form-data'.
            const payload = {
                title: formData.title,
                sku: formData.sku,
                platformSellPrice: Number(formData.price),
                description: formData.description,
                status: 'active',
                inventory: { stock: 50 } // Defaulting stock for new items
            };

            await api.post('/products/admin', payload);
            alert("Product published successfully!");
            onBack(); // Return to catalog
        } catch (error) {
            alert(error.response?.data?.message || "Failed to publish product");
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', padding: '32px', border: '1px solid #e2e8f0' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={onBack} style={{ background: '#f8fafc', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <ArrowLeft size={20} color="#475569" />
                </button>
                <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: 0, fontWeight: '700' }}>Add Product</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                
                {/* LEFT COLUMN: Images */}
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#334155', marginBottom: '16px' }}>Add Images</h3>
                    
                    {/* Drag & Drop Zone */}
                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', background: '#f8fafc', marginBottom: '24px', position: 'relative' }}>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                        <UploadCloud size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                            Drop your files here, or <span style={{ color: '#2563eb', fontWeight: '600' }}>Browse</span>
                        </p>
                    </div>

                    {/* Image List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {images.map((img, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '6px' }}>
                                        <ImageIcon size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>{img.name}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{(img.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeImage(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                    <Trash2 size={18} color="#ef4444" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Product Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Product Name</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Navy Blue Sneakers Shoe" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }} />
                    </div>

                    {/* NEW: SKU Field */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>SKU ID</label>
                        <input type="text" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. SHOE-NB-001" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', fontFamily: 'monospace' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Category</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#fff' }}>
                                <option>Men</option>
                                <option>Women</option>
                                <option>Electronics</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Sub Category</label>
                            <input type="text" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} placeholder="e.g. Shoe" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Price</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: '600' }}>₹</span>
                            <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '12px 12px 12px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Description</label>
                        <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Write a brief description about the product..." rows="5" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button type="submit" disabled={isPublishing} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '8px', fontWeight: '600', fontSize: '1rem', cursor: isPublishing ? 'not-allowed' : 'pointer', transition: 'background 0.2s', opacity: isPublishing ? 0.7 : 1 }}>
                            {isPublishing ? 'Publishing...' : 'Publish Product'}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default AddProduct;