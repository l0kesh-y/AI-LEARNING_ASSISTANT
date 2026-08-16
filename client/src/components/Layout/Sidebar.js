import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Layers, CheckSquare } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-title">Learning</div>
        <NavLink 
          to="/documents" 
          className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
        >
          <FileText />
          <span>Documents</span>
        </NavLink>
        <NavLink 
          to="/flashcards" 
          className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
        >
          <Layers />
          <span>Flashcards</span>
        </NavLink>
        <NavLink 
          to="/quizzes" 
          className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
        >
          <CheckSquare />
          <span>Quizzes</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
