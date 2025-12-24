import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Spinner, Badge } from 'react-bootstrap';

const Progress = () => {
  const [analytics, setAnalytics] = useState(null);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get('/progress/analytics', {
        params: { period }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, [period]);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await axios.get('/progress/goals');
      setGoals(response.data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchGoals();
  }, [fetchAnalytics, fetchGoals]);

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'info';
    return 'danger';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" className="spinner-border-custom" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col md={8}>
          <h1 className="h2 fw-bold mb-1">Progress & Analytics</h1>
          <p className="text-muted">Track your learning journey and achievements</p>
        </Col>
        <Col md={4} className="d-flex align-items-center justify-content-md-end">
          <Form.Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Weekly Goals */}
      {goals && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h2 className="h5 fw-semibold mb-4">
              <i className="bi bi-trophy me-2"></i>
              Weekly Goals
            </h2>
            <Row className="g-3">
              {Object.entries(goals).map(([key, goal]) => {
                const percentage = getProgressPercentage(goal.current, goal.target);
                return (
                  <Col key={key} xs={12} md={6} lg={3}>
                    <Card className="bg-light border-0 h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h3 className="small fw-medium mb-0 text-capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <Badge bg="secondary" className="small">
                            {goal.current}/{goal.target}
                          </Badge>
                        </div>
                        <div className="progress progress-custom mb-2">
                          <div
                            className={`progress-bar bg-${getProgressColor(percentage)}`}
                            role="progressbar"
                            style={{ width: `${percentage}%` }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <p className="small text-muted mb-0">{Math.round(percentage)}% complete</p>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Quiz Performance */}
      {analytics?.quizPerformance && analytics.quizPerformance.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h2 className="h5 fw-semibold mb-4">
              <i className="bi bi-bar-chart me-2"></i>
              Quiz Performance Over Time
            </h2>
            <div className="d-flex flex-column gap-3">
              {analytics.quizPerformance.map((day) => (
                <Card key={day._id} className="bg-light border-0">
                  <Card.Body className="d-flex justify-content-between align-items-center py-3">
                    <div>
                      <p className="small fw-medium mb-1">
                        {new Date(day._id).toLocaleDateString()}
                      </p>
                      <p className="small text-muted mb-0">{day.totalAttempts} attempts</p>
                    </div>
                    <div className="text-end">
                      <p className={`h5 fw-bold mb-0 ${
                        day.avgScore >= 80 ? 'text-success' :
                        day.avgScore >= 60 ? 'text-warning' : 'text-danger'
                      }`}>
                        {Math.round(day.avgScore)}%
                      </p>
                      <p className="small text-muted mb-0">avg score</p>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Flashcard Statistics */}
      {analytics?.flashcardStats && analytics.flashcardStats.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h2 className="h5 fw-semibold mb-4">
              <i className="bi bi-mortarboard me-2"></i>
              Flashcard Performance by Difficulty
            </h2>
            <Row className="g-3">
              {analytics.flashcardStats.map((stat) => (
                <Col key={stat._id} xs={12} md={4}>
                  <Card className="bg-light border-0 text-center h-100">
                    <Card.Body>
                      <h3 className={`h5 fw-semibold text-capitalize mb-2 ${
                        stat._id === 'easy' ? 'text-success' :
                        stat._id === 'medium' ? 'text-warning' : 'text-danger'
                      }`}>
                        {stat._id}
                      </h3>
                      <p className="h2 fw-bold mb-1">{stat.count}</p>
                      <p className="small text-muted mb-2">cards</p>
                      <p className="small text-muted mb-0">
                        {Math.round(stat.avgSuccessRate)}% success rate
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Document Activity */}
      {analytics?.documentActivity && analytics.documentActivity.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h2 className="h5 fw-semibold mb-4">
              <i className="bi bi-fire me-2"></i>
              Document Upload Activity
            </h2>
            <div className="d-flex flex-column gap-3">
              {analytics.documentActivity.map((day) => (
                <Card key={day._id} className="bg-light border-0">
                  <Card.Body className="d-flex justify-content-between align-items-center py-3">
                    <div>
                      <p className="small fw-medium mb-1">
                        {new Date(day._id).toLocaleDateString()}
                      </p>
                      <p className="small text-muted mb-0">
                        {(day.totalSize / 1024 / 1024).toFixed(1)} MB uploaded
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="h5 fw-bold text-primary mb-0">{day.count}</p>
                      <p className="small text-muted mb-0">documents</p>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Study Time */}
      {analytics?.studyTime && analytics.studyTime.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h2 className="h5 fw-semibold mb-4">
              <i className="bi bi-clock-history me-2"></i>
              Study Sessions
            </h2>
            <div className="d-flex flex-column gap-3">
              {analytics.studyTime.map((day) => (
                <Card key={day._id} className="bg-light border-0">
                  <Card.Body className="d-flex justify-content-between align-items-center py-3">
                    <div>
                      <p className="small fw-medium mb-1">
                        {new Date(day._id).toLocaleDateString()}
                      </p>
                      <p className="small text-muted mb-0">{day.messages} messages exchanged</p>
                    </div>
                    <div className="text-end">
                      <p className="h5 fw-bold mb-0" style={{ color: '#6f42c1' }}>{day.sessions}</p>
                      <p className="small text-muted mb-0">sessions</p>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Empty State */}
      {(!analytics || Object.values(analytics).every(arr => arr.length === 0)) && (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-bar-chart display-1 text-muted mb-3"></i>
            <h3 className="h5 fw-medium mb-2">No analytics data</h3>
            <p className="text-muted mb-0">
              Start using the app to see your progress and analytics here.
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Progress;