import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import {
  AcademicCapIcon,
  HeartIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const Flashcards = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  const fetchFlashcards = useCallback(async () => {
    try {
      const response = await axios.get('/flashcards', {
        params: { favorite: showFavorites }
      });
      setFlashcards(response.data);
      setCurrentCard(0);
      setShowAnswer(false);
    } catch (error) {
      console.error('Failed to fetch flashcards:', error);
    } finally {
      setLoading(false);
    }
  }, [showFavorites]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const toggleFavorite = async (cardId, currentFavorite) => {
    try {
      await axios.patch(`/flashcards/${cardId}/favorite`);
      fetchFlashcards();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const reviewCard = async (cardId, correct) => {
    try {
      await axios.post(`/flashcards/${cardId}/review`, { correct });
      // Move to next card
      if (currentCard < flashcards.length - 1) {
        setCurrentCard(currentCard + 1);
        setShowAnswer(false);
      } else {
        setStudyMode(false);
        alert('Study session complete!');
      }
    } catch (error) {
      console.error('Failed to review card:', error);
    }
  };

  const deleteCard = async (cardId) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await axios.delete(`/flashcards/${cardId}`);
        fetchFlashcards();
      } catch (error) {
        console.error('Failed to delete flashcard:', error);
      }
    }
  };

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setShowAnswer(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (studyMode && flashcards.length > 0) {
    const card = flashcards[currentCard];
    
    return (
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Study Mode Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button
                variant="secondary"
                onClick={() => setStudyMode(false)}
              >
                Exit Study Mode
              </Button>
              <small className="text-muted">
                Card {currentCard + 1} of {flashcards.length}
              </small>
            </div>

            {/* Flashcard */}
            <Card 
              className={`flashcard mb-4 ${showAnswer ? 'flipped' : ''}`}
              onClick={() => setShowAnswer(!showAnswer)}
              style={{ cursor: 'pointer', minHeight: '300px' }}
            >
              <Card.Body className="d-flex align-items-center justify-content-center text-center p-5">
                {!showAnswer ? (
                  <div>
                    <h4 className="fw-bold text-primary mb-4">Question</h4>
                    <p className="fs-5 mb-4">{card.question}</p>
                    <small className="text-muted">Click to reveal answer</small>
                  </div>
                ) : (
                  <div>
                    <h4 className="fw-bold text-success mb-4">Answer</h4>
                    <p className="fs-5">{card.answer}</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Study Controls */}
            {showAnswer && (
              <div className="d-flex justify-content-center gap-3 mb-4">
                <Button
                  variant="danger"
                  onClick={() => reviewCard(card._id, false)}
                >
                  Incorrect
                </Button>
                <Button
                  variant="success"
                  onClick={() => reviewCard(card._id, true)}
                >
                  Correct
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="d-flex justify-content-between">
              <Button
                variant="outline-secondary"
                onClick={prevCard}
                disabled={currentCard === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline-secondary"
                onClick={nextCard}
                disabled={currentCard === flashcards.length - 1}
              >
                Next
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold text-dark mb-1">Flashcards</h1>
              <p className="text-muted mb-0">Review and study your flashcards</p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant={showFavorites ? "danger" : "outline-secondary"}
                onClick={() => setShowFavorites(!showFavorites)}
                className="d-flex align-items-center"
              >
                <HeartIcon className="me-2" style={{ width: '16px', height: '16px' }} />
                {showFavorites ? 'Show All' : 'Favorites Only'}
              </Button>
              {flashcards.length > 0 && (
                <Button
                  variant="primary"
                  onClick={() => setStudyMode(true)}
                  className="d-flex align-items-center"
                >
                  <AcademicCapIcon className="me-2" style={{ width: '16px', height: '16px' }} />
                  Start Study Session
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats */}
      {flashcards.length > 0 && (
        <Row className="mb-4">
          <Col xs={6} md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary fw-bold">{flashcards.length}</h3>
                <small className="text-muted">Total Cards</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success fw-bold">
                  {flashcards.filter(card => card.isFavorite).length}
                </h3>
                <small className="text-muted">Favorites</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning fw-bold">
                  {Math.round(
                    flashcards.reduce((acc, card) => acc + (card.successRate || 0), 0) / flashcards.length
                  ) || 0}%
                </h3>
                <small className="text-muted">Avg Success Rate</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info fw-bold">
                  {flashcards.reduce((acc, card) => acc + card.reviewCount, 0)}
                </h3>
                <small className="text-muted">Total Reviews</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Flashcards Grid */}
      <Row>
        {flashcards.map((card) => (
          <Col key={card._id} xs={12} md={6} lg={4} className="mb-4">
            <Card className="h-100 card-hover">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <Badge 
                    bg={
                      card.difficulty === 'easy' ? 'success' :
                      card.difficulty === 'medium' ? 'warning' : 'danger'
                    }
                  >
                    {card.difficulty}
                  </Badge>
                  <div className="d-flex gap-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="p-1 text-muted"
                      onClick={() => toggleFavorite(card._id, card.isFavorite)}
                    >
                      {card.isFavorite ? (
                        <HeartSolidIcon className="text-danger" style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <HeartIcon style={{ width: '16px', height: '16px' }} />
                      )}
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-1 text-muted"
                      onClick={() => deleteCard(card._id)}
                    >
                      <TrashIcon style={{ width: '16px', height: '16px' }} />
                    </Button>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-2">Question:</h6>
                  <p className="small text-muted">{card.question}</p>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-2">Answer:</h6>
                  <p className="small text-muted">{card.answer}</p>
                </div>

                <div className="d-flex justify-content-between small text-muted">
                  <span>Reviews: {card.reviewCount}</span>
                  <span>Success: {card.successRate || 0}%</span>
                </div>

                {card.lastReviewed && (
                  <div className="small text-muted mt-2">
                    Last reviewed: {new Date(card.lastReviewed).toLocaleDateString()}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {flashcards.length === 0 && (
        <div className="text-center py-5">
          <AcademicCapIcon className="text-muted mx-auto mb-3" style={{ width: '48px', height: '48px' }} />
          <h5 className="text-muted">
            {showFavorites ? 'No favorite flashcards' : 'No flashcards'}
          </h5>
          <p className="text-muted">
            {showFavorites 
              ? 'Mark some flashcards as favorites to see them here.'
              : 'Upload a document and generate flashcards to get started.'
            }
          </p>
        </div>
      )}
    </Container>
  );
};

export default Flashcards;