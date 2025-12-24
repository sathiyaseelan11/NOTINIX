const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();

connectDB();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Serve Static Files
app.use('/uploads', express.static('uploads'));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
}



// Import Routes
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const importRoutes = require('./routes/importRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const taskRoutes = require('./routes/taskRoutes');
const knowledgeGraphRoutes = require('./routes/knowledgeGraphRoutes');
const syncRoutes = require('./routes/syncRoutes');
const automationRoutes = require('./routes/automationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.get('/', (req, res) => {
    res.send('Notinix API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/import', importRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/graph', knowledgeGraphRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/upload', uploadRoutes);

// Catch-all route to serve the frontend for any non-API routes
app.get(/.*/, (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    } else {
        res.status(404).json({ message: 'Not found in development mode. Please use the Vite dev server on port 5173.' });
    }
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_note', (noteId) => {
        socket.join(noteId);
        console.log(`User ${socket.id} joined note: ${noteId}`);
    });

    socket.on('leave_note', (noteId) => {
        socket.leave(noteId);
    });

    socket.on('cursor_move', (data) => {
        // Broadcast to others in the same note room
        socket.to(data.noteId).emit('remote_cursor_move', data);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 5001;

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, server };
