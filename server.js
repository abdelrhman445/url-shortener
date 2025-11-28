const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// Dynamic BASE_URL configuration
if (!process.env.BASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    process.env.BASE_URL = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://your-app-name.vercel.app';
  } else {
    process.env.BASE_URL = 'http://localhost:3000';
  }
}

console.log('🌐 BASE_URL:', process.env.BASE_URL);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'src/public')));
app.use(cookieParser());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Security middleware
const securityMiddleware = require('./src/middleware/security');
app.use(securityMiddleware);

// ==================== 🚀 إضافة route الـ logout السهل ====================
app.get('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
    sameSite: 'lax'
  });
  
  res.redirect('/login');
});
// ==================== نهاية إضافة route الـ logout ====================

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Routes
app.use('/', require('./src/routes/auth'));
app.use('/dashboard', require('./src/routes/dashboard'));
app.use('/admin', require('./src/routes/admin'));
app.use('/', require('./src/routes/redirect'));

// Health check endpoint for Vercel
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  res.status(500).render('500');
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).render('404');
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/urlshortener';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log('📊 Database:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('🔧 Please check your MONGODB_URI environment variable');
});

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

const PORT = process.env.PORT || 3000;

// Start server only if not in Vercel's serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Note: Admin users must be created manually through registration or database`);
  });
}

// Export for Vercel
module.exports = app;
