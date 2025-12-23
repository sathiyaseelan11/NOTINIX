import React from 'react';
import { Heading2, Heading3, List, CheckSquare, Code, Quote, Upload, Sparkles, Lightbulb } from 'lucide-react';

const Toolbar = ({
    onInsertHeading,
    onInsertBullet,
    onInsertTodo,
    onInsertCode,
    onInsertQuote,
    onUploadFile,
    onAIContinue,
    onAIBrainstorm
}) => {
    return (
        <div className="flex gap-2 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg mb-3">
            <button
                onClick={() => onInsertHeading(2)}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                title="Heading 2"
            >
                <Heading2 size={18} />
            </button>
            <button
                onClick={() => onInsertHeading(3)}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                title="Heading 3"
            >
                <Heading3 size={18} />
            </button>
            <div className="w-px bg-[var(--border)]"></div>
            <button
                onClick={onInsertBullet}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                title="Bullet List"
            >
                <List size={18} />
            </button>
            <button
                onClick={onInsertTodo}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                title="To-do List"
            >
                <CheckSquare size={18} />
            </button>
            <div className="w-px bg-[var(--border)]"></div>
            <button
                onClick={onInsertCode}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                title="Code Block"
            >
                <Code size={18} />
            </button>
            <button
                onClick={onInsertQuote}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                title="Quote"
            >
                <Quote size={18} />
            </button>
            <div className="w-px bg-[var(--border)]"></div>
            <button
                onClick={onUploadFile}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                title="Upload File"
            >
                <Upload size={18} />
            </button>
            <div className="w-px bg-[var(--border)]"></div>
            <button
                onClick={onAIContinue}
                className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                title="AI: Continue Writing"
            >
                <Sparkles size={18} />
            </button>
            <button
                onClick={onAIBrainstorm}
                className="p-2 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 rounded transition-colors"
                title="AI: Brainstorm Ideas"
            >
                <Lightbulb size={18} />
            </button>
        </div>
    );
};

export default Toolbar;
