require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const path         = require('path');                
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

connectDB();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      [
        "'self'",
        "'unsafe-inline'",              // allows your <script> block
        "https://cdnjs.cloudflare.com", // allows html2canvas CDN
        "https://fonts.googleapis.com"
      ],
      scriptSrcAttr:  ["'unsafe-inline'"],  // allows onclick="..." handlers
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com"],
      imgSrc:         ["'self'", "data:", "blob:", "https:"], // iTunes artwork
      mediaSrc:       ["'self'", "https:"],  // iTunes 30-sec preview MP3s
      connectSrc:     ["'self'"],
    }
  }
}));

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100 }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Serve frontend static files ───────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend'))); 

// ── API Routes ────────────────────────────────────────────────
app.use('/api/health',      require('./routes/health'));
app.use('/api/search',      require('./routes/search'));
app.use('/api/tapes',       require('./routes/tapes'));
app.use('/api/collections', require('./routes/collections'));

app.use('/exports',      express.static(path.join(__dirname, 'exports'))); // serve saved images
app.use('/api/exports',  require('./routes/exports'));

// ── 404 for API routes only ───────────────────────────────────
app.use('/api/*splat', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Fallback: serve index.html for all non-API routes ─────────
app.get('*splat', (req, res) => {                                   
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});