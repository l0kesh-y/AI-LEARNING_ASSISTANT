import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, MessageSquare, ChevronLeft, Send, Sparkles } from 'lucide-react';
import { API_URL } from '../../config/api';

const DocumentViewer = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchDocument = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocument(data);
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const inputText = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/ai/chat/${id}`, {
        message: inputText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const aiMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Error: Could not get response' };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/ai/summarize/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(data.summary);
    } catch (error) {
      alert('Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const generateFlashcards = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/flashcards/generate/${id}`, {
        count: 10, difficulty: 'medium'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Flashcards generated! Check your Flashcards page.');
    } catch (error) {
      alert('Failed to generate flashcards');
    }
  };

  const generateQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/quizzes/generate/${id}`, {
        questionCount: 5, difficulty: 'medium'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Quiz generated! Check your Quizzes page.');
    } catch (error) {
      alert('Failed to generate quiz');
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <p>Loading document...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="main-content">
        <p>Document not found</p>
        <Link to="/documents">Back to Documents</Link>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Link to="/documents" className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <ChevronLeft size={18} />
        <span>Back to Documents</span>
      </Link>

      <h1>{document.title}</h1>
      <p>{document.pageCount} pages • {new Date(document.createdAt).toLocaleDateString()}</p>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className="btn btn-success" onClick={generateFlashcards}>
          <Sparkles size={18} />
          <span>Generate Flashcards</span>
        </button>
        <button className="btn btn-success" onClick={generateQuiz}>
          <Sparkles size={18} />
          <span>Generate Quiz</span>
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageSquare size={18} />
          <span>Ask AI</span>
        </button>
        <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <FileText size={18} />
          <span>Summary</span>
        </button>
      </div>

      {activeTab === 'chat' && (
        <div className="card">
          <h2>Ask Questions</h2>
          <p style={{ marginBottom: '1.5rem' }}>Get instant answers about your document</p>
          <div className="chat-container">
            {chatMessages.length === 0 ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>
                Start asking questions about your document...
              </p>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  <div className="chat-sender">{msg.role === 'user' ? 'You' : 'AI'}</div>
                  <div className="chat-bubble">{msg.content}</div>
                </div>
              ))
            )}
            {chatLoading && <p style={{ color: '#4F46E5', fontStyle: 'italic' }}>AI is thinking...</p>}
          </div>
          <form onSubmit={handleChat} className="chat-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={chatLoading}
            />
            <button type="submit" className="btn btn-primary" disabled={chatLoading || !chatInput.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="card">
          <h2>Document Summary</h2>
          {summary ? (
            <p style={{ lineHeight: '1.8', color: '#4B5563' }}>{summary}</p>
          ) : (
            <div>
              <p>No summary yet. Generate one to get key insights.</p>
              <button onClick={generateSummary} disabled={summaryLoading} className="btn btn-primary">
                {summaryLoading ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
