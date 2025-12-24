const express = require('express');
const Document = require('../models/Document');
const Flashcard = require('../models/Flashcard');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const ChatHistory = require('../models/ChatHistory');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get counts
    const [
      totalDocuments,
      totalFlashcards,
      totalQuizzes,
      totalQuizAttempts,
      favoriteFlashcards,
      recentDocuments,
      recentQuizAttempts,
      recentChats
    ] = await Promise.all([
      Document.countDocuments({ user: userId }),
      Flashcard.countDocuments({ user: userId }),
      Quiz.countDocuments({ user: userId }),
      QuizAttempt.countDocuments({ user: userId }),
      Flashcard.countDocuments({ user: userId, isFavorite: true }),
      Document.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt fileSize'),
      QuizAttempt.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('quiz', 'title'),
      ChatHistory.find({ user: userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('document', 'title')
    ]);

    // Calculate average quiz score
    const quizScores = await QuizAttempt.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);

    const averageQuizScore = quizScores.length > 0 ? Math.round(quizScores[0].avgScore) : 0;

    // Get study streak (days with activity)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = await Promise.all([
      Document.find({ 
        user: userId, 
        createdAt: { $gte: thirtyDaysAgo } 
      }).select('createdAt'),
      QuizAttempt.find({ 
        user: userId, 
        createdAt: { $gte: thirtyDaysAgo } 
      }).select('createdAt'),
      ChatHistory.find({ 
        user: userId, 
        updatedAt: { $gte: thirtyDaysAgo } 
      }).select('updatedAt')
    ]);

    // Calculate study days
    const activityDates = new Set();
    recentActivity.flat().forEach(item => {
      const date = (item.createdAt || item.updatedAt).toDateString();
      activityDates.add(date);
    });

    res.json({
      overview: {
        totalDocuments,
        totalFlashcards,
        totalQuizzes,
        totalQuizAttempts,
        favoriteFlashcards,
        averageQuizScore,
        studyDaysThisMonth: activityDates.size
      },
      recentActivity: {
        documents: recentDocuments,
        quizAttempts: recentQuizAttempts,
        chats: recentChats
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed progress analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = '30' } = req.query; // days
    
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Quiz performance over time
    const quizPerformance = await QuizAttempt.aggregate([
      { 
        $match: { 
          user: userId, 
          createdAt: { $gte: daysAgo } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          avgScore: { $avg: "$score" },
          totalAttempts: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Flashcard review performance
    const flashcardStats = await Flashcard.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
          avgSuccessRate: { 
            $avg: { 
              $cond: [
                { $eq: ["$reviewCount", 0] },
                0,
                { $multiply: [{ $divide: ["$correctCount", "$reviewCount"] }, 100] }
              ]
            }
          }
        }
      }
    ]);

    // Document upload activity
    const documentActivity = await Document.aggregate([
      { 
        $match: { 
          user: userId, 
          createdAt: { $gte: daysAgo } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          totalSize: { $sum: "$fileSize" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Study time estimation (based on chat activity)
    const studyTime = await ChatHistory.aggregate([
      { 
        $match: { 
          user: userId, 
          updatedAt: { $gte: daysAgo } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }
          },
          sessions: { $sum: 1 },
          messages: { $sum: { $size: "$messages" } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      quizPerformance,
      flashcardStats,
      documentActivity,
      studyTime
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get learning goals and progress
router.get('/goals', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Calculate weekly goals progress
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [
      weeklyDocuments,
      weeklyQuizzes,
      weeklyFlashcards,
      weeklyStudyTime
    ] = await Promise.all([
      Document.countDocuments({ 
        user: userId, 
        createdAt: { $gte: weekStart } 
      }),
      QuizAttempt.countDocuments({ 
        user: userId, 
        createdAt: { $gte: weekStart } 
      }),
      Flashcard.countDocuments({ 
        user: userId, 
        lastReviewed: { $gte: weekStart } 
      }),
      ChatHistory.countDocuments({ 
        user: userId, 
        updatedAt: { $gte: weekStart } 
      })
    ]);

    // Default weekly goals
    const goals = {
      documents: { target: 3, current: weeklyDocuments },
      quizzes: { target: 5, current: weeklyQuizzes },
      flashcards: { target: 20, current: weeklyFlashcards },
      studySessions: { target: 10, current: weeklyStudyTime }
    };

    res.json(goals);
  } catch (error) {
    console.error('Goals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;