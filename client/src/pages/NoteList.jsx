import React, { useEffect, useState } from 'react';
import NoteCard from '../components/NoteCard';
import ImportModal from '../components/ImportModal';
import api from '../services/api';
import { Plus, Upload, Search, MessageSquare, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

const NoteList = () => {
    const [notes, setNotes] = useState([]);
    const [showImport, setShowImport] = useState(false);
    const [query, setQuery] = useState('');
    const [aiAnswer, setAiAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingAi, setLoadingAi] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchNotes = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/notes');
            setNotes(data || []);
        } catch (error) {
            console.error('Failed to fetch notes', error);
            setError('Unable to load notes. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;
        try {
            await api.delete(`/notes/${id}`);
            fetchNotes();
        } catch (error) {
            console.error('Failed to delete note', error);
            alert('Failed to delete note');
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoadingAi(true);
        setAiAnswer('');
        try {
            const { data } = await api.post('/ai/search', { query });
            setAiAnswer(data.answer);
        } catch (error) {
            setAiAnswer('Failed to get AI response.');
        } finally {
            setLoadingAi(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="flex flex-col h-full relative">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
                <div className="max-w-6xl mx-auto flex flex-col gap-6">

                    {/* Header Actions */}
                    <div className="flex justify-between items-end border-b border-[var(--border)] pb-4">
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-[var(--foreground)] mb-1">My Notes</h1>
                            <p className="text-[var(--muted-foreground)] text-sm">All your thoughts in one place.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--primary)] hover:opacity-90 transition-colors text-[var(--primary-foreground)] text-sm font-medium"
                                onClick={() => navigate('/notes/new')}
                            >
                                <Plus size={16} /> New Note
                            </button>
                        </div>
                    </div>

                    {/* AI Answer Display (if any) */}
                    {aiAnswer && (
                        <div className="p-4 bg-[var(--primary)]/10 border-l-4 border-[var(--primary)] rounded-r-md animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 mb-2 text-[var(--primary)] text-sm font-semibold">
                                <MessageSquare size={16} /> <strong>AI Answer</strong>
                            </div>
                            <p className="text-[var(--foreground)] text-sm leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
                        </div>
                    )}

                    {/* Notes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {error ? (
                            <div className="col-span-full py-12 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
                                <p>{error}</p>
                                <button onClick={fetchNotes} className="mt-4 text-sm font-medium hover:underline">Try Again</button>
                            </div>
                        ) : notes.length > 0 ? (
                            notes.map(note => (
                                <NoteCard
                                    key={note._id}
                                    note={note}
                                    onClick={() => navigate(`/notes/${note._id}`)}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-500">
                                <div className="mb-2">No notes found yet.</div>
                                <button onClick={() => navigate('/notes/new')} className="text-blue-400 hover:underline">Create your first note</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Search Bar (ChatGPT Style) */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-10">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSearch} className="relative flex items-center bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl transition-all focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/20">
                        {/* Import Button (Left) */}
                        <button
                            type="button"
                            onClick={() => setShowImport(true)}
                            className="p-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] rounded-l-2xl transition-colors"
                            title="Import File"
                        >
                            <Upload size={20} />
                        </button>

                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-[var(--foreground)] placeholder-gray-500 py-3 px-2"
                            placeholder="Search your file..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />

                        {/* Send Button (Right) */}
                        <button
                            type="submit"
                            className={`p-2 mr-2 rounded-lg transition-colors ${query.trim() ? 'bg-[var(--primary)] text-white hover:opacity-90' : 'bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed'}`}
                            disabled={!query.trim() || loadingAi}
                        >
                            {loadingAi ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                        </button>
                    </form>
                    <p className="text-[10px] text-[var(--muted-foreground)] text-center mt-2">
                        AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>

            {showImport && <ImportModal onClose={() => setShowImport(false)} onSuccess={fetchNotes} />}
        </div>
    );
};

export default NoteList;
