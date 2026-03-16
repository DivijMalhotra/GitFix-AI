require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repos');
const debugRoutes = require('./routes/debug');
const prRoutes = require('./routes/pullrequests');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security Middleware ─────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── General Middleware ──────────────────────────────────
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Database ────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-debugger')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/pullrequests', prRoutes);

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
});

module.exports = app;
