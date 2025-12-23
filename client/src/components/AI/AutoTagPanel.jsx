import React, { useState } from 'react';
import { X, Tag, Check, Plus } from 'lucide-react';

const AutoTagPanel = ({ suggestions, currentTags, onApply, onClose, isLoading }) => {
    const [selectedTags, setSelectedTags] = useState(suggestions.map(s => s.tag));

    // Initialize selected tags when suggestions change
    React.useEffect(() => {
        if (suggestions.length > 0) {
            setSelectedTags(suggestions.map(s => s));
        }
    }, [suggestions]);

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    const handleApply = () => {
        onApply(selectedTags);
    };

    if (!suggestions.length && !isLoading) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-[#1A1A1A] border-l border-[#2F2F2F] shadow-2xl transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2F2F2F]">
                <div className="flex items-center gap-2 text-blue-400">
                    <Tag className="w-5 h-5" />
                    <h2 className="font-semibold text-white">Suggested Tags</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 h-[calc(100vh-140px)] overflow-y-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm animate-pulse">Analyzing content...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-3">AI Suggestions</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all ${selectedTags.includes(tag)
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                : 'bg-[#252525] border-[#3A3A3A] text-gray-400 hover:border-gray-500'
                                            }`}
                                    >
                                        {selectedTags.includes(tag) && <Check className="w-3 h-3" />}
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentTags.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Existing Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {currentTags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1.5 text-sm rounded-full bg-[#252525] border border-[#3A3A3A] text-gray-300"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isLoading && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2F2F2F] bg-[#1A1A1A]">
                    <button
                        onClick={handleApply}
                        disabled={selectedTags.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Apply {selectedTags.length} Tags
                    </button>
                </div>
            )}
        </div>
    );
};

export default AutoTagPanel;
