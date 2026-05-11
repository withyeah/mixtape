require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const path         = require('path');                    // ← ADD
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100 }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Serve frontend static files ───────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));  // ← ADD

// ── API Routes ────────────────────────────────────────────────
app.use('/api/health',      require('./routes/health'));
app.use('/api/search',      require('./routes/search'));
app.use('/api/tapes',       require('./routes/tapes'));
app.use('/api/collections', require('./routes/collections'));

// ── 404 for API routes only ───────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Fallback: serve index.html for all non-API routes ─────────
app.get('*', (req, res) => {                                   // ← ADD
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});