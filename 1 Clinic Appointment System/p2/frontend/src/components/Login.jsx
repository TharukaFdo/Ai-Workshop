import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleLogin = async (e, directCreds = null) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const userVal = directCreds ? directCreds.username : username;
    const passVal = directCreds ? directCreds.password : password;

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userVal, password: passVal })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">🏥</div>
        <h2>ClinicFlow Portal</h2>
        <p className="login-subtitle">Please log in to manage schedules and patients</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={(e) => handleLogin(e)}>
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              placeholder="e.g. receptionist1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-login-divider">
          <span>Or Quick Login (Workshop Demo)</span>
        </div>

        <div className="quick-login-buttons">
          <button
            onClick={() => handleLogin(null, { username: 'receptionist1', password: 'password123' })}
            className="btn btn-secondary"
            disabled={loading}
          >
            🔑 Receptionist
          </button>
          <button
            onClick={() => handleLogin(null, { username: 'dr_smith', password: 'smith456' })}
            className="btn btn-secondary"
            disabled={loading}
          >
            🩺 Dr. Smith (Doctor)
          </button>
        </div>
      </div>
    </div>
  );
}
