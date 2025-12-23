import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    const logoGradient = theme === 'dark'
        ? 'linear-gradient(to right, #fff, #ccc)'
        : 'linear-gradient(to right, #1e293b, #475569)';

    return (
        <nav style={{
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 2rem',
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)'
        }}>
            <div className="w-full flex justify-between items-center">
                <Link to="/" style={{ textDecoration: 'none', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <img src="/logo.png" alt="Notinix Logo" style={{ height: '36px', width: 'auto' }} />
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        letterSpacing: '-0.02em',
                        letterSpacing: '-0.02em',
                        letterSpacing: '-0.02em',
                        backgroundImage: logoGradient,
                        textShadow: theme === 'dark' ? '0 0 20px rgba(255,255,255,0.1)' : 'none'
                    }} className="text-gradient">
                        Notinix
                    </span>
                </Link>

                <div className="flex items-center gap-2 ml-auto">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-[var(--muted-foreground)] text-sm hidden md:inline">Welcome, {user.username}</span>
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-full hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button
                                onClick={logout}
                                className="btn btn-secondary flex items-center gap-2"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                                <LogOut size={16} /> <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3 items-center">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-full hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <Link to="/login" className="btn" style={{ textDecoration: 'none', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Login</Link>
                            <Link to="/register" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-sm" style={{ textDecoration: 'none' }}>Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
