const express = require('express');
const Groq = require('groq-sdk');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Generate quiz from document
router.post('/generate/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { questionCount = 5, difficulty = 'medium', timeLimit = 30 } = req.body;

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
          content: `You are an AI that creates educational multiple-choice quizzes. Generate ${questionCount} questions with 4 options each, where only one option is correct. Include explanations for correct answers. Format as JSON array with objects containing: "question", "options" (array of 4 strings), "correctAnswer" (0-3 index), "explanation", "difficulty". Difficulty: ${difficulty}.`
        },
        {
          role: 'user',
          content: `Create a ${questionCount}-question multiple choice quiz from this document:\n\nTitle: ${document.title}\n\nContent:\n${document.content.substring(0, 6000)}\n\nReturn ONLY a valid JSON array of question objects.`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 3000
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    
    let questionsData;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      questionsData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({ message: 'Error parsing AI response' });
    }

    // Create quiz
    const quiz = new Quiz({
      title: `${document.title} - Quiz`,
      document: documentId,
      user: req.userId,
      questions: questionsData,
      difficulty,
      timeLimit,
      category: document.title
    });

    await quiz.save();

    res.json({
      message: 'Quiz generated successfully',
      quiz
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ message: 'Error generating quiz' });
  }
});

// Get all quizzes for a document
router.get('/document/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const quizzes = await Quiz.find({
      document: documentId,
      user: req.userId
    }).sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all user quizzes
router.get('/', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('document', 'title');

    res.json(quizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single quiz
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('document', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit quiz attempt
router.post('/:id/attempt', auth, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findOne({
      _id: quizId,
      user: req.userId
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    const detailedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      const isCorrect = answer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionIndex: index,
        selectedAnswer: answer,
        isCorrect,
        timeSpent: 0 // Could be tracked per question
      };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    // Create quiz attempt
    const attempt = new QuizAttempt({
      quiz: quizId,
      user: req.userId,
      answers: detailedAnswers,
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      timeSpent
    });

    await attempt.save();

    // Populate quiz details for response
    await attempt.populate('quiz', 'title questions');

    res.json({
      message: 'Quiz submitted successfully',
      attempt,
      results: {
        score,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        percentage: score,
        answers: detailedAnswers.map((ans, index) => ({
          ...ans,
          question: quiz.questions[index].question,
          correctAnswer: quiz.questions[index].correctAnswer,
          explanation: quiz.questions[index].explanation,
          options: quiz.questions[index].options
        }))
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Error submitting quiz' });
  }
});

// Get quiz attempts for a quiz
router.get('/:id/attempts', auth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      quiz: req.params.id,
      user: req.userId
    }).sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all user quiz attempts
router.get('/attempts/all', auth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('quiz', 'title')
      .limit(50);

    res.json(attempts);
  } catch (error) {
    console.error('Get all attempts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete quiz
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Delete associated attempts
    await QuizAttempt.deleteMany({ quiz: req.params.id });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;