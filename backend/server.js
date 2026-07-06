require('dotenv').config();

// Import required modules
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');

// Import Sequelize instance and models (this also sets up associations)
const { sequelize } = require('./models');

// Import route handlers
const superadminRoutes = require('./routes/superadmin');
const adminRoutes = require('./routes/admin');
const childRoutes = require('./routes/child');

// Initialize Express application
const app = express();

// Create an HTTP server instance with Express
const server = http.createServer(app);

// Dynamic CORS origin from environment variable
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Socket.IO server with CORS and transport configurations
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware setup
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.set('io', io);

// Route middleware
app.use('/superadmin', superadminRoutes);
app.use('/admin', adminRoutes);
app.use('/child', childRoutes);

// Socket.IO connection handler for real-time updates
io.on('connection', (socket) => {
  console.log('Socket.IO client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket.IO client disconnected:', socket.id);
  });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Connect to PostgreSQL and start the server
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: process.env.NODE_ENV !== 'production' })
  .then(() => {
    console.log('✅ PostgreSQL connected & tables synced');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(1);
  });