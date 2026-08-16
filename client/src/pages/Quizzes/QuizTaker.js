import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { API_URL } from '../../config/api';

const QuizTaker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const fetchQuiz = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuiz(data);
      setTimeLeft(data.timeLimit * 60);
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const submitQuiz = useCallback(async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const answersArray = quiz.questions.map((_, index) => answers[index] ?? -1);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/quizzes/${id}/attempt`, {
        answers: answersArray,
        timeSpent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(data.results);
      setQuizCompleted(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  }, [id, startTime, quiz, answers]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizCompleted, submitQuiz]);

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(Date.now());
  };

  const selectAnswer = (questionIndex, answerIndex) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="main-content">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="main-content">
        <p>Quiz not found</p>
        <button onClick={() => navigate('/quizzes')}>Back to Quizzes</button>
      </div>
    );
  }

  if (quizCompleted && results) {
    const scoreClass = results.score >= 70 ? 'excellent' : results.score >= 50 ? 'good' : results.score >= 30 ? 'average' : 'poor';

    return (
      <div className="main-content">
        <div className="quiz-results-header">
          <h2>Quiz Complete!</h2>
          <div className={`quiz-score ${scoreClass}`}>{results.score}%</div>
          <p>Correct: {results.correctAnswers} / {results.totalQuestions}</p>
        </div>

        <h3>Results Review</h3>
        {results.answers.map((answer, index) => (
          <div key={index} className={`result-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
            <div className={`result-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
              {answer.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
              <span>{answer.isCorrect ? 'Correct' : 'Incorrect'}</span>
            </div>
            <p><strong>Q{index + 1}: {answer.question}</strong></p>
            <p><strong>Your answer:</strong> {answer.options[answer.selectedAnswer]}</p>
            {!answer.isCorrect && <p><strong>Correct answer:</strong> {answer.options[answer.correctAnswer]}</p>}
            {answer.explanation && <div className="result-explanation"><strong>Explanation:</strong> {answer.explanation}</div>}
          </div>
        ))}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/quizzes')} className="btn btn-secondary">Back to Quizzes</button>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Retake Quiz</button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="main-content">
        <button onClick={() => navigate('/quizzes')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          <ChevronLeft size={18} />
          <span>Back to Quizzes</span>
        </button>

        <div className="card quiz-start-card">
          <h1>{quiz.title}</h1>
          <p>Test your knowledge with {quiz.questions.length} questions</p>

          <div className="quiz-meta">
            <div className="quiz-meta-item">
              <label>Questions</label>
              <span>{quiz.questions.length}</span>
            </div>
            <div className="quiz-meta-item">
              <label>Time Limit</label>
              <span>{quiz.timeLimit} min</span>
            </div>
            <div className="quiz-meta-item">
              <label>Difficulty</label>
              <span className={`difficulty-badge difficulty-${quiz.difficulty?.toLowerCase() || 'medium'}`}>{quiz.difficulty}</span>
            </div>
          </div>

          <p style={{ color: '#6B7280', marginTop: '1rem' }}>
            You'll have {quiz.timeLimit} minutes to complete all questions. Good luck!
          </p>

          <button onClick={startQuiz} className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="main-content">
      <div className="quiz-header">
        <h1>{quiz.title}</h1>
        <div className="quiz-timer" style={{ color: timeLeft < 60 ? '#EF4444' : 'inherit' }}>
          <Clock size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1, #4F46E5)' }}></div>
        </div>
      </div>

      <div className="quiz-question-card">
        <h3>{question.question}</h3>

        <div className="quiz-options">
          {question.options.map((option, index) => (
            <div 
              key={index} 
              className={`quiz-option ${answers[currentQuestion] === index ? 'selected' : ''}`}
              onClick={() => selectAnswer(currentQuestion, index)}
            >
              <input
                type="radio"
                id={`option-${index}`}
                name={`question-${currentQuestion}`}
                checked={answers[currentQuestion] === index}
                onChange={() => selectAnswer(currentQuestion, index)}
              />
              <label htmlFor={`option-${index}`}>{option}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="quiz-controls">
        <button onClick={prevQuestion} disabled={currentQuestion === 0} className="btn btn-secondary">
          <ChevronLeft size={18} />
          <span>Previous</span>
        </button>

        {currentQuestion === quiz.questions.length - 1 ? (
          <button onClick={submitQuiz} className="btn btn-primary">
            <span>Submit Quiz</span>
            <CheckCircle size={18} />
          </button>
        ) : (
          <button onClick={nextQuestion} className="btn btn-secondary">
            <span>Next</span>
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizTaker;
