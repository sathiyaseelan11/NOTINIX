import React, { createContext, useContext, useState, useCallback } from 'react';

const CommandPaletteContext = createContext();

export const useCommandPalette = () => {
    const context = useContext(CommandPaletteContext);
    if (!context) {
        throw new Error('useCommandPalette must be used within CommandPaletteProvider');
    }
    return context;
};

export const CommandPaletteProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [commands, setCommands] = useState([]);
    const [recentCommands, setRecentCommands] = useState([]);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const registerCommand = useCallback((command) => {
        setCommands(prev => {
            const existing = prev.find(c => c.id === command.id);
            if (existing) {
                return prev.map(c => c.id === command.id ? command : c);
            }
            return [...prev, command];
        });
    }, []);

    const executeCommand = useCallback((commandId) => {
        const command = commands.find(c => c.id === commandId);
        if (command && command.action) {
            command.action();
            setRecentCommands(prev => {
                const filtered = prev.filter(id => id !== commandId);
                return [commandId, ...filtered].slice(0, 5);
            });
            close();
        }
    }, [commands, close]);

    const value = {
        isOpen,
        open,
        close,
        toggle,
        commands,
        registerCommand,
        executeCommand,
        recentCommands,
    };

    return (
        <CommandPaletteContext.Provider value={value}>
            {children}
        </CommandPaletteContext.Provider>
    );
};
