import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  HeartIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get('/documents', {
        params: { search: searchTerm }
      });
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file, title, tags) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);
    formData.append('tags', tags);

    try {
      await axios.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setShowUploadModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleFavorite = async (docId, currentFavorite) => {
    try {
      await axios.put(`/documents/${docId}`, {
        isFavorite: !currentFavorite
      });
      fetchDocuments();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const deleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`/documents/${docId}`);
        fetchDocuments();
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold text-dark mb-1">Documents</h1>
              <p className="text-muted mb-0">Upload and manage your study materials</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUploadModal(true)}
              className="d-flex align-items-center"
            >
              <PlusIcon className="me-2" style={{ width: '20px', height: '20px' }} />
              Upload PDF
            </Button>
          </div>
        </Col>
      </Row>

      {/* Search */}
      <Row className="mb-4">
        <Col md={6}>
          <div className="position-relative">
            <MagnifyingGlassIcon 
              className="position-absolute text-muted" 
              style={{ 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                width: '20px', 
                height: '20px' 
              }} 
            />
            <Form.Control
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchDocuments()}
              style={{ paddingLeft: '45px' }}
            />
          </div>
        </Col>
      </Row>

      {/* Documents Grid */}
      <Row>
        {documents.map((doc) => (
          <Col key={doc._id} xs={12} md={6} lg={4} className="mb-4">
            <Card className="h-100 card-hover">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <DocumentTextIcon className="text-primary" style={{ width: '32px', height: '32px' }} />
                  <div className="d-flex gap-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="p-1 text-muted"
                      onClick={() => toggleFavorite(doc._id, doc.isFavorite)}
                    >
                      {doc.isFavorite ? (
                        <HeartSolidIcon className="text-danger" style={{ width: '20px', height: '20px' }} />
                      ) : (
                        <HeartIcon style={{ width: '20px', height: '20px' }} />
                      )}
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-1 text-muted"
                      onClick={() => deleteDocument(doc._id)}
                    >
                      <TrashIcon style={{ width: '20px', height: '20px' }} />
                    </Button>
                  </div>
                </div>

                <h5 className="card-title mb-3" style={{ minHeight: '3rem' }}>
                  {doc.title}
                </h5>

                <div className="mb-3">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Size:</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Pages:</span>
                    <span>{doc.pageCount}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted">
                    <span>Uploaded:</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="mb-3">
                    {doc.tags.map((tag, index) => (
                      <Badge key={index} bg="primary" className="me-1 mb-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Link to={`/documents/${doc._id}`} className="text-decoration-none">
                  <Button variant="primary" className="w-100 d-flex align-items-center justify-content-center">
                    <EyeIcon className="me-2" style={{ width: '16px', height: '16px' }} />
                    View Document
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {documents.length === 0 && (
        <div className="text-center py-5">
          <DocumentTextIcon className="text-muted mx-auto mb-3" style={{ width: '48px', height: '48px' }} />
          <h5 className="text-muted">No documents</h5>
          <p className="text-muted mb-4">
            Get started by uploading your first PDF document.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            className="d-flex align-items-center mx-auto"
          >
            <PlusIcon className="me-2" style={{ width: '20px', height: '20px' }} />
            Upload PDF
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        uploading={uploading}
      />
    </Container>
  );
};

const UploadModal = ({ show, onHide, onUpload, uploading }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && title) {
      onUpload(file, title, tags);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Upload PDF Document</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* File Drop Zone */}
          <div
            className={`file-upload-area mb-3 ${dragOver ? 'dragover' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="text-center">
                <DocumentTextIcon className="text-primary mx-auto mb-2" style={{ width: '48px', height: '48px' }} />
                <p className="fw-medium mb-1">{file.name}</p>
                <small className="text-muted">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </small>
              </div>
            ) : (
              <div className="text-center">
                <CloudArrowUpIcon className="text-muted mx-auto mb-2" style={{ width: '48px', height: '48px' }} />
                <p className="mb-2">
                  Drop your PDF here or{' '}
                  <Form.Label className="text-primary" style={{ cursor: 'pointer' }}>
                    browse
                    <Form.Control
                      type="file"
                      accept=".pdf"
                      className="d-none"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                    />
                  </Form.Label>
                </p>
              </div>
            )}
          </div>

          {/* Title Input */}
          <Form.Group className="mb-3">
            <Form.Label>Document Title</Form.Label>
            <Form.Control
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </Form.Group>

          {/* Tags Input */}
          <Form.Group className="mb-3">
            <Form.Label>Tags (optional)</Form.Label>
            <Form.Control
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!file || !title || uploading}
        >
          {uploading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Documents;