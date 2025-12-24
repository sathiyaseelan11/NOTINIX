import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { describe, it, expect, vi } from 'vitest';

// Redundant mocks removed (they are now in setupTests.jsx)


describe('App Component', () => {
    it('renders without crashing', () => {
        render(<App />);
    });
});
