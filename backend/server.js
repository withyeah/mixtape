require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Connect Database ──────────────────────────────────────────
connectDB();

// ── Security Middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests, slow down.' }
});
app.use('/api/', limiter);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/health',      require('./routes/health'));
// These will be added in later phases:
// app.use('/api/spotify',   require('./routes/spotify'));
// app.use('/api/tapes',     require('./routes/tapes'));
// app.use('/api/collections', require('./routes/collections'));

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});