const express      = require('express');
const mongoose     = require('mongoose');
const Document     = require('../models/Document');
const Flashcard    = require('../models/Flashcard');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const ChatHistory  = require('../models/ChatHistory');
const auth         = require('../middleware/auth');
const { cache, key, invalidateUser } = require('../utils/cache');

const router = express.Router();

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId    = mongoose.Types.ObjectId.createFromHexString
      ? mongoose.Types.ObjectId.createFromHexString(req.userId)
      : new mongoose.Types.ObjectId(req.userId);

    const cacheKey  = key('dashboard', req.userId);
    const cached    = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Run ALL queries in parallel — including the aggregate
    const [
      totalDocuments,
      totalFlashcards,
      totalQuizzes,
      totalQuizAttempts,
      favoriteFlashcards,
      recentDocuments,
      recentQuizAttempts,
      recentChats,
      quizScores,
      activityDocs,
      activityQuizzes,
      activityChats,
    ] = await Promise.all([
      Document.countDocuments({ user: userId }),
      Flashcard.countDocuments({ user: userId }),
      Quiz.countDocuments({ user: userId }),
      QuizAttempt.countDocuments({ user: userId }),
      Flashcard.countDocuments({ user: userId, isFavorite: true }),
      Document.find({ user: userId }).sort({ createdAt: -1 }).limit(5)
        .select('title createdAt fileSize').lean(),
      QuizAttempt.find({ user: userId }).sort({ createdAt: -1 }).limit(5)
        .populate('quiz', 'title').lean(),
      ChatHistory.find({ user: userId }).sort({ updatedAt: -1 }).limit(5)
        .populate('document', 'title').lean(),
      QuizAttempt.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]),
      Document.find({ user: userId, createdAt: { $gte: thirtyDaysAgo } })
        .select('createdAt').lean(),
      QuizAttempt.find({ user: userId, createdAt: { $gte: thirtyDaysAgo } })
        .select('createdAt').lean(),
      ChatHistory.find({ user: userId, updatedAt: { $gte: thirtyDaysAgo } })
        .select('updatedAt').lean(),
    ]);

    const averageQuizScore = quizScores.length > 0 ? Math.round(quizScores[0].avgScore) : 0;

    const activityDates = new Set();
    [...activityDocs, ...activityQuizzes, ...activityChats].forEach(item => {
      activityDates.add((item.createdAt || item.updatedAt).toDateString());
    });

    const result = {
      overview: {
        totalDocuments, totalFlashcards, totalQuizzes, totalQuizAttempts,
        favoriteFlashcards, averageQuizScore,
        studyDaysThisMonth: activityDates.size
      },
      recentActivity: {
        documents: recentDocuments,
        quizAttempts: recentQuizAttempts,
        chats: recentChats
      }
    };

    cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId   = mongoose.Types.ObjectId.createFromHexString
      ? mongoose.Types.ObjectId.createFromHexString(req.userId)
      : new mongoose.Types.ObjectId(req.userId);
    const { period = '30' } = req.query;
    const cacheKey = key('analytics', req.userId, period);
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    const [quizPerformance, flashcardStats, documentActivity, studyTime] = await Promise.all([
      QuizAttempt.aggregate([
        { $match: { user: userId, createdAt: { $gte: daysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, avgScore: { $avg: '$score' }, totalAttempts: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Flashcard.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$difficulty', count: { $sum: 1 }, avgSuccessRate: { $avg: { $cond: [{ $eq: ['$reviewCount', 0] }, 0, { $multiply: [{ $divide: ['$correctCount', '$reviewCount'] }, 100] }] } } } }
      ]),
      Document.aggregate([
        { $match: { user: userId, createdAt: { $gte: daysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, totalSize: { $sum: '$fileSize' } } },
        { $sort: { _id: 1 } }
      ]),
      ChatHistory.aggregate([
        { $match: { user: userId, updatedAt: { $gte: daysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, sessions: { $sum: 1 }, messages: { $sum: { $size: '$messages' } } } },
        { $sort: { _id: 1 } }
      ]),
    ]);

    const result = { quizPerformance, flashcardStats, documentActivity, studyTime };
    cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Goals ─────────────────────────────────────────────────────────────────────
router.get('/goals', auth, async (req, res) => {
  try {
    const userId   = req.userId;
    const cacheKey = key('goals', userId);
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [weeklyDocuments, weeklyQuizzes, weeklyFlashcards, weeklyStudyTime] = await Promise.all([
      Document.countDocuments({ user: userId, createdAt: { $gte: weekStart } }),
      QuizAttempt.countDocuments({ user: userId, createdAt: { $gte: weekStart } }),
      Flashcard.countDocuments({ user: userId, lastReviewed: { $gte: weekStart } }),
      ChatHistory.countDocuments({ user: userId, updatedAt: { $gte: weekStart } }),
    ]);

    const goals = {
      documents:    { target: 3,  current: weeklyDocuments },
      quizzes:      { target: 5,  current: weeklyQuizzes },
      flashcards:   { target: 20, current: weeklyFlashcards },
      studySessions:{ target: 10, current: weeklyStudyTime },
    };

    cache.set(cacheKey, goals, 60);
    res.json(goals);
  } catch (error) {
    console.error('Goals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
