import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const CustomNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const avatarColor = user?.avatar || '#6366f1';
  const initials    = getInitials(user?.name);

  return (
    <Navbar bg="white" expand="lg" className="navbar-custom fixed-top">
      <Container fluid>
        <Navbar.Brand href="/" className="fw-bold text-primary-custom fs-4">
          AI Learning Assistant
        </Navbar.Brand>

        <Nav className="ms-auto d-flex align-items-center">
          {/* User Menu */}
          <NavDropdown
            title={
              <div className="d-flex align-items-center gap-2">
                {/* Avatar circle */}
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                  style={{
                    width: 36, height: 36,
                    backgroundColor: avatarColor.startsWith('#') ? avatarColor : '#6366f1',
                    fontSize: 13, flexShrink: 0
                  }}
                >
                  {initials}
                </div>
                <div className="text-end d-none d-md-block">
                  <div className="fw-medium text-dark" style={{ lineHeight: 1.2 }}>{user?.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem', lineHeight: 1.2 }}>{user?.email}</div>
                </div>
              </div>
            }
            id="user-dropdown"
            align="end"
          >
            {/* Profile header inside dropdown */}
            <div className="px-3 py-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                  style={{
                    width: 42, height: 42,
                    backgroundColor: avatarColor.startsWith('#') ? avatarColor : '#6366f1',
                    fontSize: 15, flexShrink: 0
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{user?.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
                </div>
              </div>
            </div>

            <NavDropdown.Item onClick={() => navigate('/settings')}>
              <UserCircleIcon className="me-2" style={{ width: 16, height: 16 }} />
              Profile
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => navigate('/settings?tab=security')}>
              <Cog6ToothIcon className="me-2" style={{ width: 16, height: 16 }} />
              Settings
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={logout} className="text-danger">
              <ArrowRightOnRectangleIcon className="me-2" style={{ width: 16, height: 16 }} />
              Sign out
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
