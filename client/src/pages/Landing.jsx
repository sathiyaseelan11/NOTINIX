import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Sparkles, Brain, Zap, Shield } from 'lucide-react';

import { useTheme } from '../context/ThemeContext';

const Landing = () => {
    const { theme } = useTheme();

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center text-center flex-1 h-full" style={{ gap: '3rem' }}>

                {/* Hero Section */}
                <div style={{ maxWidth: '800px', animation: 'fadeIn 1s ease-out' }}>
                    <div className="mb-4">
                        <img src="/landing-logo.png" alt="Notinix Logo" style={{ height: '80px', width: 'auto' }} className="mx-auto animate-logo-scale-in" />
                    </div>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--accent-color)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}>
                        <Sparkles size={16} /> AI-Powered Note Management
                    </div>

                    <h1 style={{
                        fontSize: '4rem',
                        lineHeight: '1.1',
                        marginBottom: '1.5rem',
                        fontWeight: '800',
                        letterSpacing: '-0.02em',
                        letterSpacing: '-0.02em',
                        letterSpacing: '-0.02em',
                        backgroundImage: theme === 'dark' ? 'linear-gradient(to right, #fff, #999)' : 'linear-gradient(to right, #111, #444)',
                        fontFamily: "'Cal Sans', sans-serif" // Trying to simulate a branding font
                    }} className="text-gradient">
                        Notinix
                    </h1>

                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                        Structured Notes. Connected Ideas
                    </h2>

                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-muted)',
                        lineHeight: '1.6',
                        maxWidth: '600px',
                        margin: '0 auto 2rem auto'
                    }}>
                        A thoughtfully designed workspace that blends structured organization with powerful note connections, helping you manage complex ideas with clarity and confidence.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <Link to="/register" className="btn" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Get Started Free
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '2rem',
                    width: '100%',
                    marginTop: '2rem'
                }}>
                    <FeatureCard
                        icon={<Brain size={32} color="var(--accent-color)" />}
                        title="AI Understanding"
                        desc="Ask natural questions about your notes and get instant, context-aware answers."
                    />
                    <FeatureCard
                        icon={<Zap size={32} color="#F59E0B" />}
                        title="Instant Summaries"
                        desc="Turn long complicated notes into clear, concise summaries with one click."
                    />
                    <FeatureCard
                        icon={<Shield size={32} color="#10B981" />}
                        title="Secure Storage"
                        desc="Your notes are encrypted and stored securely. Only you have access."
                    />
                </div>
            </div>
        </Layout>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="card" style={{
        textAlign: 'left',
        transition: 'transform 0.2s',
        cursor: 'default'
    }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <div style={{ marginBottom: '1rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{desc}</p>
    </div>
);

export default Landing;
