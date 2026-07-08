import React from 'react';

function Login({
  usernameInput,
  setUsernameInput,
  passwordInput,
  setPasswordInput,
  loginError,
  loginLoading,
  handleLogin
}) {
  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', background: 'var(--panel-bg)', padding: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Workshop Log In</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Username</label>
          <input
            type="text"
            required
            placeholder="alice_req or bob_tech"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
          <input
            type="password"
            required
            placeholder="password123"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        {loginError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.9rem', backgroundColor: '#ef44441e', padding: '10px', borderRadius: '6px', border: '1px solid #ef444444' }}>
            ⚠️ {loginError}
          </div>
        )}

        <button
          type="submit"
          disabled={loginLoading}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          {loginLoading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
      <div style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
        <strong>Demo accounts:</strong><br />
        Requester: <code>alice_req</code> / <code>password123</code><br />
        Technician: <code>bob_tech</code> / <code>password123</code>
      </div>
    </div>
  );
}

export default Login;
