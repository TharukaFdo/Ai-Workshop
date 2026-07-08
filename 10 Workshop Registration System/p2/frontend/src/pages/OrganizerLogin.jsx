import React, { useState } from 'react';

export default function OrganizerLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Both username and password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.token, data.user.role);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#fff' }}>Login Portal</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        Log in to access participant registrations or organizer dashboard.
      </p>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="username" style={{ fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>Username</label>
        <input
          id="username"
          type="text"
          placeholder="organizer or participant"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <label htmlFor="password" style={{ fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
        <div>Organizer Account: <span style={{ color: '#94a3b8' }}>organizer / password123</span></div>
        <div style={{ marginTop: '0.25rem' }}>Participant Account: <span style={{ color: '#94a3b8' }}>participant / password123</span></div>
      </div>
    </div>
  );
}
