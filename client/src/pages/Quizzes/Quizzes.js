import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CheckSquare, Trash2, Play } from 'lucide-react';
import { API_URL } from '../../config/api';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(data);
    } catch (error) {
      console.error('Fetch quizzes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quiz?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuizzes();
    } catch (error) {
      alert('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <p>Loading quizzes...</p>
      </div>
    );
  }

  const getDifficultyClass = (difficulty) => {
    return `difficulty-${difficulty?.toLowerCase() || 'medium'}`;
  };

  return (
    <div className="main-content">
      <h1>My Quizzes</h1>
      <p>Test your knowledge with AI-generated quizzes</p>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={64} />
          <h3>No quizzes yet</h3>
          <p>Generate quizzes from your documents to test your knowledge</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Difficulty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckSquare size={18} style={{ color: '#9CA3AF' }} />
                      <span className="table-title">{quiz.title}</span>
                    </div>
                  </td>
                  <td>{quiz.questions?.length || 0} questions</td>
                  <td>{quiz.timeLimit} min</td>
                  <td>
                    <span className={`difficulty-badge ${getDifficultyClass(quiz.difficulty)}`}>
                      {quiz.difficulty?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/quiz/${quiz._id}`} className="btn btn-ghost" style={{ padding: '0.375rem 0.5rem' }}>
                        <Play size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(quiz._id)} 
                        className="btn btn-danger"
                        style={{ padding: '0.375rem 0.5rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Quizzes;
