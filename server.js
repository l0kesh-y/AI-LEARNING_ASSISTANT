const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const compression = require('compression');
require('dotenv').config();

const app = express();

// ── 1. GZip compression for all JSON / text responses ────────────────────────
//    Compresses payloads >1KB. Reduces wire size ~40-70% for JSON.
app.use(compression({ level: 6, threshold: 1024 }));

// ── 2. CORS ───────────────────────────────────────────────────────────────────
app.use(cors());

// ── 3. Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── 4. Static files with long-lived cache headers ────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));

// ── 5. API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/flashcards',require('./routes/flashcards'));
app.use('/api/quizzes',   require('./routes/quizzes'));
app.use('/api/progress',  require('./routes/progress'));
app.use('/api/revision',  require('./routes/revision'));

// ── 6. MongoDB connection with tuned pool ─────────────────────────────────────
//    minPoolSize keeps warm connections ready, maxPoolSize handles concurrency.
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-learning-assistant', {
  minPoolSize: 5,
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// ── 7. Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── 8. React build — serve with aggressive caching for hashed assets ──────────
app.use(express.static(path.join(__dirname, 'client/build'), {
  maxAge: '1y',        // hashed JS/CSS bundles are immutable
  etag: true
}));

app.get('*', (req, res) => {
  // index.html must NOT be cached (it references hashed bundles)
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Backend API available at http://localhost:${PORT}/api`);
});
