import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="container flex-1 flex flex-col mx-auto" style={{ padding: '2rem 1rem' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
