import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Nav } from 'react-bootstrap';
import axios from 'axios';
import {
  QuestionMarkCircleIcon,
  PlayIcon,
  TrashIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quizzes');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quizzesResponse, attemptsResponse] = await Promise.all([
        axios.get('/quizzes'),
        axios.get('/quizzes/attempts/all')
      ]);
      setQuizzes(quizzesResponse.data);
      setAttempts(attemptsResponse.data);
    } catch (error) {
      console.error('Failed to fetch quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await axios.delete(`/quizzes/${quizId}`);
        fetchData();
      } catch (error) {
        console.error('Failed to delete quiz:', error);
      }
    }
  };

  const getDifficultyVariant = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'secondary';
    }
  };

  const getScoreVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div>
            <h1 className="h2 fw-bold text-dark mb-1">Quizzes</h1>
            <p className="text-muted mb-0">Test your knowledge with AI-generated quizzes</p>
          </div>
        </Col>
      </Row>

      {/* Tabs */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'quizzes'} 
            onClick={() => setActiveTab('quizzes')}
          >
            Available Quizzes ({quizzes.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'attempts'} 
            onClick={() => setActiveTab('attempts')}
          >
            Quiz History ({attempts.length})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Tab Content */}
      {activeTab === 'quizzes' && (
        <>
          {/* Stats */}
          {quizzes.length > 0 && (
            <Row className="mb-4">
              <Col xs={6} md={4}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-primary fw-bold">{quizzes.length}</h3>
                    <small className="text-muted">Total Quizzes</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={4}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-success fw-bold">{attempts.length}</h3>
                    <small className="text-muted">Attempts Made</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-warning fw-bold">
                      {attempts.length > 0 
                        ? Math.round(attempts.reduce((acc, att) => acc + att.score, 0) / attempts.length)
                        : 0
                      }%
                    </h3>
                    <small className="text-muted">Average Score</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Quizzes Grid */}
          <Row>
            {quizzes.map((quiz) => (
              <Col key={quiz._id} xs={12} md={6} lg={4} className="mb-4">
                <Card className="h-100 card-hover">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Badge bg={getDifficultyVariant(quiz.difficulty)}>
                        {quiz.difficulty}
                      </Badge>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-1 text-muted"
                        onClick={() => deleteQuiz(quiz._id)}
                      >
                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                      </Button>
                    </div>

                    <h5 className="card-title mb-3" style={{ minHeight: '3rem' }}>
                      {quiz.title}
                    </h5>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Questions:</span>
                        <span>{quiz.questions.length}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Time Limit:</span>
                        <span>{quiz.timeLimit} minutes</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted">
                        <span>Created:</span>
                        <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Link to={`/quiz/${quiz._id}`} className="text-decoration-none">
                      <Button variant="primary" className="w-100 d-flex align-items-center justify-content-center">
                        <PlayIcon className="me-2" style={{ width: '16px', height: '16px' }} />
                        Take Quiz
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {quizzes.length === 0 && (
            <div className="text-center py-5">
              <QuestionMarkCircleIcon className="text-muted mx-auto mb-3" style={{ width: '48px', height: '48px' }} />
              <h5 className="text-muted">No quizzes available</h5>
              <p className="text-muted">
                Upload a document and generate quizzes to get started.
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'attempts' && (
        <div>
          {attempts.map((attempt) => (
            <Card key={attempt._id} className="mb-3">
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs={12} md={8}>
                    <div className="d-flex align-items-center">
                      <ChartBarIcon className="text-primary me-3" style={{ width: '32px', height: '32px' }} />
                      <div>
                        <h6 className="fw-bold mb-1">
                          {attempt.quiz?.title || 'Quiz'}
                        </h6>
                        <small className="text-muted">
                          {new Date(attempt.createdAt).toLocaleDateString()} at{' '}
                          {new Date(attempt.createdAt).toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} md={4} className="text-md-end mt-2 mt-md-0">
                    <h4 className={`fw-bold mb-1 text-${getScoreVariant(attempt.score)}`}>
                      {attempt.score}%
                    </h4>
                    <div className="small text-muted">
                      {attempt.correctAnswers}/{attempt.totalQuestions} correct
                    </div>
                    <div className="small text-muted d-flex align-items-center justify-content-md-end">
                      <ClockIcon className="me-1" style={{ width: '12px', height: '12px' }} />
                      {Math.floor(attempt.timeSpent / 60)}:{(attempt.timeSpent % 60).toString().padStart(2, '0')}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}

          {attempts.length === 0 && (
            <div className="text-center py-5">
              <ChartBarIcon className="text-muted mx-auto mb-3" style={{ width: '48px', height: '48px' }} />
              <h5 className="text-muted">No quiz attempts</h5>
              <p className="text-muted">
                Take some quizzes to see your results here.
              </p>
            </div>
          )}
        </div>
      )}
    </Container>
  );
};

export default Quizzes;