import React, { useEffect, useState, useRef } from 'react';
import {
    Heading1, Heading2, Heading3, List, CheckSquare,
    Code, Quote, Sparkles, Image, Table
} from 'lucide-react';

const MENU_ITEMS = [
    { id: 'h1', label: 'Heading 1', icon: Heading1, insert: '# ' },
    { id: 'h2', label: 'Heading 2', icon: Heading2, insert: '## ' },
    { id: 'h3', label: 'Heading 3', icon: Heading3, insert: '### ' },
    { id: 'list', label: 'Bullet List', icon: List, insert: '- ' },
    { id: 'todo', label: 'To-do List', icon: CheckSquare, insert: '- [ ] ' },
    { id: 'code', label: 'Code Block', icon: Code, insert: '```\n\n```' },
    { id: 'quote', label: 'Quote', icon: Quote, insert: '> ' },
    { id: 'file', label: 'Upload File', icon: Image, action: 'upload-file' },
    { id: 'divider', type: 'divider' },
    { id: 'ai-write', label: 'AI: Continue Writing', icon: Sparkles, color: 'text-purple-500', action: 'ai-continue' },
    { id: 'ai-brainstorm', label: 'AI: Brainstorm Ideas', icon: Sparkles, color: 'text-blue-500', action: 'ai-brainstorm' },
];

const SlashMenu = ({ position, onSelect, onClose }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % MENU_ITEMS.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = MENU_ITEMS[selectedIndex];
                if (item.type !== 'divider') {
                    onSelect(item);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, onSelect, onClose]);

    if (!position) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-64 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-80 overflow-y-auto"
            style={{
                top: position.top + 24,
                left: position.left
            }}
        >
            <div className="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#222]">
                Basic Blocks
            </div>

            {MENU_ITEMS.map((item, index) => {
                if (item.type === 'divider') {
                    return <div key={index} className="h-[1px] bg-[#333] my-1" />;
                }

                const isActive = index === selectedIndex;
                const Icon = item.icon;

                return (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#2C2C2C]'
                            }`}
                        onClick={() => onSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        {Icon && (
                            <div className={`p-1 rounded bg-white/10 ${item.color || ''}`}>
                                <Icon size={16} />
                            </div>
                        )}
                        <span className="text-sm font-medium">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default SlashMenu;
