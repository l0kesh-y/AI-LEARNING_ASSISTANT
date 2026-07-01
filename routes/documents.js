const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const { cache, key, invalidateUser } = require('../utils/cache');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Get upload limit status for the current user
router.get('/upload-status', auth, async (req, res) => {
  try {
    const uploadLimit = parseInt(process.env.PDF_UPLOAD_LIMIT) || 5;
    const currentCount = await Document.countDocuments({ user: req.userId });
    res.json({ uploadLimit, currentCount, remaining: Math.max(uploadLimit - currentCount, 0) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload and process PDF
router.post('/upload', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Enforce per-user upload limit
    const uploadLimit = parseInt(process.env.PDF_UPLOAD_LIMIT) || 5;
    const existingCount = await Document.countDocuments({ user: req.userId });
    if (existingCount >= uploadLimit) {
      // Clean up the uploaded temp file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        message: `Upload limit reached. You can upload a maximum of ${uploadLimit} PDFs. Delete an existing document to upload a new one.`,
        uploadLimit,
        currentCount: existingCount
      });
    }

    const { title, tags } = req.body;
    
    // Parse PDF content
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    
    // Convert PDF to base64 for storage
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Create document record
    const document = new Document({
      title: title || req.file.originalname.replace('.pdf', ''),
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      content: pdfData.text,
      pdfData: pdfBase64,
      pageCount: pdfData.numpages,
      user: req.userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      processingStatus: 'completed'
    });

    await document.save();
    
    // Clean up local file after saving to DB
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Invalidate caches that depend on document counts
    invalidateUser('dashboard', req.userId);
    invalidateUser('goals', req.userId);
    invalidateUser('analytics', req.userId);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        title: document.title,
        originalName: document.originalName,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        tags: document.tags,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if processing failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Error processing document' });
  }
});

// Get all user documents
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tags } = req.query;
    
    // Create cache key based on query params
    const cacheKey = key('documents', req.userId, JSON.stringify(req.query));
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);
    
    let query = { user: req.userId };
    
    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Add tag filtering
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const documents = await Document.find(query)
      .select('-content -pdfData') // Exclude heavy fields for list view
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Document.countDocuments(query);

    const result = {
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
    
    cache.set(cacheKey, result, 30);
    res.json(result);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single document
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update document
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, tags, isFavorite } = req.body;
    
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { 
        title, 
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        isFavorite 
      },
      { new: true, runValidators: true }
    ).select('-content');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete document from database
    await Document.findByIdAndDelete(req.params.id);

    // Invalidate caches
    invalidateUser('dashboard', req.userId);
    invalidateUser('goals', req.userId);
    invalidateUser('analytics', req.userId);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve PDF file from database
router.get('/:id/file', async (req, res) => {
  try {
    // Check for token in header or query parameter
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const document = await Document.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.pdfData) {
      return res.status(404).json({ message: 'PDF data not available' });
    }

    // Convert base64 back to buffer
    const pdfBuffer = Buffer.from(document.pdfData, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;