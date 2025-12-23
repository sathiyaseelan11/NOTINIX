import React from 'react';
import { useTheme } from '../context/ThemeContext';

const LoadingScreen = ({ fullScreen = false }) => {
    const { theme } = useTheme();

    return (
        <div className={`flex items-center justify-center ${fullScreen ? 'fixed inset-0 z-[9999] bg-[var(--background)]' : 'h-full w-full min-h-[400px]'}`}>
            <div className="relative flex flex-col items-center justify-center">
                {/* Premium Glow Effect */}
                <div className="absolute w-48 h-48 bg-[var(--primary)]/20 rounded-full blur-[80px] animate-pulse"></div>

                {/* The Rotating Logo Symbol */}
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                    <img
                        src={theme === 'dark' ? '/logo-dark.ico' : '/logo-light.ico'}
                        alt="Loading..."
                        className={`w-full h-full object-contain animate-logo-rotate-premium drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]`}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
