// Demo data and routes for when MongoDB is not available
const express = require('express');
const router = express.Router();

// Demo dashboard data
router.get('/dashboard', (req, res) => {
  res.json({
    overview: {
      totalDocuments: 3,
      totalFlashcards: 15,
      totalQuizzes: 2,
      totalQuizAttempts: 5,
      favoriteFlashcards: 3,
      averageQuizScore: 85,
      studyDaysThisMonth: 12
    },
    recentActivity: {
      documents: [
        {
          _id: '1',
          title: 'Introduction to Machine Learning',
          createdAt: new Date().toISOString(),
          fileSize: 2048000
        },
        {
          _id: '2',
          title: 'React Development Guide',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          fileSize: 1536000
        }
      ],
      quizAttempts: [
        {
          _id: '1',
          quiz: { title: 'ML Basics Quiz' },
          score: 90,
          correctAnswers: 9,
          totalQuestions: 10,
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          quiz: { title: 'React Components Quiz' },
          score: 80,
          correctAnswers: 4,
          totalQuestions: 5,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      chats: [
        {
          _id: '1',
          title: 'ML Concepts Discussion',
          document: { title: 'Introduction to Machine Learning' },
          updatedAt: new Date().toISOString()
        }
      ]
    }
  });
});

// Demo documents
router.get('/documents', (req, res) => {
  res.json({
    documents: [
      {
        _id: '1',
        title: 'Introduction to Machine Learning',
        originalName: 'ml-intro.pdf',
        fileSize: 2048000,
        pageCount: 45,
        tags: ['machine learning', 'AI', 'basics'],
        isFavorite: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'React Development Guide',
        originalName: 'react-guide.pdf',
        fileSize: 1536000,
        pageCount: 32,
        tags: ['react', 'javascript', 'frontend'],
        isFavorite: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: '3',
        title: 'Node.js Best Practices',
        originalName: 'nodejs-practices.pdf',
        fileSize: 1024000,
        pageCount: 28,
        tags: ['nodejs', 'backend', 'javascript'],
        isFavorite: false,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ],
    totalPages: 1,
    currentPage: 1,
    total: 3
  });
});

// Demo flashcards
router.get('/flashcards', (req, res) => {
  res.json([
    {
      _id: '1',
      question: 'What is machine learning?',
      answer: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.',
      difficulty: 'medium',
      category: 'Machine Learning',
      isFavorite: true,
      reviewCount: 5,
      correctCount: 4,
      successRate: 80,
      lastReviewed: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      question: 'What is a React component?',
      answer: 'A React component is a reusable piece of code that returns JSX elements to be rendered to the page. Components can be functional or class-based.',
      difficulty: 'easy',
      category: 'React',
      isFavorite: false,
      reviewCount: 3,
      correctCount: 3,
      successRate: 100,
      lastReviewed: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);
});

// Demo quizzes
router.get('/quizzes', (req, res) => {
  res.json([
    {
      _id: '1',
      title: 'Machine Learning Basics Quiz',
      difficulty: 'medium',
      questions: [
        {
          question: 'What is supervised learning?',
          options: [
            'Learning with labeled data',
            'Learning without any data',
            'Learning with unlabeled data',
            'Learning with reinforcement'
          ],
          correctAnswer: 0,
          explanation: 'Supervised learning uses labeled training data to learn a mapping from inputs to outputs.'
        }
      ],
      timeLimit: 30,
      category: 'Machine Learning',
      createdAt: new Date().toISOString()
    }
  ]);
});

// Demo quiz attempts
router.get('/quiz-attempts', (req, res) => {
  res.json([
    {
      _id: '1',
      quiz: { title: 'Machine Learning Basics Quiz' },
      score: 90,
      correctAnswers: 9,
      totalQuestions: 10,
      timeSpent: 1200,
      createdAt: new Date().toISOString()
    }
  ]);
});

module.exports = router;