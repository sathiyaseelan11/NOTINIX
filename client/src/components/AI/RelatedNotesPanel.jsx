import React from 'react';
import { X, Network, ExternalLink, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RelatedNotesPanel = ({ relatedNotes, onClose, isLoading }) => {
    const navigate = useNavigate();

    if (!relatedNotes.length && !isLoading) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-[#1A1A1A] border-l border-[#2F2F2F] shadow-2xl transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2F2F2F]">
                <div className="flex items-center gap-2 text-emerald-400">
                    <Network className="w-5 h-5" />
                    <h2 className="font-semibold text-white">Related Notes</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm animate-pulse">Finding connections...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {relatedNotes.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No specific connections found.</p>
                        ) : (
                            relatedNotes.map((note, index) => (
                                <div
                                    key={note.noteId}
                                    onClick={() => navigate(`/notes/${note.noteId}`)}
                                    className="block p-4 bg-[#252525] border border-[#3A3A3A] rounded-xl hover:border-emerald-500/50 hover:bg-[#2C2C2C] transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                                            {note.title}
                                        </h3>
                                        {index === 0 && (
                                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
                                                Top Match
                                            </span>
                                        )}
                                    </div>

                                    {note.commonTags && note.commonTags.length > 0 && (
                                        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                                            <Hash className="w-3 h-3 text-gray-500 shrink-0" />
                                            {note.commonTags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-xs text-gray-400 whitespace-nowrap">
                                                    {tag}
                                                </span>
                                            ))}
                                            {note.commonTags.length > 3 && (
                                                <span className="text-xs text-gray-500">+{note.commonTags.length - 3}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center text-xs text-gray-500 mt-2">
                                        <div className="flex-1 bg-[#333] h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 opacity-70"
                                                style={{ width: `${Math.min(note.score * 5, 100)}%` }} // Arbitrary scaling for demo
                                            ></div>
                                        </div>
                                        <span className="ml-2">{Math.round(note.score)}% match</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelatedNotesPanel;
