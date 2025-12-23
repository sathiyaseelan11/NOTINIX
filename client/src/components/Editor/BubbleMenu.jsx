import React, { useState } from 'react';
import { aiAPI } from '../../services/api';
import {
    Sparkles, Check, X, RefreshCw, AlignLeft, Maximize2,
    Palette, ChevronRight, Heading1, Heading2, Heading3,
    List, CheckSquare, Quote, Type
} from 'lucide-react';

const COLORS = [
    { name: 'Default', value: 'default', color: 'inherit' },
    { name: 'Gray', value: 'gray', color: '#787774' },
    { name: 'Brown', value: 'brown', color: '#976d57' },
    { name: 'Orange', value: 'orange', color: '#d9730d' },
    { name: 'Yellow', value: 'yellow', color: '#dfab01' },
    { name: 'Green', value: 'green', color: '#448361' },
    { name: 'Blue', value: 'blue', color: '#337ea9' },
    { name: 'Purple', value: 'purple', color: '#9065b0' },
    { name: 'Pink', value: 'pink', color: '#c14c8a' },
    { name: 'Red', value: 'red', color: '#d44c47' },
];

const TURN_INTO_ITEMS = [
    { id: 'text', label: 'Text', icon: Type },
    { id: 'h1', label: 'Heading 1', icon: Heading1 },
    { id: 'h2', label: 'Heading 2', icon: Heading2 },
    { id: 'h3', label: 'Heading 3', icon: Heading3 },
    { id: 'list', label: 'Bullet List', icon: List },
    { id: 'todo', label: 'To-do List', icon: CheckSquare },
    { id: 'quote', label: 'Quote', icon: Quote },
];

const BubbleMenu = ({ position, selectedText, onReplace, onApplyColor, onTurnInto, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState(null); // 'color' | 'turn-into'

    if (!position || !selectedText) return null;

    const handleAIAction = async (instruction) => {
        setLoading(true);
        try {
            const { data } = await aiAPI.editText(selectedText, instruction);
            onReplace(data.editedText);
        } catch (error) {
            console.error('AI Edit failed', error);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <div
            className="fixed z-50 flex flex-col bg-[#1A1A1A] border border-[#333] rounded-lg shadow-2xl animate-in zoom-in-95 duration-100 min-w-[180px]"
            style={{
                top: position.top - 60,
                left: position.left
            }}
            onMouseLeave={() => setActiveSubmenu(null)}
        >
            {loading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-gray-400 text-sm">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Writing...
                </div>
            ) : (
                <div className="flex flex-col p-1">
                    {/* Main Actions Row */}
                    <div className="flex items-center gap-1 mb-1 pb-1 border-b border-[#333]">
                        <button
                            onClick={() => handleAIAction("Fix grammar and spelling")}
                            className="p-1.5 hover:bg-[#2C2C2C] rounded-md text-green-500 transition-colors"
                            title="AI Fix Grammar"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={() => handleAIAction("Improve writing quality")}
                            className="p-1.5 hover:bg-[#2C2C2C] rounded-md text-blue-500 transition-colors"
                            title="AI Rewrite"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={() => handleAIAction("Summarize succinctly")}
                            className="p-1.5 hover:bg-[#2C2C2C] rounded-md text-orange-500 transition-colors"
                            title="AI Shorten"
                        >
                            <AlignLeft size={16} />
                        </button>
                        <div className="w-[1px] h-4 bg-[#333] mx-1"></div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-red-900/20 text-gray-500 hover:text-red-400 rounded-md transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Turn Into Action */}
                    <div className="relative group">
                        <button
                            onMouseEnter={() => setActiveSubmenu('turn-into')}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#2C2C2C] rounded-md transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <RefreshCw size={14} className="text-purple-400" />
                                Turn into
                            </div>
                            <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400" />
                        </button>

                        {activeSubmenu === 'turn-into' && (
                            <div className="absolute left-full top-0 ml-1 w-48 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-2xl py-1 z-50">
                                {TURN_INTO_ITEMS.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onTurnInto(item.id);
                                            onClose();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#2C2C2C] transition-colors"
                                    >
                                        <item.icon size={14} className="text-gray-500" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Color Action */}
                    <div className="relative group">
                        <button
                            onMouseEnter={() => setActiveSubmenu('color')}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#2C2C2C] rounded-md transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <Palette size={14} className="text-blue-400" />
                                Color
                            </div>
                            <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400" />
                        </button>

                        {activeSubmenu === 'color' && (
                            <div className="absolute left-full top-0 ml-1 w-56 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-2xl py-2 z-50 max-h-80 overflow-y-auto">
                                <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Text Color</div>
                                {COLORS.map(c => (
                                    <button
                                        key={`text-${c.value}`}
                                        onClick={() => onApplyColor({ value: c.value, type: 'text' })}
                                        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm hover:bg-[#2C2C2C] transition-colors"
                                        style={{ color: c.color }}
                                    >
                                        <div className="w-4 h-4 rounded border border-[#333] flex items-center justify-center text-[10px] font-bold" style={{ color: c.color }}>A</div>
                                        {c.name}
                                    </button>
                                ))}

                                <div className="h-[1px] bg-[#333] my-2"></div>

                                <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Background Color</div>
                                {COLORS.map(c => (
                                    <button
                                        key={`bg-${c.value}`}
                                        onClick={() => onApplyColor({ value: c.value, type: 'bg' })}
                                        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#2C2C2C] transition-colors"
                                    >
                                        <div className="w-4 h-4 rounded border border-[#333]" style={{ backgroundColor: c.value === 'default' ? 'transparent' : c.color }}></div>
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BubbleMenu;
