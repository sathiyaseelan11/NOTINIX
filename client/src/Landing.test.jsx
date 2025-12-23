import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from './pages/Landing';
import { describe, it, vi } from 'vitest';

// Mock contexts that might be needed by Landing/Layout/Navbar
vi.mock('./context/AuthContext', () => ({
    useAuth: () => ({ user: null, logout: vi.fn() }),
}));

describe('Landing Component', () => {
    it('renders without crashing', () => {
        render(
            <MemoryRouter>
                <Landing />
            </MemoryRouter>
        );
    });
});
