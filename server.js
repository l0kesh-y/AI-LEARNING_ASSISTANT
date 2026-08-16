/**
 * AI Learning Assistant - Main Server
 * 
 * Express.js backend server that provides:
 * - RESTful API endpoints for learning features
 * - MongoDB database integration
 * - JWT-based authentication
 * - AI-powered learning tools via Groq API
 * - Static file serving for React frontend
 * - Performance optimizations (compression, caching, connection pooling)
 * 
 * API Endpoints:
 * - /api/auth - User authentication and profile management
 * - /api/documents - PDF document upload and management
 * - /api/ai - AI chat, summarization, and explanations
 * - /api/flashcards - Flashcard generation and study tracking
 * - /api/quizzes - Quiz generation and attempt tracking
 * 
 * Performance Features:
 * - MongoDB connection pooling (5-20 connections)
 * - Optimized static asset caching
 */

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
require('dotenv').config(); // Load environment variables from .env file

// Create the main Express application instance
const app = express();

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. CORS (Cross-Origin Resource Sharing) ──────────────────────────────
//    Allows the React frontend to make requests to this API
//    Enables all origins in development (restrict in production)
app.use(cors());

// ── 2. Body Parsers ───────────────────────────────────────────────────────
//    Parse incoming JSON and URL-encoded request bodies
//    50MB limit to support large PDF file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── 3. Static File Serving with Caching ───────────────────────────────────
//    Serve uploaded documents with 7-day cache
//    ETag and Last-Modified headers enable conditional requests
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',       // Cache files for 7 days
  etag: true,         // Enable ETag headers for cache validation
  lastModified: true  // Enable Last-Modified headers
}));

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTE REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

// ── 4. API Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));       // User registration, login, profile
app.use('/api/documents', require('./routes/documents'));  // PDF upload, list, delete
app.use('/api/ai',        require('./routes/ai'));         // AI chat, summarization, explanations
app.use('/api/flashcards',require('./routes/flashcards')); // Flashcard generation and study
app.use('/api/quizzes',   require('./routes/quizzes'));    // Quiz generation and attempts

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════════════════════

// ── 5. MongoDB Connection with Optimized Pool Settings ───────────────────
//    Uses connection pooling for better concurrency handling
//    minPoolSize: Keep 5 warm connections ready for instant requests
//    maxPoolSize: Allow up to 20 simultaneous connections during peak load
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-learning-assistant', {
  minPoolSize: 5,                    // Minimum connections to maintain
  maxPoolSize: 20,                   // Maximum concurrent connections
  serverSelectionTimeoutMS: 5000,    // Timeout for selecting server
  socketTimeoutMS: 45000,            // Timeout for socket operations
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// ── 6. Health Check Endpoint ──────────────────────────────────────────────
//    Used by monitoring tools and deployment platforms
//    Returns server status and environment information
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REACT FRONTEND SERVING (Production)
// ═══════════════════════════════════════════════════════════════════════════

// ── 7. Serve React Build with Aggressive Caching ─────────────────────────
//    Static assets (JS, CSS) have hashed filenames and are immutable
//    Cache them for 1 year to eliminate redundant downloads
app.use(express.static(path.join(__dirname, 'client/build'), {
  maxAge: '1y',  // Cache static assets for 1 year
  etag: true     // Enable cache validation with ETags
}));

// ── 8. React Router Fallback ──────────────────────────────────────────────
//    Catch-all route for React Router (client-side routing)
//    Always serve index.html for non-API routes
//    index.html must NOT be cached (it references hashed bundles)
app.get('*', (req, res) => {
  // Prevent caching of index.html so users always get latest version
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════════════════

// Start the Express server on configured port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Backend API available at http://localhost:${PORT}/api`);
});
