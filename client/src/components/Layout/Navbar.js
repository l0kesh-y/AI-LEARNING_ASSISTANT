import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, User, LogOut as Logout } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <button 
          className="navbar-logo"
          onClick={() => navigate('/documents')}
        >
          <BookOpen />
          <span>AI Learning</span>
        </button>
      </div>

      <div className="navbar-actions">
        <div className="navbar-user">
          <button
            className="navbar-user-btn"
            onClick={() => setShowProfile(!showProfile)}
          >
            <User size={18} />
            <span>{user?.name || 'User'}</span>
          </button>

          {showProfile && (
            <div className="navbar-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-name">{user?.name}</div>
                <div className="dropdown-email">{user?.email}</div>
              </div>
              <button className="dropdown-logout" onClick={handleLogout}>
                <LogOut />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
