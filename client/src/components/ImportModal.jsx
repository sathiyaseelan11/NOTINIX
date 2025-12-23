import React, { useState } from 'react';
import { importAPI } from '../services/api';
import { Upload, FileText, Check, MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImportModal = ({ onClose, onSuccess }) => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { message, noteId }
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setError('');
        try {
            const { data } = await importAPI.uploadFile(formData);
            setResult({
                message: 'File imported successfully!',
                noteId: data._id
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChatWithNote = () => {
        if (result?.noteId) {
            // Navigate to AI Chat with context
            navigate(`/chat?attach=${result.noteId}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[#2F2F2F] bg-[#222]">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Upload size={18} className="text-blue-400" />
                        Import Content
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {result ? (
                        <div className="flex flex-col items-center text-center space-y-4 py-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                                <Check size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-lg">{result.message}</h4>
                                <p className="text-gray-400 text-sm">Your content is now part of your second brain.</p>
                            </div>

                            <div className="flex flex-col w-full gap-3 mt-4">
                                <button
                                    onClick={handleChatWithNote}
                                    className="btn w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                                >
                                    <MessageSquare size={18} />
                                    Chat with this Document
                                </button>
                                <button
                                    onClick={onClose}
                                    className="btn-secondary w-full py-2.5 rounded-lg text-gray-300 hover:bg-[#333] transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 text-red-300 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* File Upload Form */}
                            <form onSubmit={handleFileUpload} className="space-y-4">
                                <div className="border-2 border-dashed border-[#3A3A3A] rounded-xl p-8 hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-all text-center group cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".md,.txt,.pdf,.docx"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <FileText className="w-10 h-10 text-gray-500 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
                                    {file ? (
                                        <div>
                                            <p className="text-white font-medium truncate max-w-[200px] mx-auto">{file.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">Ready to upload</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-gray-300 font-medium">Click to upload file</p>
                                            <p className="text-xs text-gray-500 mt-1">Support for PDF, DOCX, TXT, MD</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="btn w-full bg-[#2563EB] hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading || !file}
                                >
                                    {loading ? 'Uploading & Parsing...' : 'Import Document'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
