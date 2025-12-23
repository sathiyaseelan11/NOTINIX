import React from 'react';
import { Tag, FileText, Globe, PenTool, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const NoteCard = ({ note, onClick, onDelete }) => {
    const getIcon = (source) => {
        switch (source) {
            case 'notion': return <Globe size={14} />;
            case 'obsidian': return <FileText size={14} />;
            default: return <PenTool size={14} />;
        }
    };

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg p-5 transition-all duration-200 flex flex-col gap-3 h-[280px] relative"
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide truncate">
                        {getIcon(note.source)} {note.source || 'Manual'}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]/80 group-hover:text-[var(--muted-foreground)] transition-colors">
                        {note.updatedAt ? format(new Date(note.updatedAt), 'MMM d, yyyy') : 'Just now'}
                    </span>
                </div>

                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(note._id);
                        }}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--accent)] rounded-md transition-all shrink-0"
                        title="Delete Note"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <h3 className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] line-clamp-2 transition-colors font-heading leading-tight">
                {note.title || 'Untitled Note'}
            </h3>

            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-4 flex-1">
                {note.content || 'No content...'}
            </p>

            {note.tags && note.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-auto pt-2">
                    {note.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">
                            <Tag size={10} /> {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NoteCard;
