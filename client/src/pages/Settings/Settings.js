import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container, Row, Col, Card, Form, Button, Alert, Badge, Nav
} from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserCircleIcon,
  LockClosedIcon,
  Cog6ToothIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

/* ── Helpers ─────────────────────────────────────────────────── */
const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
];

/* ── Main Component ──────────────────────────────────────────── */
const Settings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  const tabs = [
    { id: 'profile',   label: 'Profile',   icon: UserCircleIcon },
    { id: 'security',  label: 'Security',  icon: LockClosedIcon },
    { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
  ];

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h1 className="h2 fw-bold text-dark mb-1">Settings</h1>
          <p className="text-muted mb-0">Manage your profile, security and preferences</p>
        </Col>
      </Row>

      <Row>
        {/* Sidebar nav */}
        <Col xs={12} md={3} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="p-2">
              <Nav className="flex-column">
                {tabs.map(tab => (
                  <Nav.Link
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`d-flex align-items-center gap-2 rounded px-3 py-2 mb-1 ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-dark'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <tab.icon style={{ width: 18, height: 18 }} />
                    {tab.label}
                  </Nav.Link>
                ))}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Content */}
        <Col xs={12} md={9}>
          {activeTab === 'profile'      && <ProfileTab />}
          {activeTab === 'security'     && <SecurityTab />}
          {activeTab === 'preferences'  && <PreferencesTab />}
        </Col>
      </Row>
    </Container>
  );
};

/* ── Profile Tab ─────────────────────────────────────────────── */
const ProfileTab = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName]         = useState(user?.name || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar || AVATAR_COLORS[0]);
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState(null); // { type, message }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setStatus(null);
    const result = await updateProfile({ name: name.trim(), avatar: avatarColor });
    setSaving(false);
    setStatus(result.success
      ? { type: 'success', message: 'Profile updated successfully!' }
      : { type: 'danger',  message: result.message }
    );
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="mb-0 fw-semibold">Profile Information</h5>
      </Card.Header>
      <Card.Body className="p-4">
        {status && <Alert variant={status.type} className="py-2">{status.message}</Alert>}

        {/* Avatar preview */}
        <div className="d-flex align-items-center gap-4 mb-4">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white fs-4"
            style={{ width: 72, height: 72, backgroundColor: avatarColor, flexShrink: 0 }}
          >
            {getInitials(name || user?.name)}
          </div>
          <div>
            <div className="fw-semibold mb-1">Avatar Color</div>
            <div className="d-flex gap-2 flex-wrap">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: c, border: 'none', cursor: 'pointer',
                    outline: avatarColor === c ? '3px solid #0d6efd' : 'none',
                    outlineOffset: 2
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <Form onSubmit={handleSave}>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-medium">Full Name</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-medium">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-light"
                />
                <Form.Text className="text-muted">Email cannot be changed</Form.Text>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-medium">Member Since</Form.Label>
                <Form.Control
                  type="text"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  disabled
                  className="bg-light"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                : <><CheckCircleIcon style={{ width: 16, height: 16 }} className="me-2" />Save Changes</>
              }
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

/* ── Security Tab ────────────────────────────────────────────── */
const SecurityTab = () => {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]  = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleShow   = key => setShow(s => ({ ...s, [key]: !s[key] }));

  const strength = (pw) => {
    if (!pw) return { level: 0, label: '', color: 'secondary' };
    let score = 0;
    if (pw.length >= 8)  score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { level: 25,  label: 'Weak',   color: 'danger'  },
      { level: 50,  label: 'Fair',   color: 'warning' },
      { level: 75,  label: 'Good',   color: 'info'    },
      { level: 100, label: 'Strong', color: 'success' },
    ];
    return map[score - 1] || map[0];
  };

  const pw = strength(form.next);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setStatus({ type: 'danger', message: 'New passwords do not match' });
      return;
    }
    if (form.next.length < 6) {
      setStatus({ type: 'danger', message: 'Password must be at least 6 characters' });
      return;
    }
    setSaving(true);
    setStatus(null);
    const result = await changePassword(form.current, form.next);
    setSaving(false);
    if (result.success) {
      setStatus({ type: 'success', message: 'Password changed successfully!' });
      setForm({ current: '', next: '', confirm: '' });
    } else {
      setStatus({ type: 'danger', message: result.message });
    }
    setTimeout(() => setStatus(null), 5000);
  };

  const PasswordField = ({ label, name, value }) => (
    <Form.Group>
      <Form.Label className="fw-medium">{label}</Form.Label>
      <div className="position-relative">
        <Form.Control
          type={show[name] ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          required
          style={{ paddingRight: 42 }}
        />
        <button
          type="button"
          onClick={() => toggleShow(name)}
          style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, color: '#6c757d'
          }}
        >
          {show[name] ? '🙈' : '👁️'}
        </button>
      </div>
    </Form.Group>
  );

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="mb-0 fw-semibold">Change Password</h5>
      </Card.Header>
      <Card.Body className="p-4">
        {status && <Alert variant={status.type} className="py-2">{status.message}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12}>
              <PasswordField label="Current Password" name="current" value={form.current} />
            </Col>
            <Col xs={12}>
              <PasswordField label="New Password" name="next" value={form.next} />
              {form.next && (
                <div className="mt-2">
                  <div className="progress" style={{ height: 6 }}>
                    <div
                      className={`progress-bar bg-${pw.color}`}
                      style={{ width: `${pw.level}%` }}
                    />
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small className={`text-${pw.color}`}>{pw.label}</small>
                    <small className="text-muted">
                      {form.next.length < 8 && 'Min 8 chars · '}
                      {!/[A-Z]/.test(form.next) && 'Uppercase · '}
                      {!/[0-9]/.test(form.next) && 'Number · '}
                      {!/[^A-Za-z0-9]/.test(form.next) && 'Symbol'}
                    </small>
                  </div>
                </div>
              )}
            </Col>
            <Col xs={12}>
              <PasswordField label="Confirm New Password" name="confirm" value={form.confirm} />
              {form.confirm && form.next !== form.confirm && (
                <small className="text-danger">Passwords don't match</small>
              )}
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Updating…</>
                : 'Update Password'
              }
            </Button>
          </div>
        </Form>

        {/* Security tips */}
        <hr className="my-4" />
        <h6 className="fw-semibold mb-3">Security Tips</h6>
        <div className="d-flex flex-column gap-2">
          {[
            'Use at least 8 characters with a mix of letters, numbers and symbols',
            'Never reuse passwords across different accounts',
            'Consider using a password manager',
          ].map((tip, i) => (
            <div key={i} className="d-flex gap-2 align-items-start">
              <span className="text-success mt-1">✓</span>
              <small className="text-muted">{tip}</small>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

/* ── Preferences Tab ─────────────────────────────────────────── */
const PreferencesTab = () => {
  const { user, updateProfile } = useAuth();
  const [theme,    setTheme]    = useState(user?.preferences?.theme    || 'light');
  const [language, setLanguage] = useState(user?.preferences?.language || 'en');
  const [saving,   setSaving]   = useState(false);
  const [status,   setStatus]   = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    const result = await updateProfile({ preferences: { theme, language } });
    setSaving(false);
    setStatus(result.success
      ? { type: 'success', message: 'Preferences saved!' }
      : { type: 'danger',  message: result.message }
    );
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="mb-0 fw-semibold">Preferences</h5>
      </Card.Header>
      <Card.Body className="p-4">
        {status && <Alert variant={status.type} className="py-2">{status.message}</Alert>}

        {/* Theme */}
        <div className="mb-4">
          <div className="fw-medium mb-3">Theme</div>
          <Row className="g-3">
            {[
              { id: 'light', label: 'Light', bg: '#ffffff', icon: '☀️' },
              { id: 'dark',  label: 'Dark',  bg: '#1e1e2e', icon: '🌙' },
            ].map(t => (
              <Col key={t.id} xs={6} md={4}>
                <div
                  onClick={() => setTheme(t.id)}
                  style={{
                    border: `2px solid ${theme === t.id ? '#0d6efd' : '#dee2e6'}`,
                    borderRadius: 8, padding: 16, cursor: 'pointer',
                    backgroundColor: t.bg, transition: 'border-color 0.2s'
                  }}
                >
                  <div className="text-center">
                    <div className="fs-3 mb-1">{t.icon}</div>
                    <div
                      className="fw-medium small"
                      style={{ color: t.id === 'dark' ? '#fff' : '#212529' }}
                    >
                      {t.label}
                    </div>
                    {theme === t.id && (
                      <Badge bg="primary" className="mt-1" style={{ fontSize: '0.65rem' }}>
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Language */}
        <div className="mb-4">
          <Form.Group>
            <Form.Label className="fw-medium">Language</Form.Label>
            <Form.Select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{ maxWidth: 280 }}
            >
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Spanish</option>
              <option value="fr">🇫🇷 French</option>
              <option value="de">🇩🇪 German</option>
              <option value="hi">🇮🇳 Hindi</option>
              <option value="zh">🇨🇳 Chinese</option>
              <option value="ar">🇸🇦 Arabic</option>
              <option value="pt">🇧🇷 Portuguese</option>
            </Form.Select>
          </Form.Group>
        </div>

        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
              : <><CheckCircleIcon style={{ width: 16, height: 16 }} className="me-2" />Save Preferences</>
            }
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Settings;
