import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { BookOpenIcon, MicrophoneIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const QUESTION_TIME = 60; // seconds per question (5 min / 5 questions)
const SESSION_SECONDS = 300; // 5 minutes total

// ─── Main Revision Page ────────────────────────────────────────────────────────
const Revision = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [session, setSession] = useState(null); // { questions, documentTitle }
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    axios.get('/documents', { params: { limit: 50 } })
      .then(r => setDocuments(r.data.documents || []))
      .catch(console.error)
      .finally(() => setDocsLoading(false));
  }, []);

  const startSession = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    try {
      const res = await axios.post(`/revision/generate/${selectedDoc._id}`, { count: 5 });
      setSession(res.data);
    } catch (err) {
      alert('Failed to generate revision questions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return (
      <RevisionSession
        session={session}
        onExit={() => setSession(null)}
      />
    );
  }

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="h2 fw-bold text-dark mb-1">Revision Module</h1>
          <p className="text-muted mb-0">
            Practice speaking your answers — questions from your notes, 5 minutes per session.
          </p>
        </Col>
      </Row>

      {/* How it works */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 bg-primary bg-opacity-10">
            <Card.Body>
              <Row className="text-center g-3">
                {[
                  { icon: '📄', title: 'Pick a Document', desc: 'Select notes you want to revise' },
                  { icon: '🎤', title: 'Speak Your Answers', desc: 'AI asks questions, you answer aloud' },
                  { icon: '⏱️', title: '5 Minute Session', desc: '5 questions, 1 minute each' },
                  { icon: '✅', title: 'Get Feedback', desc: 'AI scores and explains each answer' },
                ].map((step, i) => (
                  <Col key={i} xs={6} md={3}>
                    <div className="fs-2 mb-2">{step.icon}</div>
                    <div className="fw-semibold small">{step.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{step.desc}</div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Document Selection */}
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Select a Document to Revise</h5>
        </Card.Header>
        <Card.Body>
          {docsLoading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
          ) : documents.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No documents found. Upload a PDF first from the Documents page.
            </Alert>
          ) : (
            <>
              <Row className="g-3 mb-4">
                {documents.map(doc => (
                  <Col key={doc._id} xs={12} md={6} lg={4}>
                    <Card
                      className={`h-100 cursor-pointer ${selectedDoc?._id === doc._id ? 'border-primary border-2' : ''}`}
                      onClick={() => setSelectedDoc(doc)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body>
                        <div className="d-flex align-items-start gap-3">
                          <DocumentTextIcon
                            style={{ width: 28, height: 28, flexShrink: 0 }}
                            className={selectedDoc?._id === doc._id ? 'text-primary' : 'text-muted'}
                          />
                          <div className="overflow-hidden">
                            <div className="fw-semibold text-truncate">{doc.title}</div>
                            <div className="text-muted small">{doc.pageCount} pages</div>
                          </div>
                          {selectedDoc?._id === doc._id && (
                            <Badge bg="primary" className="ms-auto flex-shrink-0">Selected</Badge>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <div className="d-flex justify-content-end">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!selectedDoc || loading}
                  onClick={startSession}
                >
                  {loading ? (
                    <><Spinner animation="border" size="sm" className="me-2" />Generating questions...</>
                  ) : (
                    <><BookOpenIcon style={{ width: 20, height: 20 }} className="me-2" />Start Revision Session</>
                  )}
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

// ─── Active Revision Session ───────────────────────────────────────────────────
const RevisionSession = ({ session, onExit }) => {
  const { questions, documentTitle, documentId } = session;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('question'); // 'question' | 'recording' | 'evaluating' | 'result' | 'done'
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [recognition, setRecognition] = useState(null);

  const currentQ = questions[currentIndex];

  // ── Global 5-minute countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'done') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // ── Per-question countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'recording') return;
    setQuestionTimeLeft(QUESTION_TIME);
    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          stopListeningAndEvaluate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex]);

  // ── Speech Recognition setup ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let finalTranscript = '';

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interim += t;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    rec.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setIsListening(false);
    };

    rec.onend = () => setIsListening(false);

    rec.start();
    setRecognition(rec);
    setIsListening(true);
    setPhase('recording');
    setTranscript('');
  }, []);

  const stopListeningAndEvaluate = useCallback(async () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
    setPhase('evaluating');

    const spokenAnswer = transcript.trim() || '(no answer provided)';

    try {
      const res = await axios.post('/revision/evaluate', {
        question: currentQ.question,
        keyPoints: currentQ.keyPoints,
        spokenAnswer,
        documentId
      });
      setEvaluation(res.data);
      setSessionResults(prev => [...prev, { question: currentQ, spokenAnswer, evaluation: res.data }]);
      setPhase('result');
    } catch (err) {
      console.error('Evaluation error:', err);
      setPhase('result');
      setEvaluation({ score: 0, feedback: 'Could not evaluate. Please try again.', passed: false, coveredPoints: [], missedPoints: [] });
    }
  }, [recognition, transcript, currentQ, documentId]);

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('done');
    } else {
      setCurrentIndex(prev => prev + 1);
      setEvaluation(null);
      setTranscript('');
      setPhase('question');
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const totalScore = sessionResults.length
    ? Math.round(sessionResults.reduce((a, r) => a + (r.evaluation?.score || 0), 0) / sessionResults.length)
    : 0;

  // ── DONE screen ────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={8}>
            <Card className="shadow text-center">
              <Card.Body className="p-5">
                <div className="display-1 mb-3">{totalScore >= 60 ? '🎉' : '💪'}</div>
                <h2 className="fw-bold mb-1">Session Complete!</h2>
                <p className="text-muted mb-4">{documentTitle}</p>

                <div className={`display-4 fw-bold mb-2 text-${totalScore >= 80 ? 'success' : totalScore >= 60 ? 'warning' : 'danger'}`}>
                  {totalScore}%
                </div>
                <p className="text-muted mb-4">Average Score ({sessionResults.length} questions answered)</p>

                {/* Per-question summary */}
                <div className="text-start mb-4">
                  {sessionResults.map((r, i) => (
                    <Card key={i} className="mb-3 border-0 bg-light">
                      <Card.Body className="py-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-semibold small">Q{i + 1}: {r.question.question.substring(0, 60)}…</span>
                          <Badge bg={r.evaluation.score >= 80 ? 'success' : r.evaluation.score >= 60 ? 'warning' : 'danger'}>
                            {r.evaluation.score}%
                          </Badge>
                        </div>
                        <p className="text-muted small mb-0">{r.evaluation.feedback}</p>
                      </Card.Body>
                    </Card>
                  ))}
                </div>

                <Button variant="primary" onClick={onExit}>Back to Revision</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // ── Active session ─────────────────────────────────────────────────────────
  return (
    <Container className="py-4">
      {/* Session header */}
      <Row className="align-items-center mb-3">
        <Col>
          <div className="fw-semibold">{documentTitle}</div>
          <div className="text-muted small">Question {currentIndex + 1} of {questions.length}</div>
        </Col>
        <Col xs="auto" className="d-flex align-items-center gap-3">
          <div className={`fw-bold ${timeLeft < 60 ? 'text-danger' : 'text-muted'}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
          <Button variant="outline-danger" size="sm" onClick={onExit}>Exit</Button>
        </Col>
      </Row>

      {/* Progress */}
      <ProgressBar
        now={((currentIndex) / questions.length) * 100}
        className="mb-4"
        style={{ height: 6 }}
      />

      <Row className="justify-content-center">
        <Col xs={12} md={9} lg={7}>

          {/* Question card */}
          <Card className="shadow-sm mb-4">
            <Card.Body className="p-4 text-center">
              <Badge bg="secondary" className="mb-3">
                {currentQ.difficulty}
              </Badge>
              <h3 className="fw-bold mb-0" style={{ lineHeight: 1.4 }}>
                {currentQ.question}
              </h3>
            </Card.Body>
          </Card>

          {/* Phase: ready to answer */}
          {phase === 'question' && (
            <div className="text-center">
              <p className="text-muted mb-4">Press the mic and speak your answer clearly. You have 60 seconds.</p>
              <Button variant="primary" size="lg" onClick={startListening} className="rounded-circle p-4">
                <MicrophoneIcon style={{ width: 32, height: 32 }} />
              </Button>
              <div className="mt-3 text-muted small">Tap to start recording</div>
            </div>
          )}

          {/* Phase: recording */}
          {phase === 'recording' && (
            <div className="text-center">
              <div className="mb-3">
                <div className={`d-inline-flex align-items-center justify-content-center rounded-circle p-4 bg-danger text-white ${isListening ? 'pulse-animation' : ''}`}>
                  <MicrophoneIcon style={{ width: 32, height: 32 }} />
                </div>
              </div>

              <ProgressBar
                now={(questionTimeLeft / QUESTION_TIME) * 100}
                variant={questionTimeLeft < 15 ? 'danger' : 'success'}
                className="mb-3"
                style={{ height: 8 }}
              />
              <div className="text-muted small mb-3">{questionTimeLeft}s remaining</div>

              {transcript && (
                <Card className="mb-3 text-start border-0 bg-light">
                  <Card.Body className="py-2 px-3">
                    <p className="small text-muted mb-1">Your answer (live):</p>
                    <p className="mb-0">{transcript}</p>
                  </Card.Body>
                </Card>
              )}

              <Button variant="danger" onClick={stopListeningAndEvaluate}>
                Stop & Submit Answer
              </Button>
            </div>
          )}

          {/* Phase: evaluating */}
          {phase === 'evaluating' && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-muted">Evaluating your answer…</p>
            </div>
          )}

          {/* Phase: result */}
          {phase === 'result' && evaluation && (
            <div>
              {/* Score */}
              <Card className={`mb-3 border-0 bg-${evaluation.score >= 80 ? 'success' : evaluation.score >= 60 ? 'warning' : 'danger'} bg-opacity-10`}>
                <Card.Body className="d-flex align-items-center gap-3 p-4">
                  <div className={`h2 fw-bold mb-0 text-${evaluation.score >= 80 ? 'success' : evaluation.score >= 60 ? 'warning' : 'danger'}`}>
                    {evaluation.score}%
                  </div>
                  <div>
                    <div className="fw-semibold">{evaluation.passed ? '✅ Good answer!' : '❌ Needs improvement'}</div>
                    <p className="text-muted small mb-0">{evaluation.feedback}</p>
                  </div>
                </Card.Body>
              </Card>

              {/* Your answer */}
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <div className="fw-semibold mb-1 small text-muted">Your answer:</div>
                  <p className="mb-0 small">{sessionResults.at(-1)?.spokenAnswer}</p>
                </Card.Body>
              </Card>

              {/* Covered / Missed */}
              <Row className="g-3 mb-4">
                {evaluation.coveredPoints?.length > 0 && (
                  <Col xs={12} md={6}>
                    <Card className="border-0 bg-success bg-opacity-10 h-100">
                      <Card.Body>
                        <div className="fw-semibold small text-success mb-2">✅ Covered</div>
                        <ul className="small mb-0 ps-3">
                          {evaluation.coveredPoints.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
                {evaluation.missedPoints?.length > 0 && (
                  <Col xs={12} md={6}>
                    <Card className="border-0 bg-danger bg-opacity-10 h-100">
                      <Card.Body>
                        <div className="fw-semibold small text-danger mb-2">❌ Missed</div>
                        <ul className="small mb-0 ps-3">
                          {evaluation.missedPoints.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>

              <div className="d-flex justify-content-between">
                <div className="text-muted small align-self-center">
                  {currentIndex + 1 < questions.length
                    ? `${questions.length - currentIndex - 1} question(s) remaining`
                    : 'Last question'}
                </div>
                <Button variant="primary" onClick={nextQuestion}>
                  {currentIndex + 1 < questions.length ? 'Next Question →' : 'View Results'}
                </Button>
              </div>
            </div>
          )}

        </Col>
      </Row>

      {/* Pulse animation style */}
      <style>{`
        .pulse-animation {
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,53,69,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(220,53,69,0); }
        }
      `}</style>
    </Container>
  );
};

export default Revision;
