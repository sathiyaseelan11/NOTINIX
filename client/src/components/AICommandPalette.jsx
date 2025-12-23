import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, FileText, CheckSquare, FolderKanban, FileCode,
    Sparkles, Network, Calendar, Clock, X
} from 'lucide-react';
import { useCommandPalette } from '../context/CommandPaletteContext';
import api from '../services/api';

const AICommandPalette = () => {
    const { isOpen, close, executeCommand, commands } = useCommandPalette();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [notes, setNotes] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            fetchNotes();
        } else {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                close();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, close]);

    useEffect(() => {
        filterResults();
    }, [query, notes, commands]);

    const fetchNotes = async () => {
        try {
            const response = await api.get('/notes');
            setNotes(response.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const filterResults = () => {
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
            // Show default commands
            const defaultCommands = getDefaultCommands();
            setResults(defaultCommands);
            return;
        }

        // Search notes
        const noteResults = notes
            .filter(note =>
                note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery) ||
                note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            )
            .slice(0, 5)
            .map(note => ({
                id: `note-${note._id}`,
                type: 'note',
                title: note.title,
                subtitle: note.content.substring(0, 60) + '...',
                icon: <FileText className="w-4 h-4" />,
                action: () => navigate(`/notes/${note._id}`),
            }));

        // Search commands
        const commandResults = commands
            .filter(cmd =>
                cmd.name.toLowerCase().includes(lowerQuery) ||
                cmd.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery))
            )
            .slice(0, 5)
            .map(cmd => ({
                id: cmd.id,
                type: 'command',
                title: cmd.name,
                subtitle: cmd.description,
                icon: cmd.icon,
                action: cmd.action,
            }));

        // Combine results
        setResults([...commandResults, ...noteResults]);
        setSelectedIndex(0);
    };

    const getDefaultCommands = () => [
        {
            id: 'create-note',
            type: 'command',
            title: 'Create New Note',
            subtitle: 'Start a new note',
            icon: <FileText className="w-4 h-4" />,
            action: () => navigate('/notes'),
        },
        {
            id: 'create-task',
            type: 'command',
            title: 'Create New Task',
            subtitle: 'Add a task to your list',
            icon: <CheckSquare className="w-4 h-4" />,
            action: () => navigate('/tasks'),
        },
        {
            id: 'create-project',
            type: 'command',
            title: 'Create New Project',
            subtitle: 'Start a new project',
            icon: <FolderKanban className="w-4 h-4" />,
            action: () => navigate('/projects'),
        },
        {
            id: 'view-graph',
            type: 'command',
            title: 'Knowledge Graph',
            subtitle: 'Visualize your knowledge',
            icon: <Network className="w-4 h-4" />,
            action: () => navigate('/graph'),
        },
        {
            id: 'view-templates',
            type: 'command',
            title: 'Templates Library',
            subtitle: 'Browse note templates',
            icon: <FileCode className="w-4 h-4" />,
            action: () => navigate('/templates'),
        },
        {
            id: 'ai-chat',
            type: 'command',
            title: 'AI Knowledge Chat',
            subtitle: 'Chat with your knowledge base',
            icon: <Sparkles className="w-4 h-4" />,
            action: () => navigate('/chat'),
        },
    ];

    const handleSelect = (result) => {
        if (result.action) {
            result.action();
            close();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-[var(--card-border)]">
                    <Search className="w-5 h-5 text-[var(--muted-foreground)]" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search notes, commands, or type to search..."
                        className="flex-1 bg-transparent text-[var(--foreground)] placeholder-gray-500 outline-none"
                    />
                    <button
                        onClick={close}
                        className="p-1 hover:bg-[var(--secondary)] rounded transition-colors"
                    >
                        <X className="w-4 h-4 text-[var(--muted-foreground)]" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {query ? 'No results found' : 'Start typing to search...'}
                        </div>
                    ) : (
                        <div className="p-2">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect(result)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${index === selectedIndex
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    <div className={`p-2 rounded ${index === selectedIndex ? 'bg-white/20' : 'bg-[var(--background)]'
                                        }`}>
                                        {result.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {result.title}
                                        </div>
                                        {result.subtitle && (
                                            <div className={`text-sm truncate ${index === selectedIndex ? 'text-white/70' : 'text-[var(--muted-foreground)]'
                                                }`}>
                                                {result.subtitle}
                                            </div>
                                        )}
                                    </div>
                                    {result.type === 'note' && (
                                        <span className={`text-xs px-2 py-1 rounded ${index === selectedIndex ? 'bg-white/20' : 'bg-blue-500/20'
                                            }`}>
                                            Note
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-[var(--card-border)] px-4 py-3 flex items-center justify-between bg-[var(--card)]">
                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-[var(--background)] rounded border border-[var(--card-border)]">↑↓</kbd>
                            <span>Navigate</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-[var(--background)] rounded border border-[var(--card-border)]">↵</kbd>
                            <span>Select</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-[var(--background)] rounded border border-[var(--card-border)]">Esc</kbd>
                            <span>Close</span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500">
                        {results.length} results
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICommandPalette;
