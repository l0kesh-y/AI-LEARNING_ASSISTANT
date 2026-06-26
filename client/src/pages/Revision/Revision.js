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
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="#000000" d="M3 1h12.414L21 6.586V23H3V1Zm2 2v18h14V9h-6V3H5Zm10 .414V7h3.586L15 3.414Z"/></svg>, title: 'Pick a Document', desc: 'Select notes you want to revise' },
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 352 512"><path fill="#000000" d="M176 341q45 0 76-31t31-75V107q0-45-31-76T176 0t-76 31t-31 76v128q0 44 31 75t76 31zm-64-234q0-28 18.5-46T176 43t45.5 18t18.5 46v128q0 27-18.5 45.5T176 299t-45.5-18.5T112 235V107zm235 128v-64q0-22-22-22q-9 0-15 6t-6 16v64q0 53-38 90.5T176 363t-90-37.5T48 235v-64q0-10-6-16t-15-6q-22 0-22 22v64q0 65 43 112.5T155 403v45q0 7-5.5 12t-11.5 7l-5 2q-17 0-29.5 13T91 512h170q0-17-12.5-30T219 469q-22-6-22-21v-45q64-8 107-55.5T347 235z"/></svg>, title: 'Speak Your Answers', desc: 'AI asks questions, you answer aloud' },
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 16 16" fill="#000000"><g fill="#000000" fill-rule="evenodd"><path d="m12.115 2.612l.525-.812l.85.554l.484-.75L11.527.011l-.483.75l.849.553l-.512.788A7.394 7.394 0 0 0 7.502.999C3.387.999.041 4.352.041 8.475c0 4.12 3.346 7.474 7.461 7.474c4.113 0 7.461-3.354 7.461-7.474a7.463 7.463 0 0 0-2.848-5.863zM7.502 14.011c-3.047 0-5.527-2.488-5.527-5.544c0-3.058 2.48-5.545 5.527-5.545s5.527 2.487 5.527 5.545c0 3.055-2.48 5.544-5.527 5.544z"/><path d="M7 4h1v5H7z"/><path d="M7 8h3v1H7z"/></g></svg>, title: '5 Minute Session', desc: '5 questions, 1 minute each' },
                  { icon: <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#000000" fill-rule="evenodd" d="M224.815 85.323c-.094-32.021-37.478-42.657-75.482-42.657L96 139.733l-53.333 30.925v128.007l157.7 27.515c4.96.639 9.592.931 13.924.931c45.085 0 57.574-31.975 62.553-44.722c9.693-24.877 17.748-69.811 20.75-86.964l.029-.098c3.216-19.174-1.058-36.633-12.023-49.169c-6.838-7.814-15.993-13.424-26.592-16.199c-4.934-1.292-10.181-1.97-15.653-1.97h-27.862s4.339-17.17 7.605-29.894c1.179-4.593 1.729-8.844 1.717-12.772m28.676 88.932c-1.279-1.461-4.205-3.6-10.136-3.6h-82.652q2.64-10.45 5.275-20.902l.012-.047l.001-.002c5.04-19.985 10.081-39.971 15.195-59.938l-7.821-2.235l-45.69 83.154l-42.342 24.552v67.56l121.329 21.169c2.897.342 5.428.477 7.629.477c6.116 0 9.656-1.059 11.533-1.85c1.865-.786 3.173-1.765 4.289-2.906c2.754-2.817 4.561-6.61 6.982-12.806c7.821-20.072 15.227-60.274 18.471-78.813l.095-.54c1.236-8.36-1.105-12.052-2.17-13.273m-27.09 191.587c-4.435-5.071-7.776-10.947-9.969-17.417c16.991-.317 30.877-4.397 42.084-10.675c1.282 1.462 4.208 3.594 10.13 3.594h82.652l-13.427 53.133l-.009.038l-.038.149l-.144.57l-.539 2.129l-1.855 7.318a8918 8918 0 0 1-4.471 17.552c1.9.73 4.472 1.522 7.821 2.235l39.971-72.747l5.719-10.407l10.273-5.957l32.069-18.596v-67.559l-113.733-19.844c2.443-12.003 4.318-22.525 5.466-29.067l.051-.172l.211-1.261a96 96 0 0 0 1.238-11.596l149.433 26.073v128.007l-53.333 30.925l-53.333 97.067c-38.004 0-75.388-10.636-75.482-42.657c-.012-3.928.538-8.179 1.717-12.772c3.267-12.725 7.605-29.894 7.605-29.894h-27.862c-5.472 0-10.719-.678-15.653-1.97c-10.599-2.775-19.753-8.385-26.592-16.199" clip-rule="evenodd"/></svg>, title: 'Get Feedback', desc: 'AI scores and explains each answer' },
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
