import React, { useState } from 'react';
import { X, Copy, Check, Save, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const AISummaryModal = ({ summary, onClose, onSave, isLoading }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!summary && !isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#252525] border border-[#3A3A3A] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A] bg-[#202020]">
                    <div className="flex items-center gap-2 text-purple-400">
                        <Sparkles className="w-5 h-5" />
                        <h2 className="font-semibold text-white">AI Summary</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 animate-pulse">Generating summary...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <p className="text-gray-200 leading-relaxed whitespace-pre-line text-lg">
                                {summary}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isLoading && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-[#3A3A3A] bg-[#202020]">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-[#2C2C2C] hover:bg-[#333] rounded-lg transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button
                            onClick={onSave}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save to Note
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AISummaryModal;
