import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    withCredentials: true
});

const BulkUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage(null);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setMessage(null);
        setError(null);

        try {
            const res = await api.post('/products/admin/bulk-upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage(`Success! ${res.data.data.total} products processed.`);
            setFile(null);
            // Reset file input
            document.getElementById('file-upload').value = '';
        } catch (err) {
            setError(err.response?.data?.message || "Failed to upload file.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.open('http://localhost:8000/api/v1/products/admin/template', '_blank');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '16px', background: '#f0fdf4', borderRadius: '50%', marginBottom: '16px' }}>
                    <Upload size={32} color="#1b4332" />
                </div>
                <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 8px 0' }}>Bulk Product Upload</h2>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Upload your product catalog using a CSV or Excel file.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div
                    onClick={handleDownloadTemplate}
                    style={{
                        padding: '24px', border: '2px dashed #e2e8f0', borderRadius: '12px', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.2s ease', backgroundColor: '#f8fafc'
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#1b4332'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                >
                    <Download size={24} color="#64748b" style={{ marginBottom: '12px' }} />
                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>Step 1: Get Template</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Download our empty sample CSV to ensure correct formatting.</p>
                </div>

                <div
                    style={{
                        padding: '24px', border: '2px solid #e2e8f0', borderRadius: '12px',
                        textAlign: 'center', backgroundColor: '#fff'
                    }}
                >
                    <FileText size={24} color="#64748b" style={{ marginBottom: '12px' }} />
                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>Step 2: Fill & Upload</h4>
                    <input
                        type="file"
                        id="file-upload"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <label
                        htmlFor="file-upload"
                        style={{
                            display: 'inline-block', padding: '8px 16px', background: '#f1f5f9',
                            color: '#475569', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500',
                            cursor: 'pointer', marginTop: '8px', border: '1px solid #e2e8f0'
                        }}
                    >
                        {file ? file.name : "Choose File"}
                    </label>
                </div>
            </div>

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#fef2f2', borderRadius: '8px', marginBottom: '24px', color: '#991b1b' }}>
                    <AlertCircle size={20} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{error}</span>
                </div>
            )}

            {message && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '24px', color: '#166534' }}>
                    <CheckCircle size={20} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{message}</span>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={uploading || !file}
                style={{
                    width: '100%', padding: '14px', background: (uploading || !file) ? '#94a3b8' : '#1b4332',
                    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600',
                    cursor: (uploading || !file) ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}
            >
                {uploading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                    </>
                ) : "Upload and Sync Catalog"}
            </button>

            <div style={{ marginTop: '24px', padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> Data Tips:
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#b45309', lineHeight: '1.6' }}>
                    <li>The <b>SKU</b> is used to identify products; existing SKUs will be updated.</li>
                    <li>For categories, use <b>Level 1 &gt; Level 2</b> format (e.g., Electronics &gt; Phones).</li>
                    <li>Multiple images can be added by using the same Handle across multiple rows.</li>
                </ul>
            </div>
        </div>
    );
};

export default BulkUpload;
