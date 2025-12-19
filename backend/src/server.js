const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Gubs Backend API is running!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Game routes
const gameRoutes = require('./routes/gameRoutes');
app.use('/api/games', gameRoutes);

// Initialize Socket.IO handlers
const { initializeSocketHandlers } = require('./socket/socketHandlers');
initializeSocketHandlers(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to verify`);
  console.log(`Socket.IO is ready for connections`);
});
