const express = require('express');
const Groq = require('groq-sdk');
const Flashcard = require('../models/Flashcard');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Generate flashcards from document
router.post('/generate/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { count = 10, difficulty = 'medium' } = req.body;

    const document = await Document.findOne({
      _id: documentId,
      user: req.userId
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI that creates educational flashcards. Generate ${count} flashcards with questions and answers based on the document content. Format your response as a JSON array with objects containing "question" and "answer" fields. Make questions clear and answers concise but complete. Difficulty level: ${difficulty}.`
        },
        {
          role: 'user',
          content: `Create ${count} flashcards from this document:\n\nTitle: ${document.title}\n\nContent:\n${document.content.substring(0, 6000)}\n\nReturn ONLY a valid JSON array of flashcard objects.`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    
    // Extract JSON from response
    let flashcardsData;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      flashcardsData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({ message: 'Error parsing AI response' });
    }

    // Create flashcard documents
    const flashcards = await Flashcard.insertMany(
      flashcardsData.map(fc => ({
        question: fc.question,
        answer: fc.answer,
        document: documentId,
        user: req.userId,
        difficulty,
        category: document.title
      }))
    );

    res.json({
      message: 'Flashcards generated successfully',
      flashcards
    });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ message: 'Error generating flashcards' });
  }
});

// Get all flashcards for a document
router.get('/document/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { favorite } = req.query;

    let query = {
      document: documentId,
      user: req.userId
    };

    if (favorite === 'true') {
      query.isFavorite = true;
    }

    const flashcards = await Flashcard.find(query)
      .sort({ createdAt: -1 })
      .populate('document', 'title');

    res.json(flashcards);
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all user flashcards
router.get('/', auth, async (req, res) => {
  try {
    const { favorite, difficulty } = req.query;

    let query = { user: req.userId };

    if (favorite === 'true') {
      query.isFavorite = true;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const flashcards = await Flashcard.find(query)
      .sort({ createdAt: -1 })
      .populate('document', 'title');

    res.json(flashcards);
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle favorite
router.patch('/:id/favorite', auth, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    flashcard.isFavorite = !flashcard.isFavorite;
    await flashcard.save();

    res.json(flashcard);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update flashcard review
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { correct } = req.body;

    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    flashcard.reviewCount += 1;
    if (correct) {
      flashcard.correctCount += 1;
    }
    flashcard.lastReviewed = new Date();
    
    // Calculate next review date based on spaced repetition
    const daysToAdd = correct ? Math.min(flashcard.correctCount * 2, 30) : 1;
    flashcard.nextReview = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    await flashcard.save();

    res.json(flashcard);
  } catch (error) {
    console.error('Review flashcard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete flashcard
router.delete('/:id', auth, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;