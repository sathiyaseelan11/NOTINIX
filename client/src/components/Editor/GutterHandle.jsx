import React, { useState, useEffect } from 'react';
import { MoreVertical, GripVertical, Trash2, Palette, Repeat, Type } from 'lucide-react';

const GutterHandle = ({ top, onColor, onTurnInto, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    if (top === null) return null;

    return (
        <div
            className="absolute left-[-40px] z-40 flex items-center group pointer-events-auto"
            style={{ top: `${top}px`, height: '28px' }}
        >
            <button
                className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowMenu(!showMenu)}
            >
                <GripVertical size={18} />
            </button>

            {showMenu && (
                <div className="absolute left-8 top-0 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-50">
                    <button
                        onClick={() => { onTurnInto(); setShowMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--secondary)] flex items-center gap-2"
                    >
                        <Repeat size={14} /> Turn Into...
                    </button>
                    <button
                        onClick={() => { onColor(); setShowMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--secondary)] flex items-center gap-2"
                    >
                        <Palette size={14} /> Color
                    </button>
                    <div className="h-[1px] bg-[var(--border)] my-1" />
                    <button
                        onClick={() => { onDelete(); setShowMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--secondary)] text-red-400 flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Delete Block
                    </button>
                </div>
            )}
        </div>
    );
};

export default GutterHandle;
