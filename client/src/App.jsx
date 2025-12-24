import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { SocketProvider } from './context/SocketContext';
import AICommandPalette from './components/AICommandPalette';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import NoteList from './pages/NoteList';
import NoteDetail from './pages/NoteDetail';
import Calendar from './pages/Calendar';
import ChatInterface from './pages/ChatInterface';
import KnowledgeGraph from './pages/KnowledgeGraph';
import Tasks from './pages/Tasks';
import SyncPage from './pages/SyncPage';
import AutomationsPage from './pages/AutomationsPage';
import SidebarLayout from './components/layout/SidebarLayout';
import LoadingScreen from './components/LoadingScreen';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen fullScreen={true} />;
  return user ? children : <Navigate to="/landing" />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CommandPaletteProvider>
          <Router>
            <AICommandPalette />
            <AnimatedRoutes />
          </Router>
        </CommandPaletteProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/landing" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />

        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><SidebarLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="notes" element={<PageTransition><NoteList /></PageTransition>} />
          <Route path="notes/:id" element={<PageTransition><NoteDetail /></PageTransition>} />
          <Route path="chat" element={<PageTransition><ChatInterface /></PageTransition>} />
          <Route path="chat/:id" element={<PageTransition><ChatInterface /></PageTransition>} />
          <Route path="graph" element={<PageTransition><KnowledgeGraph /></PageTransition>} />
          <Route path="tasks" element={<PageTransition><Tasks /></PageTransition>} />
          <Route path="calendar" element={<PageTransition><Calendar /></PageTransition>} />
          <Route path="media" element={<PageTransition><PlaceholderPage title="Media Gallery" icon="🖼️" /></PageTransition>} />
          <Route path="shared" element={<PageTransition><PlaceholderPage title="Shared Spaces" icon="👥" /></PageTransition>} />
          <Route path="mentions" element={<PageTransition><PlaceholderPage title="Mentions & Comments" icon="💬" /></PageTransition>} />
          <Route path="automations" element={<PageTransition><AutomationsPage /></PageTransition>} />
          <Route path="sync" element={<PageTransition><SyncPage /></PageTransition>} />
          <Route path="settings" element={<PageTransition><PlaceholderPage title="Settings" icon="⚙️" /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);


// Placeholder component for future features
const PlaceholderPage = ({ title, icon }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h1 className="text-2xl font-heading font-bold text-[var(--foreground)] mb-2">{title}</h1>
      <p className="text-[var(--muted-foreground)]">This feature is coming soon!</p>
    </div>
  </div>
);

export default App;
