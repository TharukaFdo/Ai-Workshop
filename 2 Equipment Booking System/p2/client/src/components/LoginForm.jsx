import React from 'react';

function LoginForm({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  authError,
  handleLogin
}) {
  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lab Equipment
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to manage bookings</p>
        </div>

        {authError && <div className="alert alert-danger">{authError}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="e.g. alice_staff"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Pre-seeded Demo Accounts:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div>Staff: <code style={{ color: 'var(--accent-secondary)' }}>alice_staff</code> or <code style={{ color: 'var(--accent-secondary)' }}>bob_staff</code> / password123</div>
            <div>Assistant: <code style={{ color: 'var(--accent-secondary)' }}>clara_assistant</code> / password123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
