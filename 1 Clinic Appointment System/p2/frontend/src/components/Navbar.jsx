import React from 'react';

export default function Navbar({ currentUser, onLogout }) {
  const formatRole = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-logo">🏥</span>
        <span className="brand-title">ClinicFlow</span>
      </div>
      <div className="navbar-user-profile">
        <span className="user-welcome">
          Welcome, <strong>{currentUser.username}</strong>
        </span>
        <span className={`role-badge role-${currentUser.role}`}>
          {formatRole(currentUser.role)}
        </span>
        <button onClick={onLogout} className="btn btn-secondary btn-sm btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}
