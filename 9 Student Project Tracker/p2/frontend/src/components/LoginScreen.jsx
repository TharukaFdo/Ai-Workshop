import React from 'react';

function LoginScreen({ 
  usernameInput, 
  setUsernameInput, 
  passwordInput, 
  setPasswordInput, 
  handleLogin, 
  loading, 
  error 
}) {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <header style={{ borderBottom: 'none', marginBottom: '1.5rem', textAlign: 'center', width: '100%' }}>
        <h1>Student Project Tracker</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Secure Workshop Login</p>
      </header>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--error)', maxWidth: '400px', width: '100%' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input 
              id="username-input"
              type="text" 
              required 
              value={usernameInput} 
              onChange={(e) => setUsernameInput(e.target.value)} 
              placeholder="e.g. student_alice" 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              id="password-input"
              type="password" 
              required 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              placeholder="password123" 
            />
          </div>
          <button id="login-button" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      </div>

      {/* Credentials cheat-sheet helper for workshop */}
      <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', textAlign: 'center' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Demo Accounts (Password: <code>password123</code>):</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
          <div>
            <strong>Students:</strong><br/>
            <code>student_alice</code><br/>
            <code>student_bob</code>
          </div>
          <div>
            <strong>Supervisors:</strong><br/>
            <code>supervisor_carol</code><br/>
            <code>supervisor_dave</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
