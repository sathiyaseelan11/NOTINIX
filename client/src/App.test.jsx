import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { describe, it, expect, vi } from 'vitest';

// Mock contexts
vi.mock('./context/AuthContext', () => ({
    AuthProvider: ({ children }) => <div>{children}</div>,
    useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('./context/ThemeContext', () => ({
    ThemeProvider: ({ children }) => <div>{children}</div>,
    useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('./context/SocketContext', () => ({
    SocketProvider: ({ children }) => <div>{children}</div>,
    useSocket: () => null,
}));

vi.mock('./context/CommandPaletteContext', () => ({
    CommandPaletteProvider: ({ children }) => <div>{children}</div>,
}));

describe('App Component', () => {
    it('renders without crashing', () => {
        render(<App />);
    });
});
