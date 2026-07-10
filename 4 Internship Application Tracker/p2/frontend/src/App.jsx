import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { ClipboardList, LogOut } from 'lucide-react';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SubmitApplication from './components/SubmitApplication';

// Main Application Router & State Manager
const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tracker_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('tracker_user', JSON.stringify(userData));
  };

  const handleLogout = (navigate) => {
    setUser(null);
    localStorage.removeItem('tracker_user');
    navigate('/login');
  };

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="nav-brand">
            <ClipboardList size={24} />
            <span>Internship Tracker</span>
          </Link>
          
          <div className="nav-links">
            {user ? (
              <>
                <span style={{ color: 'var(--text-secondary)', marginRight: '1rem', fontSize: '0.9rem' }}>
                  Signed in as: <strong style={{ color: 'var(--text-primary)' }}>{user.username} ({user.role})</strong>
                </span>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <NavLogoutButton onLogout={handleLogout} />
              </>
            ) : (
              <Link to="/login" className="nav-link">Sign In</Link>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} user={user} />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/submit" element={<SubmitApplication user={user} />} />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
};

// Logout button helper component
const NavLogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => onLogout(navigate)} 
      className="btn btn-secondary" 
      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
    >
      <LogOut size={16} /> Sign Out
    </button>
  );
};

export default App;
