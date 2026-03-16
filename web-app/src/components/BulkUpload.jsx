import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api.js';

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
        <div className="max-w-3xl bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100">
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-accent/10 rounded-full mb-4">
                    <Upload size={32} className="text-accent" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Bulk Product Upload</h2>
                <p className="text-slate-500 font-medium">Upload your product catalog using a CSV or Excel file.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div
                    onClick={handleDownloadTemplate}
                    className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer text-center transition-all bg-slate-50 hover:bg-accent/5 hover:border-accent group"
                >
                    <Download size={28} className="mx-auto mb-4 text-slate-400 group-hover:text-accent transition-colors" />
                    <h4 className="font-extrabold text-slate-900 mb-2">Step 1: Get Template</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">Download our empty sample CSV to ensure correct formatting.</p>
                </div>

                <div className="p-8 border-2 border-slate-100 rounded-[2rem] text-center bg-white shadow-sm flex flex-col items-center justify-center">
                    <FileText size={28} className="mx-auto mb-4 text-slate-400" />
                    <h4 className="font-extrabold text-slate-900 mb-4">Step 2: Fill & Upload</h4>
                    <input
                        type="file"
                        id="file-upload"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-upload"
                        className="inline-block px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors text-sm w-full truncate"
                    >
                        {file ? file.name : "Choose File"}
                    </label>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/20 rounded-2xl mb-8 text-danger animate-[fadeIn_0.3s_ease-out]">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            {message && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl mb-8 text-green-700 animate-[fadeIn_0.3s_ease-out]">
                    <CheckCircle size={20} className="flex-shrink-0" />
                    <span className="text-sm font-bold">{message}</span>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-wide hover:bg-accent transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-accent/30"
            >
                {uploading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    "Upload and Sync Catalog"
                )}
            </button>

            <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                <h5 className="font-extrabold text-amber-900 flex items-center gap-2 mb-3">
                    <AlertCircle size={18} /> Data Formatting Tips
                </h5>
                <ul className="list-disc list-outside pl-5 text-sm font-medium text-amber-800 leading-relaxed space-y-1">
                    <li>The <strong className="font-black">SKU</strong> is used to identify products; existing SKUs will be updated.</li>
                    <li>For categories, use <strong className="font-black">Level 1 {">"} Level 2</strong> format (e.g., Electronics {">"} Phones).</li>
                    <li>Multiple images can be added by using the same Handle across multiple rows.</li>
                </ul>
            </div>
        </div>
    );
};

export default BulkUpload;