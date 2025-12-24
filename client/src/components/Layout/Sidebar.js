import React from 'react';
import { NavLink } from 'react-router-dom';
import { Nav, Card } from 'react-bootstrap';
import {
  HomeIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
    { name: 'Flashcards', href: '/flashcards', icon: AcademicCapIcon },
    { name: 'Quizzes', href: '/quizzes', icon: QuestionMarkCircleIcon },
    { name: 'Progress', href: '/progress', icon: ChartBarIcon },
  ];

  return (
    <div className="sidebar">
      <div className="d-flex flex-column h-100">
        <Nav className="flex-column px-3 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `nav-link-custom text-decoration-none d-flex align-items-center ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <item.icon className="me-3" style={{ width: '20px', height: '20px' }} />
              {item.name}
            </NavLink>
          ))}
        </Nav>

        <div className="mt-auto p-3">
          <Card className="bg-primary-custom text-white">
            <Card.Body className="p-3">
              <h6 className="card-title mb-2">Study Tip</h6>
              <p className="card-text small mb-0">
                Review your flashcards daily for better retention!
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;