import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Zap, RefreshCw, Settings, LogOut, ChevronDown, Command, Menu, X,
    Home, FileText, Network, CheckSquare, Calendar, Sparkles,
    Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { MessageSquare, Trash2, Plus } from 'lucide-react';

const SidebarLayout = () => {
    const { user, logout, updateProfile } = useAuth();
    const { toggle: toggleCommandPalette } = useCommandPalette();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.username || '');
    const [expandedSections, setExpandedSections] = useState({
        knowledge: true,
        work: true,
        ai: true,
        resources: true,
        team: false,
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);

    const fetchChatHistory = async () => {
        try {
            const { data } = await api.get('/chats');
            setChatHistory(data || []);
        } catch (error) {
            console.error('Failed to load chat history', error);
        }
    };

    useEffect(() => {
        if (user) fetchChatHistory();
    }, [user, location.pathname]); // Refresh on navigation or user change

    const handleDeleteChat = async (e, chatId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Delete this conversation?')) return;
        try {
            await api.delete(`/chats/${chatId}`);
            setChatHistory(prev => prev.filter(c => c._id !== chatId));
            if (location.pathname.includes(chatId)) {
                navigate('/chat');
            }
        } catch (error) {
            console.error('Failed to delete chat', error);
        }
    };

    useEffect(() => {
        // Global keyboard shortcut for command palette
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleCommandPalette]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/landing');
    };

    const handleNameUpdate = async (e) => {
        if (e.key === 'Enter') {
            try {
                await updateProfile(newName);
                setIsEditingName(false);
            } catch (err) {
                console.error('Failed to update name', err);
            }
        }
        if (e.key === 'Escape') {
            setNewName(user?.username || '');
            setIsEditingName(false);
        }
    };

    return (
        <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden relative">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-auto border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-4 py-3 z-50">
                <h1 className="text-2xl font-heading font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <img
                        src={theme === 'dark' ? '/logo-dark.ico' : '/logo-light.ico'}
                        alt="Notinix Logo"
                        className="w-16 h-16 object-contain animate-logo-scale-in"
                        style={{ transformOrigin: 'center' }}
                    />
                    Notinix
                </h1>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors text-[var(--muted-foreground)]"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Enhanced Left Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-[var(--border)] bg-[var(--card)] transition-transform duration-300 transform
                lg:relative lg:translate-x-0 lg:inset-auto lg:h-full
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-2 border-b border-[var(--border)]">
                    <h1 className="text-xl font-heading font-bold text-[var(--foreground)] flex items-center gap-1">
                        <img
                            src={theme === 'dark' ? '/logo-dark.ico' : '/logo-light.ico'}
                            alt="Notinix Logo"
                            className="w-10 h-10 object-contain"
                            style={{ transformOrigin: 'center' }}
                        />
                        <span>Notinix</span>
                    </h1>
                </div>

                {/* Command Palette Trigger */}
                <div className="px-3 py-2">
                    <button
                        onClick={toggleCommandPalette}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--primary)] transition-colors"
                    >
                        <Command className="w-4 h-4" />
                        <span className="text-sm">Quick search...</span>
                    </button>
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                    {/* Global */}
                    <NavItem onClick={() => setIsMobileMenuOpen(false)} to="/dashboard" icon={<Home className="w-4 h-4" />} label="Dashboard" />

                    {/* Knowledge Section */}
                    <Section
                        title="Knowledge"
                        isExpanded={expandedSections.knowledge}
                        onToggle={() => toggleSection('knowledge')}
                    >
                        <NavItem onClick={() => setIsMobileMenuOpen(false)} to="/notes" icon={<FileText className="w-4 h-4" />} label="All Notes" />
                        <NavItem onClick={() => setIsMobileMenuOpen(false)} to="/graph" icon={<Network className="w-4 h-4" />} label="Knowledge Graph" />
                    </Section>

                    {/* Work Section */}
                    <Section
                        title="Work"
                        isExpanded={expandedSections.work}
                        onToggle={() => toggleSection('work')}
                    >
                        <NavItem onClick={() => setIsMobileMenuOpen(false)} to="/tasks" icon={<CheckSquare className="w-4 h-4" />} label="Tasks" />
                        <NavItem onClick={() => setIsMobileMenuOpen(false)} to="/calendar" icon={<Calendar className="w-4 h-4" />} label="Calendar" />
                    </Section>

                    <Section
                        title="AI"
                        isExpanded={expandedSections.ai}
                        onToggle={() => toggleSection('ai')}
                    >
                        <NavItem onClick={() => setIsMobileMenuOpen(false)} to="/chat" icon={<Sparkles className="w-4 h-4" />} label="AI Chat" />

                        {/* New Chat Button directly below AI Chat link */}
                        <NavLink
                            to="/chat"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2 mx-1 mt-2 mb-2 px-3 py-2 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 rounded-lg text-xs font-semibold transition-all border border-[var(--primary)]/20 shadow-sm"
                        >
                            <Plus size={14} />
                            <span>New Chat</span>
                        </NavLink>

                        {/* Integrated Chat History */}
                        {expandedSections.ai && chatHistory.length > 0 && (
                            <div className="mt-1 ml-4 space-y-0.5 border-l border-[var(--border)] pl-3 max-h-[250px] overflow-y-auto scrollbar-none">
                                {chatHistory.map(chat => (
                                    <div key={chat._id} className="group relative">
                                        <NavLink
                                            to={`/chat/${chat._id}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={({ isActive }) => `
                                                flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all
                                                ${isActive
                                                    ? 'bg-[var(--primary)] text-white'
                                                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'}
                                            `}
                                        >
                                            <MessageSquare size={12} className="shrink-0" />
                                            <span className="truncate flex-1">
                                                {chat.title || (chat.messages?.find(m => m.role === 'user')?.content?.substring(0, 20) + '...') || 'New Chat'}
                                            </span>
                                        </NavLink>
                                        <button
                                            onClick={(e) => handleDeleteChat(e, chat._id)}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-500 transition-opacity"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>



                </div>

                {/* Theme & User Footer */}
                {/* User & Theme Section */}
                <div className="p-4 border-t border-[var(--border)] space-y-4">
                    {/* Theme Switcher */}
                    <div className="flex items-center gap-1 p-1 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-[#2563EB] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Light"
                        >
                            <Sun size={14} className={theme === 'light' ? 'fill-current' : ''} />
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-[#2563EB] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Dark"
                        >
                            <Moon size={14} className={theme === 'dark' ? 'fill-current' : ''} />
                        </button>

                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 overflow-hidden p-2 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                                {user?.username?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                {isEditingName ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        className="text-sm font-semibold bg-[var(--background)] text-[var(--foreground)] outline-none border-b border-[var(--primary)] w-full"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={handleNameUpdate}
                                        onBlur={() => {
                                            setIsEditingName(false);
                                            setNewName(user?.username || '');
                                        }}
                                    />
                                ) : (
                                    <span
                                        className="text-sm font-semibold text-[var(--foreground)] truncate cursor-pointer hover:text-[var(--primary)] flex items-center gap-1"
                                        onClick={() => setIsEditingName(true)}
                                        title="Click to edit name"
                                    >
                                        {user?.username || 'User'}
                                        <Settings size={10} className="opacity-0 group-hover:opacity-100" />
                                    </span>
                                )}
                                <span className="text-xs text-[var(--muted-foreground)] truncate">{user?.email}</span>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-500/20 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200"
                            title="Sign out of your account"
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)] lg:pt-0 pt-16">
                <Outlet />
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

const Section = ({ title, isExpanded, onToggle, children }) => (
    <div className="py-1">
        <button
            onClick={onToggle}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-400 transition-colors"
        >
            <ChevronDown
                className={`w-3 h-3 transition-transform ${!isExpanded ? '-rotate-90' : ''}`}
            />
            {title}
        </button>
        {isExpanded && (
            <div className="mt-1 space-y-0.5">
                {children}
            </div>
        )}
    </div>
);

const NavItem = ({ to, icon, label, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive
                ? 'bg-[var(--primary)] text-white font-medium'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
                }`}
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
};

const ThemeButton = ({ theme, icon, label }) => {
    const { theme: currentTheme, setTheme } = useTheme();
    const isActive = currentTheme === theme;

    return (
        <button
            onClick={() => setTheme(theme)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${isActive
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-gray-500 hover:text-white hover:bg-[var(--bg-hover)]'
                }`}
            title={`Switch to ${label} theme`}
        >
            {icon}
            {isActive && <span>{label}</span>}
        </button>
    );
};

export default SidebarLayout;
