import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Form, Alert } from 'react-bootstrap';

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
      const response = await axios.get(`/quizzes/${id}`);
      setQuiz(response.data);
      setTimeLeft(response.data.timeLimit * 60); // Convert minutes to seconds
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
      const response = await axios.post(`/quizzes/${id}/attempt`, {
        answers: answersArray,
        timeSpent
      });
      setResults(response.data.results);
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
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
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
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary spinner-border-custom" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="text-center py-5">
        <h3 className="h5 fw-medium mb-3">Quiz not found</h3>
        <Button variant="primary" onClick={() => navigate('/quizzes')}>
          Back to Quizzes
        </Button>
      </Container>
    );
  }

  if (quizCompleted && results) {
    return (
      <Container className="py-4">
        {/* Results Header */}
        <Row className="text-center mb-4">
          <Col>
            <h1 className="display-4 fw-bold mb-3">Quiz Complete!</h1>
            <div className={`display-1 fw-bold mb-3 text-${getScoreColor(results.score)}`}>
              {results.score}%
            </div>
            <p className="text-muted">
              You got {results.correctAnswers} out of {results.totalQuestions} questions correct
            </p>
          </Col>
        </Row>

        {/* Results Summary */}
        <Row className="g-3 mb-4">
          <Col xs={12} md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <div className="h2 fw-bold text-primary">{results.score}%</div>
                <div className="small text-muted">Final Score</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <div className="h2 fw-bold text-success">{results.correctAnswers}</div>
                <div className="small text-muted">Correct Answers</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <div className="h2 fw-bold text-danger">
                  {results.totalQuestions - results.correctAnswers}
                </div>
                <div className="small text-muted">Incorrect Answers</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Detailed Results */}
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h2 className="h5 fw-bold mb-0">Review Your Answers</h2>
          </Card.Header>
          <Card.Body>
            {results.answers.map((answer, index) => (
              <Card key={index} className="mb-3 border-0 bg-light">
                <Card.Body>
                  <div className="d-flex align-items-start">
                    <div className="me-3 mt-1">
                      {answer.isCorrect ? (
                        <i className="bi bi-check-circle-fill text-success fs-5"></i>
                      ) : (
                        <i className="bi bi-x-circle-fill text-danger fs-5"></i>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <h3 className="h6 fw-semibold mb-3">
                        Question {index + 1}: {answer.question}
                      </h3>
                      
                      <div className="mb-3">
                        {answer.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded mb-2 ${
                              optionIndex === answer.correctAnswer
                                ? 'bg-success bg-opacity-10 border border-success'
                                : optionIndex === answer.selectedAnswer && !answer.isCorrect
                                ? 'bg-danger bg-opacity-10 border border-danger'
                                : 'bg-white border'
                            }`}
                          >
                            {option}
                            {optionIndex === answer.correctAnswer && (
                              <Badge bg="success" className="ms-2">Correct</Badge>
                            )}
                            {optionIndex === answer.selectedAnswer && optionIndex !== answer.correctAnswer && (
                              <Badge bg="danger" className="ms-2">Your answer</Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      {answer.explanation && (
                        <Alert variant="info" className="mb-0">
                          <strong>Explanation:</strong> {answer.explanation}
                        </Alert>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>

        {/* Actions */}
        <Row className="justify-content-center">
          <Col xs="auto">
            <Button variant="outline-primary" onClick={() => navigate('/quizzes')} className="me-3">
              Back to Quizzes
            </Button>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retake Quiz
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!quizStarted) {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Button
              variant="link"
              onClick={() => navigate('/quizzes')}
              className="text-decoration-none mb-4 p-0"
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Quizzes
            </Button>

            <Card className="shadow-sm">
              <Card.Body className="text-center">
                <h1 className="h3 fw-bold mb-4">{quiz.title}</h1>
                
                <div className="mb-4">
                  <Row className="g-3">
                    <Col xs={6}>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Questions:</span>
                        <span className="fw-medium">{quiz.questions.length}</span>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Time Limit:</span>
                        <span className="fw-medium">{quiz.timeLimit} minutes</span>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Difficulty:</span>
                        <Badge bg={
                          quiz.difficulty === 'easy' ? 'success' :
                          quiz.difficulty === 'medium' ? 'warning' : 'danger'
                        }>
                          {quiz.difficulty}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </div>

                <Alert variant="warning" className="text-start">
                  <h6 className="fw-medium mb-2">Instructions:</h6>
                  <ul className="small mb-0 ps-3">
                    <li>Answer all questions to the best of your ability</li>
                    <li>You can navigate between questions using the navigation buttons</li>
                    <li>The quiz will auto-submit when time runs out</li>
                    <li>Make sure you have a stable internet connection</li>
                  </ul>
                </Alert>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={startQuiz}
                  className="w-100"
                >
                  Start Quiz
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Container className="py-4">
      {/* Quiz Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h1 className="h4 fw-bold mb-1">{quiz.title}</h1>
          <p className="text-muted mb-0">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </Col>
        <Col xs="auto">
          <div className="d-flex align-items-center text-muted">
            <i className="bi bi-clock me-2"></i>
            <span className={timeLeft < 300 ? 'text-danger fw-bold' : ''}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </Col>
      </Row>

      {/* Progress Bar */}
      <ProgressBar 
        now={progress} 
        className="mb-4" 
        style={{ height: '8px' }}
      />

      {/* Question */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h2 className="h5 fw-semibold mb-4">
            {question.question}
          </h2>

          <div className="d-grid gap-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                onClick={() => selectAnswer(currentQuestion, index)}
                className={`quiz-option ${
                  answers[currentQuestion] === index ? 'selected' : ''
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center">
                  <Form.Check
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={answers[currentQuestion] === index}
                    onChange={() => {}} // Handled by onClick
                    className="me-3"
                  />
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Navigation */}
      <Row className="justify-content-between mb-4">
        <Col xs="auto">
          <Button
            variant="outline-secondary"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
        </Col>
        <Col xs="auto">
          {currentQuestion === quiz.questions.length - 1 ? (
            <Button
              variant="success"
              onClick={submitQuiz}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={nextQuestion}
            >
              Next
            </Button>
          )}
        </Col>
      </Row>

      {/* Question Navigator */}
      <Card className="shadow-sm">
        <Card.Body>
          <h3 className="small fw-medium mb-3">Question Navigator</h3>
          <div className="d-flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => (
              <Button
                key={index}
                variant={
                  index === currentQuestion
                    ? 'primary'
                    : answers[index] !== undefined
                    ? 'success'
                    : 'outline-secondary'
                }
                size="sm"
                onClick={() => setCurrentQuestion(index)}
                style={{ width: '40px', height: '40px' }}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QuizTaker;