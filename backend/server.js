// Load environment variables FIRST
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Verify critical environment variables
if (!process.env.MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://service-now-tan.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'SlotSwapper API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    mongodb: 'connected'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/swaps', require('./routes/swaps'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path 
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log('=================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

module.exports = app;
