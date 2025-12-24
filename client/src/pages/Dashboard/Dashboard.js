import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import {
  DocumentTextIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/progress/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  const statCards = [
    {
      name: 'Documents',
      value: stats?.overview?.totalDocuments || 0,
      icon: DocumentTextIcon,
      color: 'primary',
      link: '/documents'
    },
    {
      name: 'Flashcards',
      value: stats?.overview?.totalFlashcards || 0,
      icon: AcademicCapIcon,
      color: 'success',
      link: '/flashcards'
    },
    {
      name: 'Quizzes',
      value: stats?.overview?.totalQuizzes || 0,
      icon: QuestionMarkCircleIcon,
      color: 'info',
      link: '/quizzes'
    },
    {
      name: 'Avg Quiz Score',
      value: `${stats?.overview?.averageQuizScore || 0}%`,
      icon: ChartBarIcon,
      color: 'warning',
      link: '/progress'
    }
  ];

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold text-dark mb-1">Dashboard</h1>
              <p className="text-muted mb-0">Welcome back! Here's your learning progress.</p>
            </div>
            <Link to="/documents">
              <Button variant="primary" className="d-flex align-items-center">
                <PlusIcon className="me-2" style={{ width: '20px', height: '20px' }} />
                Upload Document
              </Button>
            </Link>
          </div>
        </Col>
      </Row>

      {/* Stats Grid */}
      <Row className="mb-4">
        {statCards.map((stat) => (
          <Col key={stat.name} xs={12} sm={6} lg={3} className="mb-3">
            <Link to={stat.link} className="text-decoration-none">
              <Card className="h-100 card-hover">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className={`p-3 rounded bg-${stat.color} text-white me-3`}>
                      <stat.icon style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div>
                      <p className="text-muted mb-1 small">{stat.name}</p>
                      <h4 className="fw-bold mb-0">{stat.value}</h4>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Recent Activity */}
      <Row>
        {/* Recent Documents */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Documents</h5>
              <Link to="/documents" className="text-primary text-decoration-none small">
                View all
              </Link>
            </Card.Header>
            <Card.Body>
              {stats?.recentActivity?.documents?.length > 0 ? (
                <div className="d-grid gap-3">
                  {stats.recentActivity.documents.map((doc) => (
                    <div key={doc._id} className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                      <div className="d-flex align-items-center">
                        <DocumentTextIcon className="text-muted me-3" style={{ width: '20px', height: '20px' }} />
                        <div>
                          <p className="mb-1 fw-medium">{doc.title}</p>
                          <small className="text-muted">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <small className="text-muted">
                        {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No documents yet</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Quiz Attempts */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Quiz Results</h5>
              <Link to="/quizzes" className="text-primary text-decoration-none small">
                View all
              </Link>
            </Card.Header>
            <Card.Body>
              {stats?.recentActivity?.quizAttempts?.length > 0 ? (
                <div className="d-grid gap-3">
                  {stats.recentActivity.quizAttempts.map((attempt) => (
                    <div key={attempt._id} className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                      <div className="d-flex align-items-center">
                        <QuestionMarkCircleIcon className="text-muted me-3" style={{ width: '20px', height: '20px' }} />
                        <div>
                          <p className="mb-1 fw-medium">
                            {attempt.quiz?.title || 'Quiz'}
                          </p>
                          <small className="text-muted">
                            {new Date(attempt.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className={`fw-medium ${
                          attempt.score >= 80 ? 'text-success' : 
                          attempt.score >= 60 ? 'text-warning' : 'text-danger'
                        }`}>
                          {attempt.score}%
                        </span>
                        <br />
                        <small className="text-muted">
                          {attempt.correctAnswers}/{attempt.totalQuestions}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No quiz attempts yet</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Study Goals */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">This Week's Study Goals</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col xs={6} md={3} className="mb-3">
                  <h3 className="text-primary fw-bold">
                    {stats?.overview?.studyDaysThisMonth || 0}
                  </h3>
                  <small className="text-muted">Study Days</small>
                </Col>
                <Col xs={6} md={3} className="mb-3">
                  <h3 className="text-success fw-bold">
                    {stats?.overview?.favoriteFlashcards || 0}
                  </h3>
                  <small className="text-muted">Favorite Cards</small>
                </Col>
                <Col xs={6} md={3} className="mb-3">
                  <h3 className="text-info fw-bold">
                    {stats?.overview?.totalQuizAttempts || 0}
                  </h3>
                  <small className="text-muted">Quiz Attempts</small>
                </Col>
                <Col xs={6} md={3} className="mb-3">
                  <h3 className="text-warning fw-bold">
                    {stats?.overview?.averageQuizScore || 0}%
                  </h3>
                  <small className="text-muted">Avg Score</small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;