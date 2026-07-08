import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  User, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  PlusCircle, 
  Filter, 
  ArrowLeft, 
  Database,
  RefreshCw,
  Search,
  Lock,
  LogOut,
  Shield
} from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  // Auth Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tickets State
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [backendStatus, setBackendStatus] = useState('Connecting...');
  
  // Customer Ticket Create Form
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'Technical'
  });

  // Agent State / Shared Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');

  // Response Form State
  const [replyMessage, setReplyMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setTickets([]);
    setSelectedTicketId(null);
    setTicketDetails(null);
  };

  // Helper for authenticated fetch requests
  const authFetch = (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers }).then((res) => {
      if (res.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please login again.');
      }
      return res;
    });
  };

  // Fetch Tickets List
  const fetchTickets = () => {
    if (!token) return;
    let url = '/api/tickets?';
    if (filterCategory) url += `category=${encodeURIComponent(filterCategory)}&`;
    if (filterStatus) url += `status=${encodeURIComponent(filterStatus)}&`;
    if (user?.role === 'agent' && filterUser) {
      url += `created_by=${encodeURIComponent(filterUser)}&`;
    }

    authFetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTickets(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Error fetching tickets:', err);
      });
  };

  // Fetch Ticket Details (including responses)
  const fetchTicketDetails = (id) => {
    if (!token) return;
    authFetch(`/api/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTicketDetails(data);
        setUpdateStatus(data.status);
      })
      .catch((err) => {
        console.error('Error fetching ticket details:', err);
      });
  };

  // Verify backend health
  const checkHealth = () => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setBackendStatus('Connected to Database');
        } else {
          setBackendStatus('Backend Error');
        }
      })
      .catch((err) => {
        setBackendStatus('Database Offline');
      });
  };

  // Initial connection check
  useEffect(() => {
    checkHealth();
  }, []);

  // Fetch tickets when filters or user context changes
  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token, user, filterCategory, filterStatus, filterUser]);

  // Load ticket details when selectedTicketId changes
  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    } else {
      setTicketDetails(null);
    }
  }, [selectedTicketId]);

  // Handle Login Submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    if (!usernameInput || !passwordInput) return;

    setIsLoggingIn(true);
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Invalid username or password');
        }
        return res.json();
      })
      .then((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsLoggingIn(false);
      })
      .catch((err) => {
        setIsLoggingIn(false);
        setLoginError(err.message || 'Login failed. Please try again.');
      });
  };

  // Submit Ticket
  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description) {
      alert('Please fill out all fields');
      return;
    }

    authFetch('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(newTicket)
    })
      .then((res) => res.json())
      .then((createdTicket) => {
        setNewTicket({
          title: '',
          description: '',
          category: 'Technical'
        });
        fetchTickets();
        alert('Ticket submitted successfully!');
      })
      .catch((err) => {
        console.error('Error creating ticket:', err);
        alert('Failed to submit ticket');
      });
  };

  // Submit Response (Reply)
  const handleSubmitResponse = (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    const body = {
      message: replyMessage
    };

    // Agents can optionally update ticket status when adding a response
    if (user?.role === 'agent' && updateStatus) {
      body.status = updateStatus;
    }

    authFetch(`/api/tickets/${selectedTicketId}/responses`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
      .then((res) => res.json())
      .then((updatedDetails) => {
        setTicketDetails(updatedDetails);
        setReplyMessage('');
        fetchTickets();
      })
      .catch((err) => {
        console.error('Error sending response:', err);
        alert('Failed to send response');
      });
  };

  // Update Status directly (Agent only)
  const handleDirectStatusChange = (newStatus) => {
    authFetch(`/api/tickets/${selectedTicketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    })
      .then((res) => res.json())
      .then((updatedTicket) => {
        setTicketDetails((prev) => ({ ...prev, status: updatedTicket.status }));
        setUpdateStatus(updatedTicket.status);
        fetchTickets();
      })
      .catch((err) => {
        console.error('Error updating status:', err);
      });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (!token || !user) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="logo-section" style={{ marginBottom: '2rem' }}>
          <span className="logo-icon">🎟️</span>
          <div className="logo-text">
            <h1 style={{ fontSize: '2rem' }}>Helpdesk Support</h1>
            <p>Secure Ticket Workspace Login</p>
          </div>
        </div>

        <div className="card" style={{ width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}>
          <h2 className="card-title" style={{ justifyContent: 'center' }}>
            <Lock size={20} /> Sign In
          </h2>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', textAlign: 'center' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="e.g. agent or alice"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn" disabled={isLoggingIn}>
              {isLoggingIn ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <p><strong>Demo Accounts:</strong></p>
            <p>Agent: <code>agent</code> / <code>password</code></p>
            <p>Customers: <code>alice</code>, <code>bob</code>, or <code>charlie</code> / <code>password</code></p>
          </div>
        </div>
      </div>
    );
  }

  // --- WORKSPACE LAYOUT IF AUTHENTICATED ---
  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <span className="logo-icon">🎟️</span>
          <div className="logo-text">
            <h1>Helpdesk Support</h1>
            <p>Ticket Management System</p>
          </div>
        </div>
        
        <div className="header-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <Shield size={16} style={{ color: user.role === 'agent' ? 'var(--status-progress)' : 'var(--status-open)' }} />
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{user.username}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user.role} role</div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', marginLeft: '0.75rem', display: 'flex', alignItems: 'center' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
          <span className="badge-pulse">
            <span className="pulse-dot"></span>
            {backendStatus}
          </span>
        </div>
      </header>

      <main>
        {selectedTicketId && ticketDetails ? (
          /* TICKET DETAIL VIEW */
          <div>
            <button className="btn btn-secondary" style={{ width: 'auto', marginBottom: '1.5rem' }} onClick={() => setSelectedTicketId(null)}>
              <ArrowLeft size={16} /> Back to List
            </button>

            <div className="ticket-details-layout">
              <div className="detail-main">
                <div className="card" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span className={`status-badge ${ticketDetails.status.toLowerCase().replace(' ', '')}`}>
                        {ticketDetails.status}
                      </span>
                      <span className="category-tag" style={{ marginLeft: '0.75rem' }}>{ticketDetails.category}</span>
                      <h2 style={{ marginTop: '0.75rem', fontSize: '1.75rem' }}>{ticketDetails.title}</h2>
                    </div>
                  </div>

                  <div className="ticket-desc-box">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{ticketDetails.description}</p>
                  </div>

                  {/* Reply Log */}
                  <div className="response-section">
                    <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                      <MessageSquare size={16} /> Conversation History
                    </h3>
                    <div className="response-log">
                      {ticketDetails.responses && ticketDetails.responses.length > 0 ? (
                        ticketDetails.responses.map((resp) => {
                          const isAgentResp = resp.responder_name === 'Support Agent';
                          return (
                            <div 
                              key={resp.id} 
                              className={`response-bubble ${isAgentResp ? 'agent' : 'user'}`}
                            >
                              <div className="bubble-meta">
                                <div>
                                  <span className="responder-name">{resp.responder_name}</span>
                                  {isAgentResp && <span className="responder-badge">Agent</span>}
                                </div>
                                <span className="response-time">{formatDate(resp.created_at)}</span>
                              </div>
                              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{resp.message}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                          <p>No messages yet. Add a response below to start the conversation.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Message Form */}
                  <form onSubmit={handleSubmitResponse} style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div className="form-group">
                      <label htmlFor="replyMessage">Add a Response</label>
                      <textarea
                        id="replyMessage"
                        className="form-textarea"
                        placeholder="Type your reply here..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        required
                      />
                    </div>

                    {user.role === 'agent' && (
                      <div className="form-group">
                        <label htmlFor="updateStatus">Update Ticket Status</label>
                        <select
                          id="updateStatus"
                          className="form-select"
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    )}

                    <button type="submit" className="btn">
                      Send Reply
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="detail-sidebar">
                <div className="card">
                  <h3 className="card-title">Ticket Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Ticket ID</span>
                      <strong style={{ fontSize: '1.1rem' }}>#{ticketDetails.id}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Created By</span>
                      <strong>{ticketDetails.created_by}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Submitted On</span>
                      <strong>{formatDate(ticketDetails.created_at)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Last Updated</span>
                      <strong>{formatDate(ticketDetails.updated_at)}</strong>
                    </div>
                  </div>

                  {user.role === 'agent' && ticketDetails.status !== 'Closed' && (
                    <div style={{ marginTop: '2rem' }}>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDirectStatusChange('Closed')}
                      >
                        <CheckCircle2 size={16} /> Close Ticket
                      </button>
                    </div>
                  )}

                  {user.role === 'customer' && ticketDetails.status === 'Closed' && ticketDetails.reopened === 0 && (
                    <div style={{ marginTop: '2rem' }}>
                      <button 
                        className="btn"
                        style={{ backgroundColor: 'var(--status-open)' }}
                        onClick={() => handleDirectStatusChange('Open')}
                      >
                        <RefreshCw size={16} /> Reopen Ticket
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* DASHBOARD / TICKET LIST VIEW */
          <div className={`dashboard-grid ${user.role === 'agent' ? 'agent-view' : ''}`}>
            
            {/* Left Column (Customer submit form - Customer role only) */}
            {user.role === 'customer' && (
              <div>
                <div className="card">
                  <h2 className="card-title">
                    <PlusCircle size={20} /> Create Support Ticket
                  </h2>
                  <form onSubmit={handleSubmitTicket}>
                    <div className="form-group">
                      <label htmlFor="title">Ticket Title</label>
                      <input
                        id="title"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Cannot connect to database"
                        value={newTicket.title}
                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        className="form-select"
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      >
                        <option value="Technical">Technical</option>
                        <option value="Billing">Billing</option>
                        <option value="Hardware">Hardware</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Describe the Issue</label>
                      <textarea
                        id="description"
                        className="form-textarea"
                        placeholder="Explain the problem in detail..."
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                        required
                      />
                    </div>

                    <button type="submit" className="btn">
                      Submit Ticket
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Right Column (Ticket Listings) */}
            <div>
              {/* Header & Refresh */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {user.role === 'agent' ? 'All Submitted Support Tickets' : 'My Support Tickets'}
                </h2>
                <button 
                  onClick={fetchTickets}
                  className="btn btn-secondary" 
                  style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  title="Refresh Tickets"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="filters-bar">
                <div className="filter-item">
                  <Filter size={14} />
                  <span style={{ fontWeight: 600 }}>Filters:</span>
                </div>

                <div className="filter-item">
                  <select
                    className="form-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="Hardware">Hardware</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="filter-item">
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {user.role === 'agent' && (
                  <div className="filter-item">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Filter by submitter..."
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Tickets List */}
              <div className="ticket-list">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="ticket-card"
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <div className="ticket-info">
                        <div className="ticket-header">
                          <span className={`status-badge ${ticket.status.toLowerCase().replace(' ', '')}`}>
                            {ticket.status}
                          </span>
                          <span className="category-tag">{ticket.category}</span>
                          <span className="ticket-title">{ticket.title}</span>
                        </div>
                        <div className="ticket-meta">
                          <span className="ticket-meta-item">
                            <User size={12} /> {ticket.created_by}
                          </span>
                          <span className="ticket-meta-item">
                            <Clock size={12} /> {formatDate(ticket.created_at)}
                          </span>
                        </div>
                      </div>
                      <div style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', alignSelf: 'center', fontWeight: 'bold' }}>
                        View Details →
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card">
                    <div className="empty-state">
                      <div className="empty-icon">🎟️</div>
                      <p>No tickets found.</p>
                      {user.role === 'customer' && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Create a support ticket on the left to get started!</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;
