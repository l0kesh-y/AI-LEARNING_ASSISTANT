import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, Upload, Search, Trash2, Eye } from 'lucide-react';
import { API_URL } from '../../config/api';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Fetch documents error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file && !title) {
      setTitle(file.name.replace('.pdf', ''));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('title', title);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowUploadModal(false);
      setSelectedFile(null);
      setTitle('');
      fetchDocuments();
    } catch (error) {
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (error) {
      alert('Delete failed');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="main-content">
        <p>Loading your documents...</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Documents</h1>
          <p>Upload and manage your PDFs for AI-powered learning</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={18} />
          <span>Upload PDF</span>
        </button>
      </div>

      <div className="controls-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>No documents yet</h3>
          <p>Upload your first PDF to get started with AI-powered learning</p>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Upload size={18} />
            <span>Upload PDF</span>
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Pages</th>
                <th>Size</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={18} style={{ color: '#9CA3AF' }} />
                      <span className="table-title">{doc.title}</span>
                    </div>
                  </td>
                  <td>{doc.pageCount} pages</td>
                  <td>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/documents/${doc._id}`} className="btn btn-ghost" style={{ padding: '0.375rem 0.5rem' }}>
                        <Eye size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(doc._id)} 
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

      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setTitle('');
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label>PDF File</label>
                  {!selectedFile ? (
                    <label className="file-upload-area">
                      <Upload size={40} />
                      <p className="file-upload-text">
                        <span>Click to upload</span> or drag and drop
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                        PDF files only
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        required
                      />
                    </label>
                  ) : (
                    <div className="file-selected">
                      <FileText size={18} />
                      <span>{selectedFile.name}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="title">Document Title</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setTitle('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
