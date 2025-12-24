import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Canvas/WebGL heavy libs
vi.mock('react-force-graph-2d', () => ({
    default: () => 'ForceGraph2D'
}));

vi.mock('react-force-graph-3d', () => ({
    default: () => 'ForceGraph3D'
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

global.window.scrollTo = vi.fn();

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
};

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

// Global mocks for Contexts
vi.mock('./context/ThemeContext', () => ({
    ThemeProvider: ({ children }) => <>{children}</>,
    useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

vi.mock('./context/AuthContext', () => ({
    AuthProvider: ({ children }) => <>{children}</>,
    useAuth: () => ({ user: { _id: '123', username: 'testuser' }, loading: false, login: vi.fn(), logout: vi.fn() }),
}));
