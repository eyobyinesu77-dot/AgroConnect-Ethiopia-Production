
// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
console.log('CORS configured:', { hasClientUrl: Boolean(process.env.CLIENT_URL) });
const allowedOrigins = (
  process.env.CLIENT_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Serves local uploads when Cloudinary is not configured
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('🚀 Server is starting...');

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/extension', require('./routes/extensionRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/weather-advisories', require('./routes/weatherAdvisoryRoutes'));
app.use('/api/advice', require('./routes/adviceRoutes'));
app.use('/api/trainings', require('./routes/trainingRoutes'));
app.use('/api/field-conditions', require('./routes/fieldConditionRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));

// Health check / test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is running! 🚀' });
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Start HTTP server only when running locally.
// Vercel imports the Express app as a Serverless Function.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  });
}

// Export Express app for Vercel
module.exports = app;

// Last-resort safety nets
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
