import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import './App.css'; // Just import to avoid warnings, our main styling is in index.css

const USERS = [
  { username: 'alice', role: 'User' },
  { username: 'bob', role: 'User' },
  { username: 'agent_carter', role: 'Support agent' },
  { username: 'agent_smith', role: 'Support agent' }
];

const CATEGORIES = ['Software', 'Hardware', 'Network', 'Billing', 'Other'];

function App() {
  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('ticket_system_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('ticket_system_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Login input states
  const [loginUsername, setLoginUsername] = useState(USERS[0].username);
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');

  // Dashboard states
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');

  // Ticket Form (User only)
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);

  // Selected Ticket for Detail View/Edit
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Agent edit states
  const [editStatus, setEditStatus] = useState('');
  const [editResponse, setEditResponse] = useState('');

  // Perform login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Authentication failed.');
      }

      const data = await res.json();
      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('ticket_system_token', data.token);
      localStorage.setItem('ticket_system_user', JSON.stringify(data.user));
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // Perform logout
  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('ticket_system_token');
    localStorage.removeItem('ticket_system_user');
    setTickets([]);
  };

  // Fetch tickets
  const fetchTickets = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);
      if (currentUser.role !== 'Support agent') {
        params.append('submittedUser', currentUser.username);
      } else if (filterUser) {
        params.append('submittedUser', filterUser);
      }

      const res = await fetch(`${API_BASE_URL}/tickets?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          throw new Error('Session expired or unauthorized. Please log in again.');
        }
        throw new Error('Failed to load tickets.');
      }
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching tickets.');
    } finally {
      setLoading(false);
    }
  };

  // Run fetch when token, filters, role, or active user changes
  useEffect(() => {
    if (token) {
      fetchTickets();
    }
    setSelectedTicket(null);
    setSuccess('');
    // Clear user specific filter if role switches to User
    if (currentUser && currentUser.role === 'User') {
      setFilterUser('');
    }
  }, [token, currentUser, filterCategory, filterStatus, filterUser]);

  // Handle ticket submission
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!newTitle.trim()) {
      setError('Ticket title is required.');
      return;
    }
    if (!newDescription.trim()) {
      setError('Ticket description is required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          category: newCategory,
          submittedUser: currentUser.username
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit ticket.');
      }

      setSuccess('Ticket submitted successfully!');
      setNewTitle('');
      setNewDescription('');
      setNewCategory(CATEGORIES[0]);
      fetchTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle ticket response/status update (Agent only)
  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus,
          agentResponse: editResponse.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update ticket.');
      }

      setSuccess('Ticket updated successfully!');
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  // Open ticket detail modal
  const openDetail = (ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditResponse(ticket.agentResponse || '');
  };

  // Switch username filling in login form
  const handleSelectDemoUser = (username) => {
    setLoginUsername(username);
    setLoginPassword('password123'); // Default password for all demo accounts
  };

  // Render Login screen if not authenticated
  if (!token || !currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="brand-icon" style={{ margin: '0 auto 1rem auto', width: '3rem', height: '3rem', fontSize: '1.5rem' }}>H</div>
            <h2 className="brand-name" style={{ fontSize: '1.5rem' }}>Helpdesk Ticket System</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Sign in to manage support issues
            </p>
          </div>

          {loginError && <div className="error-message">{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)} 
                className="form-input"
                placeholder="Enter username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                className="form-input"
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="btn" style={{ marginTop: '0.5rem' }}>Sign In</button>
          </form>

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <span className="form-label" style={{ marginBottom: '0.75rem', display: 'block', textAlign: 'center' }}>
              Demo Accounts (Password: <code>password123</code>)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {USERS.map(u => (
                <button 
                  key={u.username}
                  type="button"
                  onClick={() => handleSelectDemoUser(u.username)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem', textTransform: 'capitalize' }}
                >
                  {u.username} ({u.role.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAgent = currentUser.role === 'Support agent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">H</div>
          <span className="brand-name">Helpdesk Ticket System</span>
        </div>
        
        <div className="auth-panel">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{currentUser.username}</div>
            <span className={`role-badge ${isAgent ? 'agent' : ''}`} style={{ fontSize: '0.7rem' }}>
              {currentUser.role}
            </span>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`dashboard-container ${!isAgent ? 'user-layout' : ''}`}>
        
        {/* User Submission Form Side Column */}
        {!isAgent && (
          <div className="glass-card">
            <h2 className="card-title">Submit Support Ticket</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmitTicket}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="Summarize the issue..."
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="form-select"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)} 
                  placeholder="Provide details about the issue..."
                  rows={4}
                  className="form-textarea"
                  required
                />
              </div>

              <button type="submit" className="btn">Submit Ticket</button>
            </form>
          </div>
        )}

        {/* Tickets List Area */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              {isAgent ? 'All Support Tickets' : 'My Tickets'}
            </h2>
            <button 
              onClick={fetchTickets} 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Refresh List
            </button>
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <div className="filter-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Category:</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Status:</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="inProgress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {isAgent && (
              <div className="filter-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>User:</label>
                <input 
                  type="text" 
                  value={filterUser} 
                  onChange={(e) => setFilterUser(e.target.value)} 
                  placeholder="Username..." 
                  style={{ width: '120px' }}
                />
              </div>
            )}
          </div>

          {/* Error display if list fails */}
          {error && !selectedTicket && <div className="error-message">{error}</div>}

          {/* Loading state */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <span>Loading tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No tickets found</h3>
              <p>Try clearing filters or submitting a new ticket.</p>
            </div>
          ) : (
            <div className="ticket-list">
              {tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => openDetail(ticket)}
                  className="ticket-item"
                >
                  <div className="ticket-header">
                    <span className="ticket-title">{ticket.title}</span>
                    <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="ticket-meta">
                    <span>Category: <strong>{ticket.category}</strong></span>
                    <span>By: <strong>{ticket.submittedUser}</strong></span>
                    <span>Created: <strong>{new Date(ticket.createdAt).toLocaleString()}</strong></span>
                  </div>
                  <div className="ticket-summary">
                    {ticket.description}
                  </div>
                  {ticket.agentResponse && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                      💬 Agent response added
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Ticket Detail & Management Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title" style={{ margin: 0 }}>Ticket Details</h3>
              <span className={`badge badge-${selectedTicket.status.toLowerCase()}`}>
                {selectedTicket.status}
              </span>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <span className="detail-section-title">Submitted By</span>
                  <div style={{ fontSize: '0.95rem' }}>{selectedTicket.submittedUser}</div>
                </div>
                <div>
                  <span className="detail-section-title">Category</span>
                  <div style={{ fontSize: '0.95rem' }}>{selectedTicket.category}</div>
                </div>
              </div>

              <div className="detail-section">
                <span className="detail-section-title">Title</span>
                <div className="detail-content" style={{ fontWeight: 600 }}>
                  {selectedTicket.title}
                </div>
              </div>

              <div className="detail-section">
                <span className="detail-section-title">Description</span>
                <div className="detail-content">
                  {selectedTicket.description}
                </div>
              </div>

              <div className="detail-section">
                <span className="detail-section-title">Timestamps</span>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Created: {new Date(selectedTicket.createdAt).toLocaleString()}<br />
                  Updated: {new Date(selectedTicket.updatedAt).toLocaleString()}<br />
                  {selectedTicket.closedAt && `Closed: ${new Date(selectedTicket.closedAt).toLocaleString()}`}
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />

              {/* Agent Form Section */}
              {isAgent ? (
                <form onSubmit={handleUpdateTicket}>
                  <div className="form-group">
                    <label className="form-label">Update Status</label>
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="form-select"
                    >
                      <option value="open">Open</option>
                      <option value="inProgress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Agent Response</label>
                    <textarea 
                      value={editResponse} 
                      onChange={(e) => setEditResponse(e.target.value)} 
                      placeholder="Add an update or solution..."
                      rows={4}
                      className="form-textarea"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn">Save & Update</button>
                    <button type="button" onClick={() => setSelectedTicket(null)} className="btn btn-secondary">Cancel</button>
                  </div>
                </form>
              ) : (
                // User Read-only Response View
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="detail-section agent-response-box detail-content" style={{ display: 'block' }}>
                    <span className="detail-section-title">Agent Response</span>
                    <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                      {selectedTicket.agentResponse ? selectedTicket.agentResponse : <em>No response from support agents yet.</em>}
                    </div>
                  </div>

                  {selectedTicket.status === 'closed' && selectedTicket.reopened === 0 && (
                    <button 
                      type="button" 
                      onClick={async () => {
                        setError('');
                        setSuccess('');
                        try {
                          const res = await fetch(`${API_BASE_URL}/tickets/${selectedTicket.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: 'open' })
                          });
                          if (!res.ok) {
                            const errData = await res.json();
                            throw new Error(errData.error || 'Failed to reopen ticket.');
                          }
                          setSuccess('Ticket reopened successfully!');
                          setSelectedTicket(null);
                          fetchTickets();
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                      className="btn"
                    >
                      Reopen Ticket (Once)
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isAgent && (
              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedTicket(null)} className="btn" style={{ width: 'auto' }}>Close View</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
