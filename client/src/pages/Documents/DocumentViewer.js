import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Nav, Form, InputGroup } from 'react-bootstrap';

const DocumentViewer = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('viewer');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchDocument = useCallback(async () => {
    try {
      const response = await axios.get(`/documents/${id}`);
      setDocument(response.data);
      setSummary(response.data.summary);
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
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await axios.post(`/ai/chat/${id}`, {
        message: chatInput
      });

      const aiMessage = { role: 'assistant', content: response.data.response };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await axios.post(`/ai/summarize/${id}`);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Summary error:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const generateFlashcards = async () => {
    try {
      await axios.post(`/flashcards/generate/${id}`, {
        count: 10,
        difficulty: 'medium'
      });
      alert('Flashcards generated successfully!');
    } catch (error) {
      console.error('Flashcard generation error:', error);
      alert('Failed to generate flashcards. Please try again.');
    }
  };

  const generateQuiz = async () => {
    try {
      await axios.post(`/quizzes/generate/${id}`, {
        questionCount: 5,
        difficulty: 'medium'
      });
      alert('Quiz generated successfully!');
    } catch (error) {
      console.error('Quiz generation error:', error);
      alert('Failed to generate quiz. Please try again.');
    }
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

  if (!document) {
    return (
      <Container className="text-center py-5">
        <i className="bi bi-file-earmark-text display-1 text-muted mb-3"></i>
        <h3 className="h5 fw-medium mb-3">Document not found</h3>
        <Link to="/documents">
          <Button variant="primary">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Documents
          </Button>
        </Link>
      </Container>
    );
  }

  const tabs = [
    { id: 'viewer', name: 'PDF Viewer', icon: 'file-earmark-pdf' },
    { id: 'chat', name: 'AI Chat', icon: 'chat-dots' },
    { id: 'summary', name: 'Summary', icon: 'stars' },
  ];

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <Link to="/documents" className="text-decoration-none text-muted me-3">
              <i className="bi bi-arrow-left fs-4"></i>
            </Link>
            <div>
              <h1 className="h3 fw-bold mb-1">{document.title}</h1>
              <p className="text-muted mb-0">
                {document.pageCount} pages • {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Col>
        <Col xs="auto">
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={generateFlashcards}
            >
              <i className="bi bi-mortarboard me-2"></i>
              Generate Flashcards
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={generateQuiz}
            >
              <i className="bi bi-question-circle me-2"></i>
              Generate Quiz
            </Button>
          </div>
        </Col>
      </Row>

      {/* Tabs */}
      <Nav variant="tabs" className="mb-4">
        {tabs.map((tab) => (
          <Nav.Item key={tab.id}>
            <Nav.Link
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ cursor: 'pointer' }}
            >
              <i className={`bi bi-${tab.icon} me-2`}></i>
              {tab.name}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {/* Tab Content */}
      <Card className="shadow-sm">
        <Card.Body>
          {activeTab === 'viewer' && (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-pdf display-1 text-muted mb-4"></i>
              <h3 className="h5 fw-medium mb-3">PDF Viewer</h3>
              <p className="text-muted mb-4">
                PDF viewing functionality would be implemented here using react-pdf or similar library.
              </p>
              <Button
                variant="primary"
                href={`http://localhost:5000/api/documents/${id}/file`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open PDF in New Tab
              </Button>
            </div>
          )}

          {activeTab === 'chat' && (
            <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
              <div className="flex-grow-1 overflow-auto p-3 mb-3" style={{ maxHeight: '400px' }}>
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-chat-dots display-1 mb-3"></i>
                    <p>Start a conversation about this document!</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`d-flex ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                      >
                        <div
                          className={`px-3 py-2 rounded ${
                            message.role === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-light text-dark'
                          }`}
                          style={{ maxWidth: '70%' }}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="d-flex justify-content-start">
                        <div className="bg-light px-3 py-2 rounded">
                          <div className="d-flex gap-1">
                            <div className="spinner-grow spinner-grow-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="spinner-grow spinner-grow-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="spinner-grow spinner-grow-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Form onSubmit={handleChat} className="border-top pt-3">
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about this document..."
                    disabled={chatLoading}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={chatLoading || !chatInput.trim()}
                  >
                    Send
                  </Button>
                </InputGroup>
              </Form>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              {summary ? (
                <div>
                  <h3 className="h5 fw-semibold mb-4">Document Summary</h3>
                  <div className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                    {summary}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-stars display-1 text-muted mb-4"></i>
                  <h3 className="h5 fw-medium mb-3">No Summary Available</h3>
                  <p className="text-muted mb-4">
                    Generate an AI-powered summary of this document.
                  </p>
                  <Button
                    variant="primary"
                    onClick={generateSummary}
                    disabled={summaryLoading}
                  >
                    {summaryLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      'Generate Summary'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DocumentViewer;