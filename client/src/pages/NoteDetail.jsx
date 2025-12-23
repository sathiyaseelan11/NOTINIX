import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { notesAPI, aiAPI, uploadAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, Save, Trash2, Pencil, X, Clock, Calendar, Maximize2, Minimize2, Download, FileText, ExternalLink, Eye, Tag, Layout, Image as ImageIcon } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import GutterHandle from '../components/Editor/GutterHandle';

// AI Components
import AIActionBar from '../components/AI/AIActionBar';
import AISummaryModal from '../components/AI/AISummaryModal';
import AutoTagPanel from '../components/AI/AutoTagPanel';
import RelatedNotesPanel from '../components/AI/RelatedNotesPanel';
import BubbleMenu from '../components/Editor/BubbleMenu';
import SlashMenu from '../components/Editor/SlashMenu';
import Toolbar from '../components/Editor/Toolbar';
import LoadingScreen from '../components/LoadingScreen';

const NoteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    // Note State
    const [note, setNote] = useState({
        title: '',
        content: '',
        tags: [],
        icon: '📄',
        coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    });
    const [loading, setLoading] = useState(!isNew);
    const [editMode, setEditMode] = useState(isNew);
    const [isSaving, setIsSaving] = useState(false);

    // AI State
    const [loadingAction, setLoadingAction] = useState(null);
    const [modals, setModals] = useState({
        summary: false,
        tags: false,
        related: false,
    });
    const [aiResults, setAiResults] = useState({
        summary: '',
        suggestedTags: [],
        relatedNotes: [],
    });

    // Intelligent Editor State
    const [bubbleMenu, setBubbleMenu] = useState({ show: false, top: 0, left: 0, text: '' });
    const [slashMenu, setSlashMenu] = useState({ show: false, top: 0, left: 0 });
    const [isDistractionFree, setIsDistractionFree] = useState(false);
    const [activeLightbox, setActiveLightbox] = useState(null); // URL of the image to show in lightbox
    const [gutterTop, setGutterTop] = useState(null);
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isNew) {
            fetchNote();
        }
    }, [id, isNew]);

    const fetchNote = async () => {
        setLoading(true);
        try {
            const { data } = await notesAPI.getNote(id);
            setNote(data);
        } catch (error) {
            console.error(error);
            navigate('/notes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (isNew) {
                const { data } = await notesAPI.createNote(note);
                navigate(`/notes/${data._id}`);
                setEditMode(false);
            } else {
                await notesAPI.updateNote(id, note);
                setEditMode(false);
            }
        } catch (error) {
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            try {
                const response = await notesAPI.deleteNote(id);
                navigate('/notes');
            } catch (error) {
                console.error('Error deleting note:', error);
                alert('Failed to delete note. Please try again.');
            }
        }
    };

    const handleExport = () => {
        const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, `${note.title || 'untitled'}.md`);
    };

    // AI Handlers
    const handleSummarize = async () => {
        setLoadingAction('summarize');
        setModals(prev => ({ ...prev, summary: true })); // Open immediately to show loading state
        try {
            const { data } = await aiAPI.summarizeNote(id, 'detailed');
            setAiResults(prev => ({ ...prev, summary: data.summary }));
        } catch (error) {
            console.error(error);
            alert('Failed to summarize note');
            setModals(prev => ({ ...prev, summary: false }));
        } finally {
            setLoadingAction(null);
        }
    };

    const handleExtractTasks = async () => {
        setLoadingAction('extract');
        try {
            const { data } = await aiAPI.extractTasks(id);
            alert(`Succesfully sent ${data.tasks.length} tasks to your Task list!`);
        } catch (error) {
            console.error(error);
            alert('Failed to extract tasks');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleAutoTag = async () => {
        setLoadingAction('autotag');
        setModals(prev => ({ ...prev, tags: true }));
        try {
            const { data } = await aiAPI.autoTagNote(id);
            setAiResults(prev => ({ ...prev, suggestedTags: data.suggestedTags }));
        } catch (error) {
            console.error(error);
            setModals(prev => ({ ...prev, tags: false }));
            alert('Failed to generate tags');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleApplyTags = async (tags) => {
        try {
            const { data } = await aiAPI.applyTags(id, tags);
            setNote(prev => ({ ...prev, tags: data.note.tags }));
            setModals(prev => ({ ...prev, tags: false }));
        } catch (error) {
            console.error(error);
            alert('Failed to apply tags');
        }
    };

    const handleFindRelated = async () => {
        setLoadingAction('related');
        setModals(prev => ({ ...prev, related: true }));
        try {
            const { data } = await aiAPI.findRelatedNotes(id);
            setAiResults(prev => ({ ...prev, relatedNotes: data.relatedNotes }));
        } catch (error) {
            console.error(error);
            setModals(prev => ({ ...prev, related: false }));
            alert('Failed to find related notes');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleAskAI = () => {
        navigate(`/chat?attach=${id}`);
    };

    // Intelligent Editor Handlers
    const handleSelect = () => {
        if (!editMode) return;
        const selection = window.getSelection();
        const text = selection.toString();

        if (text && text.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setBubbleMenu({
                show: true,
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                text: text
            });
        } else {
            setBubbleMenu(prev => ({ ...prev, show: false }));
        }
    };

    const handleAIAction = async (action) => {
        setLoadingAction(action);
        try {
            let instruction = '';
            if (action === 'ai-continue') {
                instruction = 'Continue writing the following text in the same style and context. Provide only the continuation, nothing else.';
            } else if (action === 'ai-brainstorm') {
                instruction = 'Based on the following text, brainstorm 5 creative and relevant ideas or follow-up points. Format as a bulleted list.';
            }

            const { data } = await aiAPI.editText(note.content, instruction);
            const newContent = note.content + '\n\n' + data.text;
            setNote(prev => ({ ...prev, content: newContent }));
        } catch (error) {
            console.error('AI Error:', error);
            alert('AI action failed. Please try again.');
        } finally {
            setLoadingAction(null);
            setSlashMenu(prev => ({ ...prev, show: false }));
        }
    };

    const handleKeyDown = (e) => {
        if (!editMode) return;

        // Hide menus on typing
        if (e.key !== '/') {
            setSlashMenu(prev => ({ ...prev, show: false }));
        }

        if (e.key === '/') {
            const textarea = e.target;
            const { top, left } = textarea.getBoundingClientRect();
            setSlashMenu({
                show: true,
                top: top + window.scrollY + 50,
                left: left + window.scrollX + 50
            });
        }

        // Gutter handle positioning
        setTimeout(() => {
            const textarea = e.target;
            const start = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, start);
            const lines = textBefore.split('\n').length;
            const lineHeight = 28; // Estimate
            setGutterTop((lines - 1) * lineHeight + 2);
        }, 0);
    };

    const handleBubbleReplace = (newText) => {
        if (note.content && bubbleMenu.text) {
            const newContent = note.content.replace(bubbleMenu.text, newText);
            setNote(prev => ({ ...prev, content: newContent }));
        }
    };

    const handleSlashSelect = (item) => {
        if (item.action) {
            if (item.action === 'ai-continue' || item.action === 'ai-brainstorm') {
                handleAIAction(item.action);
            } else if (item.action === 'upload-file') {
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
                setSlashMenu(prev => ({ ...prev, show: false }));
            }
        } else if (item.insert) {
            // Insert block
            const textarea = document.querySelector('textarea');
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = note.content;
                const before = text.substring(0, start);
                const after = text.substring(end);

                // Remove the slash if it was just typed
                const newContent = before.endsWith('/')
                    ? before.slice(0, -1) + item.insert + after
                    : before + item.insert + after;

                setNote(prev => ({ ...prev, content: newContent }));
                setSlashMenu(prev => ({ ...prev, show: false }));
                // Focus back would be ideal here
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Detect if it's a text-based file
        const isTextFile = file.type === 'text/plain' ||
            file.type === 'text/markdown' ||
            file.name.endsWith('.txt') ||
            file.name.endsWith('.md');

        try {
            const textarea = document.querySelector('textarea');
            const start = textarea ? textarea.selectionStart : note.content.length;
            const text = note.content || '';
            const before = text.substring(0, start);
            const after = text.substring(start);

            if (isTextFile) {
                // Read content directly for text files
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const content = event.target.result;
                    const formattedContent = `\n---\n### Content from ${file.name}:\n${content}\n---\n`;
                    setNote(prev => ({ ...prev, content: before + formattedContent + after }));
                };
                reader.readAsText(file);

                // Also upload to server for storage/link backup
                const formData = new FormData();
                formData.append('file', file);
                await uploadAPI.uploadFile(formData);
            } else {
                // Non-text files (images, PDFs, etc.) logic
                const formData = new FormData();
                formData.append('file', file);

                const loadingPlaceholder = `![Uploading ${file.name}...]`;
                setNote(prev => ({ ...prev, content: before + '\n' + loadingPlaceholder + '\n' + after }));

                const { data } = await uploadAPI.uploadFile(formData);

                const isImage = data.type.startsWith('image/');
                const markdownLink = isImage
                    ? `![${data.name}](${data.url})`
                    : `[📄 ${data.name}](${data.url})`;

                setNote(prev => ({
                    ...prev,
                    content: prev.content.replace(loadingPlaceholder, markdownLink)
                }));
            }

        } catch (error) {
            console.error('File processing failed', error);
            alert('File processing failed');
            setNote(prev => ({
                ...prev,
                content: prev.content.replace(/!\[Uploading .*\]/, '')
            }));
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleInsertBlock = (type) => {
        const items = {
            'h1': '# ',
            'h2': '## ',
            'h3': '### ',
            'list': '- ',
            'todo': '- [ ] ',
            'code': '```\n\n```',
            'quote': '> ',
        };
        const insertText = items[type];

        if (insertText) {
            handleSlashSelect({ insert: insertText });
        }
    };



    const handleTurnInto = (type) => {
        const textarea = editorRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const text = note.content;

        // Find the start of the current line
        const lines = text.split('\n');
        let currentPos = 0;
        let lineIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (currentPos + lines[i].length >= start) {
                lineIndex = i;
                break;
            }
            currentPos += lines[i].length + 1; // +1 for newline
        }

        if (lineIndex === -1) return;

        const line = lines[lineIndex];
        const prefixes = ['# ', '## ', '### ', '- [ ] ', '- ', '> '];
        let newLine = line;

        // Remove existing prefix
        for (const prefix of prefixes) {
            if (line.startsWith(prefix)) {
                newLine = line.slice(prefix.length);
                break;
            }
        }

        // Add new prefix
        const items = {
            'h1': '# ',
            'h2': '## ',
            'h3': '### ',
            'list': '- ',
            'todo': '- [ ] ',
            'quote': '> ',
            'text': ''
        };

        newLine = (items[type] || '') + newLine;
        lines[lineIndex] = newLine;

        setNote(prev => ({ ...prev, content: lines.join('\n') }));
    };

    const handleApplyColor = (colorConfig) => {
        const { value, type } = colorConfig; // e.g., { value: 'red', type: 'text' }
        if (!bubbleMenu.text) return;

        const classPrefix = type === 'text' ? 'n-text-' : 'n-bg-';
        const newText = `<span class="${classPrefix}${value}">${bubbleMenu.text}</span>`;

        handleBubbleReplace(newText);
        setBubbleMenu(prev => ({ ...prev, show: false }));
    };


    return (
        <div className={isDistractionFree ? "fixed inset-0 z-50 bg-[var(--background)] flex flex-col" : "flex flex-col h-full overflow-hidden relative"}>
            {/* Header / Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
                <button
                    onClick={() => navigate('/notes')}
                    className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-sm"
                >
                    <ArrowLeft size={16} /> Back to Notes
                </button>

                <div className="flex items-center gap-2">
                    {editMode ? (
                        <>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--secondary)] hover:opacity-80 border border-[var(--border)] text-sm text-[var(--foreground)] transition-colors"
                                onClick={() => setEditMode(false)}
                            >
                                <X size={14} /> Cancel
                            </button>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--primary)] hover:opacity-90 text-sm text-[var(--primary-foreground)] font-medium transition-colors"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    ) : (
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--secondary)] hover:opacity-80 border border-[var(--border)] text-sm text-[var(--foreground)] transition-colors"
                            onClick={() => setEditMode(true)}
                        >
                            <Pencil size={14} /> Edit
                        </button>
                    )}

                    {!isNew && (
                        <button
                            className="p-1.5 rounded-md hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"
                            onClick={handleDelete}
                            title="Delete Note"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}

                    {!isNew && (
                        <button
                            className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            onClick={handleExport}
                            title="Export as Markdown"
                        >
                            <Download size={16} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        onClick={() => setIsDistractionFree(!isDistractionFree)}
                        title={isDistractionFree ? "Exit Focus Mode" : "Focus Mode"}
                    >
                        {isDistractionFree ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    <div className="w-[1px] h-4 bg-[var(--border)] mx-1"></div>
                </div>
            </div>

            {/* Cover Image Header Removed */}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 md:px-24 py-8 flex flex-col gap-8 relative">

                    {/* Icon Header Removed */}

                    {/* Properties Panel Removed */}

                    {/* Title Area */}
                    <div className="flex flex-col gap-4">
                        {editMode ? (
                            <TextareaAutosize
                                className="w-full bg-transparent border-none text-5xl font-bold font-heading text-[var(--foreground)] placeholder-gray-500 focus:outline-none resize-none tracking-tight leading-none"
                                placeholder="Untitled"
                                value={note.title}
                                onChange={(e) => setNote({ ...note, title: e.target.value })}
                            />
                        ) : (
                            <h1 className="text-5xl font-bold font-heading text-[var(--foreground)] break-words tracking-tight leading-none">{note.title || 'Untitled'}</h1>
                        )}
                    </div>

                    {/* Editor Container */}
                    <div className="relative min-h-[50vh] pb-32 group/editor">
                        {editMode && (
                            <GutterHandle
                                top={gutterTop}
                                onColor={() => alert('Color menu coming to gutter handle!')}
                                onTurnInto={() => alert('Turn Into menu coming to gutter handle!')}
                                onDelete={() => setNote(prev => ({ ...prev, content: '' }))}
                            />
                        )}

                        {editMode ? (
                            <div onMouseUp={handleSelect} onKeyUp={handleKeyDown}>
                                <TextareaAutosize
                                    ref={editorRef}
                                    className="w-full bg-transparent border-none text-[var(--foreground)] text-lg leading-[1.6] focus:outline-none resize-none font-sans"
                                    placeholder="Type '/' for commands..."
                                    minRows={10}
                                    value={note.content}
                                    onChange={(e) => setNote({ ...note, content: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-lg max-w-none text-[var(--foreground)] leading-[1.6] font-sans">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        img: ({ node, ...props }) => (
                                            <div className="group relative my-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg transition-all hover:shadow-xl">
                                                <img {...props} className="w-full h-auto object-cover cursor-zoom-in" alt={props.alt || 'Note image'} onClick={() => setActiveLightbox(props.src)} />
                                            </div>
                                        ),
                                        h1: ({ children }) => <h1 className="text-3xl font-bold border-b border-[var(--border)] pb-2 mt-8 mb-4">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
                                        p: ({ children }) => <p className="mb-4 text-[var(--foreground)] opacity-95">{children}</p>,
                                        a: ({ node, ...props }) => {
                                            const isPdf = props.href?.toLowerCase().endsWith('.pdf');
                                            if (isPdf) return <div className="my-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between group hover:border-[var(--primary)]/50 transition-all font-sans"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><FileText size={20} /></div><div><h4 className="font-bold text-[var(--foreground)] text-sm">{props.children?.[0] || 'PDF'}</h4><span className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold">PDF Document</span></div></div><div className="flex gap-2"><a href={props.href} target="_blank" className="p-2 rounded hover:bg-[var(--secondary)]"><Eye size={16} /></a><a href={props.href} download className="p-2 rounded bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"><Download size={16} /></a></div></div>;
                                            return <a {...props} className="text-[var(--primary)] hover:underline flex items-center gap-1 inline-flex" target="_blank" rel="noopener noreferrer">{props.children} <ExternalLink size={12} /></a>;
                                        }
                                    }}
                                >
                                    {note.content || '*Press Slash (/) to start writing.*'}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Modals & Panels */}
            {
                modals.summary && (
                    <AISummaryModal
                        summary={aiResults.summary}
                        isLoading={loadingAction === 'summarize'}
                        onClose={() => setModals(prev => ({ ...prev, summary: false }))}
                        onSave={() => alert('Save to note metadata coming soon!')}
                    />
                )
            }

            {
                modals.tags && (
                    <AutoTagPanel
                        suggestions={aiResults.suggestedTags}
                        currentTags={note.tags || []}
                        isLoading={loadingAction === 'autotag'}
                        onClose={() => setModals(prev => ({ ...prev, tags: false }))}
                        onApply={handleApplyTags}
                    />
                )
            }

            {
                modals.related && (
                    <RelatedNotesPanel
                        relatedNotes={aiResults.relatedNotes}
                        isLoading={loadingAction === 'related'}
                        onClose={() => setModals(prev => ({ ...prev, related: false }))}
                    />
                )
            }

            {/* Editor Menus */}
            {
                bubbleMenu.show && (
                    <BubbleMenu
                        position={bubbleMenu}
                        selectedText={bubbleMenu.text}
                        onReplace={handleBubbleReplace}
                        onApplyColor={handleApplyColor}
                        onTurnInto={handleTurnInto}
                        onClose={() => setBubbleMenu(prev => ({ ...prev, show: false }))}
                    />
                )
            }

            {
                slashMenu.show && (
                    <SlashMenu
                        position={slashMenu}
                        onSelect={handleSlashSelect}
                        onClose={() => setSlashMenu(prev => ({ ...prev, show: false }))}
                    />
                )
            }
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Lightbox Modal */}
            {activeLightbox && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
                    onClick={() => setActiveLightbox(null)}
                >
                    <button
                        onClick={() => setActiveLightbox(null)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={activeLightbox}
                        alt="Full view"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default NoteDetail;
