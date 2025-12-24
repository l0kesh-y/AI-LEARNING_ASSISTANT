const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  correctCount: {
    type: Number,
    default: 0
  },
  lastReviewed: {
    type: Date,
    default: null
  },
  nextReview: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Calculate success rate
flashcardSchema.virtual('successRate').get(function() {
  if (this.reviewCount === 0) return 0;
  return Math.round((this.correctCount / this.reviewCount) * 100);
});

module.exports = mongoose.model('Flashcard', flashcardSchema);