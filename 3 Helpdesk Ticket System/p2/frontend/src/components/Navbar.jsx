import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LifeBuoy, LogOut } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const loadUser = () => {
    const userData = localStorage.getItem('helpdesk_user');
    setUser(userData ? JSON.parse(userData) : null);
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('storage', loadUser);
    return () => {
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('helpdesk_user');
    localStorage.removeItem('helpdesk_token');
    loadUser();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
        <LifeBuoy size={28} color="var(--accent-primary)" />
        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Helpdesk Portal</span>
      </Link>
      
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <Link to="/login" className="btn btn-primary">Login</Link>
      )}
    </nav>
  );
}
