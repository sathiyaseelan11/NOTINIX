import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Paperclip, Send, Plus, Trash2, Brain, Sparkles, BookOpen, ExternalLink, FileText, Menu, MessageSquare } from 'lucide-react';
import api, { aiAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

const ChatInterface = () => {
    const { id: chatIdParam } = useParams();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const attachNoteId = searchParams.get('attach');

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [isKnowledgeMode, setIsKnowledgeMode] = useState(false);

    // Attached Context State
    const [attachedNotes, setAttachedNotes] = useState([]);
    const [attachedFiles, setAttachedFiles] = useState([]);

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        const loadChat = async () => {
            setPageLoading(true);
            try {
                if (chatIdParam) {
                    const { data } = await api.get(`/chats/${chatIdParam}`);
                    setMessages(data.messages);
                } else {
                    setMessages([]);
                }
            } catch (error) {
                console.error('Failed to load chat', error);
                if (chatIdParam) navigate('/chat');
            } finally {
                setPageLoading(false);
            }
        };
        loadChat();
    }, [chatIdParam, navigate]);

    // Handle Attach Param
    useEffect(() => {
        if (attachNoteId) {
            const fetchAndAttach = async () => {
                try {
                    const { data } = await api.get(`/notes/${attachNoteId}`);
                    if (data) {
                        setAttachedNotes(prev => {
                            if (!prev.find(n => n._id === data._id)) {
                                return [...prev, data];
                            }
                            return prev;
                        });
                        window.history.replaceState({}, '', '/chat');
                    }
                } catch (err) {
                    console.error('Failed to attach note from param', err);
                }
            };
            fetchAndAttach();
        }
    }, [attachNoteId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const originalInput = input;
        setInput('');
        setLoading(true);

        setMessages(prev => [...prev, { role: 'user', content: originalInput }]);

        try {
            const targetId = chatIdParam || 'new';
            const noteIds = attachedNotes.map(n => n._id);

            let fileContext = "";
            let fileNames = [];
            if (attachedFiles.length > 0) {
                fileContext = attachedFiles.map(f => f.extractedText).join('\n\n---\n\n');
                fileNames = attachedFiles.map(f => f.name).join(', ');
            }

            const { data } = await api.post(`/chats/${targetId}/message`, {
                message: originalInput,
                fileContent: fileContext,
                fileName: fileNames,
                isKnowledgeMode,
                noteIds
            });

            setMessages(data.messages);

            if (targetId === 'new') {
                navigate(`/chat/${data._id}`, { replace: true });
            }

            // Note: Sidebar will auto-refresh because SidebarLayout listens to location change

            setAttachedFiles([]);
            setAttachedNotes([]);

        } catch (error) {
            console.error('Failed to send message', error);
            alert('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setAttachedFiles(prev => [...prev, {
                id: data.url,
                name: data.name,
                url: data.url,
                extractedText: data.extractedText
            }]);
        } catch (error) {
            console.error('File upload failed', error);
            alert('Failed to upload file');
        } finally {
            setLoading(false);
        }
        e.target.value = '';
    };

    const removeAttachedFile = (fileUrl) => {
        setAttachedFiles(attachedFiles.filter(f => f.url !== fileUrl));
    };

    const handleSaveToNote = async (content) => {
        try {
            const title = content.split('\n')[0].substring(0, 50).replace(/[#*]/g, '').trim() || 'AI Note';
            const { data } = await api.post('/notes', { title, content, parentId: null });

            if (window.confirm('Note created! Go to note?')) {
                navigate(`/notes/${data._id}`);
            } else {
                alert('Saved to Notes!');
            }
        } catch (error) {
            console.error('Failed to save note', error);
            alert('Failed to save note');
        }
    };

    const [showNotePicker, setShowNotePicker] = useState(false);
    const [pickerNotes, setPickerNotes] = useState([]);

    const fetchPickerNotes = async () => {
        try {
            const { data } = await api.get('/notes');
            setPickerNotes(data.slice(0, 10));
        } catch (error) { console.error(error); }
    };

    const toggleNotePicker = () => {
        if (!showNotePicker) fetchPickerNotes();
        setShowNotePicker(!showNotePicker);
    };

    const attachNote = (note) => {
        if (!attachedNotes.find(n => n._id === note._id)) {
            setAttachedNotes([...attachedNotes, note]);
        }
        setShowNotePicker(false);
    };

    const removeAttachedNote = (noteId) => {
        setAttachedNotes(attachedNotes.filter(n => n._id !== noteId));
    };

    if (pageLoading) return <LoadingScreen />;

    return (
        <div className="flex h-full overflow-hidden relative">
            {/* Main Chat Container */}
            <div className="flex-1 flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] relative min-w-0">

                {/* Header with Mode Toggle & Quota */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between pointer-events-none px-8">
                    <div className="flex-1"></div>

                    <div className="pointer-events-auto bg-[var(--card)] border border-[var(--card-border)] rounded-full p-1 flex items-center shadow-lg">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all bg-blue-600 text-white shadow-md">
                            <Bot size={16} />
                            AI Chat
                        </div>
                    </div>

                    <div className="flex-1 flex justify-end">
                        <div className="pointer-events-auto flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full shadow-sm">
                            <Sparkles size={14} className="text-yellow-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600">Large Quota Enabled</span>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin pb-40 pt-20">
                    {!chatIdParam && messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-500 ${isKnowledgeMode ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                                {isKnowledgeMode ? <Brain size={48} /> : <Bot size={48} />}
                            </div>
                            <h2 className="text-2xl font-bold">
                                {isKnowledgeMode ? 'Ask your Second Brain' : 'How can I help you today?'}
                            </h2>
                            <p className="max-w-md text-[var(--muted-foreground)]">
                                {isKnowledgeMode
                                    ? 'I can search through your notes, find connections, and answer questions based on your personal knowledge base.'
                                    : 'I can help you brainstorm ideas, write content, or just chat about anything.'}
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-8">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role !== 'user' && (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isKnowledgeMode ? 'bg-purple-600' : 'bg-green-600'}`}>
                                            {msg.sources ? <Brain size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                                        </div>
                                    )}

                                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-2xl px-5 py-3 leading-relaxed text-sm group relative shadow-sm ${msg.role === 'user'
                                            ? 'bg-[var(--secondary)] text-[var(--foreground)] rounded-tr-sm'
                                            : 'bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)]'
                                            }`}>
                                            {msg.role === 'user' ? (
                                                msg.content
                                            ) : (
                                                <>
                                                    <div className="prose prose-invert prose-sm max-w-none">
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSaveToNote(msg.content)}
                                                        className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-[var(--primary)] hover:opacity-80 transition-all bg-[var(--card)] px-2 py-1 rounded border border-[var(--card-border)]"
                                                        title="Save to Notes"
                                                    >
                                                        <Plus size={12} /> Save to Notes
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Sources Display for RAG */}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-3 flex items-center gap-2 flex-wrap animate-in fade-in slide-in-from-top-2">
                                                <span className="text-xs text-purple-400 font-medium flex items-center gap-1">
                                                    <BookOpen size={12} /> Sources:
                                                </span>
                                                {msg.sources.map(source => (
                                                    <button
                                                        key={source.id}
                                                        onClick={() => navigate(`/notes/${source.id}`)}
                                                        className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded text-xs text-purple-300 hover:text-white transition-colors"
                                                    >
                                                        <FileText size={10} />
                                                        <span className="truncate max-w-[150px]">{source.title}</span>
                                                        <ExternalLink size={10} className="opacity-50" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                            <User size={16} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isKnowledgeMode ? 'bg-purple-600' : 'bg-green-600'}`}>
                                        {isKnowledgeMode ? <Brain size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-1 h-8 bg-[var(--card)] border border-[var(--card-border)] px-4 rounded-2xl w-fit">
                                            <span className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        {isKnowledgeMode && (
                                            <span className="text-xs text-purple-400 animate-pulse ml-2 flex items-center gap-1">
                                                <Sparkles size={10} /> Searching note connections...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-10">
                    <div className="max-w-3xl mx-auto relative group">

                        {/* Context Pills */}
                        {(attachedNotes.length > 0 || attachedFiles.length > 0) && !isKnowledgeMode && (
                            <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
                                {attachedFiles.map(file => (
                                    <div key={file.url} className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg text-xs text-blue-400">
                                        <FileText size={10} />
                                        <span className="max-w-[120px] truncate font-medium">{file.name}</span>
                                        <button onClick={() => removeAttachedFile(file.url)} className="hover:text-red-400 transition-colors ml-1"><Trash2 size={10} /></button>
                                    </div>
                                ))}
                                {attachedNotes.map(note => (
                                    <div key={note._id} className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-lg text-xs text-purple-400">
                                        <BookOpen size={10} />
                                        <span className="max-w-[120px] truncate font-medium">{note.title}</span>
                                        <button onClick={() => removeAttachedNote(note._id)} className="hover:text-red-400 transition-colors ml-1"><Trash2 size={10} /></button>
                                    </div>
                                ))}
                            </div>
                        )}



                        {/* Note Picker */}
                        {showNotePicker && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-xl overflow-hidden z-20 animate-in zoom-in duration-200">
                                <div className="p-2 border-b border-[var(--card-border)] text-xs font-semibold text-[var(--muted-foreground)]">Attach Note Context</div>
                                <div className="max-h-48 overflow-y-auto">
                                    {pickerNotes.map(note => (
                                        <div
                                            key={note._id}
                                            onClick={() => attachNote(note)}
                                            className="px-3 py-2 hover:bg-[var(--secondary)] cursor-pointer text-sm truncate text-[var(--foreground)]"
                                        >
                                            {note.title || 'Untitled'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Bar */}
                        <form
                            onSubmit={handleSendMessage}
                            className={`relative flex items-end gap-2 bg-[var(--card)] border rounded-2xl p-2 shadow-2xl transition-all duration-300 ${isKnowledgeMode ? 'border-purple-500/30 ring-1 ring-purple-500/10' : 'border-[var(--card-border)]'}`}
                        >
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf,.docx,.xlsx,.txt,.md"
                            />
                            {!isKnowledgeMode && (
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`p-2 transition-colors rounded-lg hover:bg-[var(--secondary)] ${attachedFiles.length > 0 ? 'text-blue-500' : 'text-[var(--muted-foreground)]'}`}
                                        title="Upload File"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={toggleNotePicker}
                                        className={`p-2 transition-colors rounded-lg hover:bg-[var(--secondary)] ${attachedNotes.length > 0 ? 'text-purple-500' : 'text-[var(--muted-foreground)]'}`}
                                        title="Attach Note Context"
                                    >
                                        <BookOpen size={20} />
                                    </button>
                                </div>
                            )}

                            <TextareaAutosize
                                minRows={1}
                                maxRows={5}
                                placeholder={isKnowledgeMode ? "Ask a question about your notes..." : "Message AI..."}
                                className="w-full bg-transparent border-none outline-none text-[var(--foreground)] placeholder-gray-500 resize-none overflow-hidden py-2 max-h-[200px]"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />

                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className={`p-2 rounded-lg transition-colors mb-0.5
                            ${input.trim() && !loading
                                        ? (isKnowledgeMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-[var(--primary)] text-white hover:opacity-90')
                                        : 'bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed'}
                            `}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                        <p className="text-[10px] text-[var(--muted-foreground)] text-center mt-2">
                            {isKnowledgeMode ? 'Answers are based only on the content found in your notes.' : 'Notinix AI can make mistakes. Consider checking important information.'}
                        </p>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default ChatInterface;

