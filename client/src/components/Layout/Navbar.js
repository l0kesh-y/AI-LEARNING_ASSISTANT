import React from 'react';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const CustomNavbar = () => {
  const { user, logout } = useAuth();

  return (
    <Navbar bg="white" expand="lg" className="navbar-custom fixed-top">
      <Container fluid>
        <Navbar.Brand href="#" className="fw-bold text-primary-custom fs-4">
          AI Learning Assistant
        </Navbar.Brand>

        <Nav className="ms-auto d-flex align-items-center">
          {/* Notifications */}
          <Nav.Link className="me-3">
            <BellIcon className="text-muted" style={{ width: '24px', height: '24px' }} />
          </Nav.Link>

          {/* User Menu */}
          <NavDropdown
            title={
              <div className="d-flex align-items-center">
                <div className="text-end me-2">
                  <div className="fw-medium text-dark">{user?.name}</div>
                  <div className="small text-muted">{user?.email}</div>
                </div>
                <UserCircleIcon className="text-muted" style={{ width: '32px', height: '32px' }} />
              </div>
            }
            id="user-dropdown"
            align="end"
          >
            <NavDropdown.Item>
              <Cog6ToothIcon className="me-2" style={{ width: '16px', height: '16px' }} />
              Settings
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={logout}>
              <ArrowRightOnRectangleIcon className="me-2" style={{ width: '16px', height: '16px' }} />
              Sign out
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;