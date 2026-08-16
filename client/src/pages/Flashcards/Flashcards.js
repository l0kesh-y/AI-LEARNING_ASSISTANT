import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, ChevronLeft, ChevronRight, RotateCcw, Star } from 'lucide-react';
import { API_URL } from '../../config/api';

const Flashcards = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/flashcards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(data);
    } catch (error) {
      console.error('Fetch flashcards error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/flashcards/${id}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFlashcards();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  if (loading) {
    return (
      <div className="main-content">
        <p>Loading flashcards...</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="empty-state">
        <Layers size={64} />
        <h3>No flashcards yet</h3>
        <p>Generate flashcards from your documents to start studying</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="main-content">
      <h1>Flashcards</h1>
      <p>Study with AI-generated flashcards</p>

      <div className="flashcard-container">
        <div className="flashcard-progress">
          <div className="progress-info">
            <span>Card {currentIndex + 1} of {flashcards.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="flashcard" onClick={() => setIsFlipped(!isFlipped)}>
          <div>
            <div className="flashcard-label">{!isFlipped ? 'Question' : 'Answer'}</div>
            <div className="flashcard-content">{!isFlipped ? currentCard.question : currentCard.answer}</div>
            <div className="flashcard-hint">Click to flip</div>
          </div>
        </div>

        <div className="flashcard-controls">
          <button onClick={handlePrevious} disabled={flashcards.length === 1} className="btn btn-secondary">
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>
          <button onClick={() => setIsFlipped(!isFlipped)} className="btn btn-primary">
            <RotateCcw size={18} />
            <span>Flip</span>
          </button>
          <button onClick={handleNext} disabled={flashcards.length === 1} className="btn btn-secondary">
            <span>Next</span>
            <ChevronRight size={18} />
          </button>
          <button 
            onClick={() => toggleFavorite(currentCard._id)} 
            className={`btn ${currentCard.isFavorite ? 'btn-success' : 'btn-ghost'}`}
          >
            <Star size={18} fill={currentCard.isFavorite ? 'currentColor' : 'none'} />
            <span>{currentCard.isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
