import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );

  // Login Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Data State
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New Request Form State (Staff)
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    reason: '',
    requested_date: new Date().toISOString().split('T')[0]
  });

  // Filters State
  const [filters, setFilters] = useState({
    item_name: '',
    requester_name: '',
    status: ''
  });

  // Storekeeper Inline Actions State (map of request.id to its respective action state)
  const [actionNotes, setActionNotes] = useState({});
  const [issuedQuantities, setIssuedQuantities] = useState({});

  // 1. Fetch Requests when Token or Filters Change
  const fetchRequests = () => {
    if (!token) return;
    setLoading(true);

    const queryParams = new URLSearchParams();
    if (filters.item_name) queryParams.append('item_name', filters.item_name);
    if (filters.requester_name) queryParams.append('requester_name', filters.requester_name);
    if (filters.status) queryParams.append('status', filters.status);

    fetch(`http://localhost:5000/api/requests?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load requests.');
        return data;
      })
      .then((data) => {
        setRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, [token, filters]);

  // Handle Login Form Changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed.');
        return data;
      })
      .then((data) => {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setLoginForm({ username: '', password: '' });
      })
      .catch((err) => setError(err.message));
  };

  // Handle Logout
  const handleLogout = () => {
    if (token) {
      fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).finally(() => {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setRequests([]);
        setError(null);
        setSuccess(null);
      });
    }
  };

  // Handle Form Input Change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  // Handle Filter Changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Request Submission
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.item_name.trim()) {
      setError('Item name cannot be empty.');
      return;
    }
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (!formData.reason.trim()) {
      setError('Reason is required.');
      return;
    }

    fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit request.');
        return data;
      })
      .then(() => {
        setSuccess('Inventory request submitted successfully!');
        setFormData({
          item_name: '',
          quantity: 1,
          reason: '',
          requested_date: new Date().toISOString().split('T')[0]
        });
        fetchRequests();
      })
      .catch((err) => setError(err.message));
  };

  // Handle Status Update (Approve / Reject)
  const handleStatusUpdate = (requestId, targetStatus) => {
    setError(null);
    setSuccess(null);

    const note = actionNotes[requestId] || '';

    fetch(`http://localhost:5000/api/requests/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: targetStatus,
        storekeeper_note: note
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update request.');
        return data;
      })
      .then(() => {
        setSuccess(`Request status updated to ${targetStatus}!`);
        setActionNotes(prev => ({ ...prev, [requestId]: '' }));
        fetchRequests();
      })
      .catch((err) => setError(err.message));
  };

  // Handle Mark as Issued
  const handleMarkIssued = (requestId, maxQty) => {
    setError(null);
    setSuccess(null);

    const issuedQty = issuedQuantities[requestId] ?? maxQty;
    const note = actionNotes[requestId] || '';

    if (issuedQty <= 0 || issuedQty > maxQty) {
      setError(`Issued quantity must be between 1 and the requested quantity (${maxQty}).`);
      return;
    }

    fetch(`http://localhost:5000/api/requests/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'issued',
        storekeeper_note: note,
        issued_quantity: issuedQty
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to issue items.');
        return data;
      })
      .then(() => {
        setSuccess('Items successfully marked as issued!');
        fetchRequests();
      })
      .catch((err) => setError(err.message));
  };

  // Render Login Card if not authenticated
  if (!token || !currentUser) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#1e1b4b' }}>Inventory System</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Log in to submit or manage requests</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                placeholder="Enter username"
                value={loginForm.username}
                onChange={handleLoginChange}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="Enter password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Log In
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: '#1e293b' }}>Demo Accounts:</strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
              <li>Alice (Staff): <code>Alice</code> / <code>password123</code></li>
              <li>Bob (Staff): <code>Bob</code> / <code>password123</code></li>
              <li>Charlie (Storekeeper): <code>Charlie</code> / <code>password123</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <h1>Inventory Request System</h1>
          <p>Secure Workspace</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', textAlign: 'right' }}>
            <div style={{ fontWeight: '700', color: '#1e1b4b' }}>{currentUser.username}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
              {currentUser.role}
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-reject" style={{ padding: '0.5rem 1rem' }}>
            Log Out
          </button>
        </div>
      </header>

      {/* Global Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="dashboard-grid">
        {/* Left Side: Submit Form (Staff only) or Role Info (Storekeeper) */}
        <div>
          {currentUser.role === 'staff' ? (
            <section className="card">
              <h2 className="card-title">Submit Request</h2>
              <form onSubmit={handleSubmitRequest}>
                <div className="form-group">
                  <label htmlFor="item_name">Item Name</label>
                  <input
                    type="text"
                    id="item_name"
                    name="item_name"
                    className="form-control"
                    placeholder="e.g. Mechanical Keyboard"
                    value={formData.item_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    className="form-control"
                    min="1"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="requested_date">Requested Date</label>
                  <input
                    type="date"
                    id="requested_date"
                    name="requested_date"
                    className="form-control"
                    value={formData.requested_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason</label>
                  <textarea
                    id="reason"
                    name="reason"
                    className="form-control"
                    rows="3"
                    placeholder="Provide justification..."
                    value={formData.reason}
                    onChange={handleFormChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </form>
            </section>
          ) : (
            <section className="card">
              <h2 className="card-title">Storekeeper Dashboard</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                You are logged in as a Storekeeper. You can review requests, approve or reject them, add notes, and mark approved requests as issued.
              </p>
              <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: '#eef2ff', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                <small style={{ fontWeight: '600', color: '#312e81' }}>Secure Actions Enforcement:</small>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#312e81' }}>
                  The backend database validates your storekeeper role and ensures you cannot approve requests you submitted.
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Right Side: Requests List & Filters */}
        <div>
          {/* Filters Bar */}
          <section className="filters-bar">
            <div className="filter-item">
              <input
                type="text"
                name="item_name"
                className="form-control"
                placeholder="Filter by Item Name..."
                value={filters.item_name}
                onChange={handleFilterChange}
              />
            </div>
            
            {/* Filter by Requester Name (only useful for storekeepers since staff only see their own requests anyway) */}
            {currentUser.role === 'storekeeper' && (
              <div className="filter-item">
                <input
                  type="text"
                  name="requester_name"
                  className="form-control"
                  placeholder="Filter by Requester Name..."
                  value={filters.requester_name}
                  onChange={handleFilterChange}
                />
              </div>
            )}

            <div className="filter-item">
              <select
                name="status"
                className="form-control"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="issued">Issued</option>
              </select>
            </div>
          </section>

          {/* Requests List */}
          {loading ? (
            <div className="loading-indicator">Loading inventory requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              No inventory requests found.
            </div>
          ) : (
            <div>
              {requests.map((req) => {
                const isSelfRequest = req.requester_id === currentUser.id;
                
                return (
                  <div key={req.id} className="request-card">
                    <div className="request-card-header">
                      <div>
                        <h3>{req.item_name}</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Requested by <strong>{req.requester_name}</strong>
                        </div>
                      </div>
                      <span className={`badge badge-${req.status}`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="request-meta">
                      <div>Quantity: <strong>{req.quantity}</strong></div>
                      <div>Date: <strong>{new Date(req.requested_date).toLocaleDateString()}</strong></div>
                      {req.status === 'issued' && (
                        <>
                          <div>Issued Qty: <strong>{req.issued_quantity}</strong></div>
                          <div>Issued At: <strong>{new Date(req.issued_at).toLocaleString()}</strong></div>
                        </>
                      )}
                    </div>

                    <div className="request-reason">
                      <strong>Reason:</strong> {req.reason}
                    </div>

                    {req.storekeeper_note && (
                      <div className="note-box">
                        <strong>Storekeeper Note:</strong> {req.storekeeper_note}
                      </div>
                    )}

                    {/* Actions Panel (Storekeeper role ONLY, and not self-submitted request) */}
                    {currentUser.role === 'storekeeper' && (
                      <div className="action-panel">
                        {isSelfRequest ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--rejected-text)', fontWeight: '600' }}>
                            ⚠ Self-approval blocked (This is your own request)
                          </div>
                        ) : (
                          <>
                            {req.status === 'pending' && (
                              <div>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add notes for decision..."
                                    value={actionNotes[req.id] || ''}
                                    onChange={(e) => setActionNotes({ ...actionNotes, [req.id]: e.target.value })}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                                    className="btn btn-sm btn-approve"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                    className="btn btn-sm btn-reject"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}

                            {req.status === 'approved' && (
                              <div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                  <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                                      Issued Qty (Max {req.quantity})
                                    </label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      min="1"
                                      max={req.quantity}
                                      value={issuedQuantities[req.id] ?? req.quantity}
                                      onChange={(e) => setIssuedQuantities({ ...issuedQuantities, [req.id]: parseInt(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                                      Storekeeper Note
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Add notes..."
                                      value={actionNotes[req.id] || ''}
                                      onChange={(e) => setActionNotes({ ...actionNotes, [req.id]: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleMarkIssued(req.id, req.quantity)}
                                  className="btn btn-sm btn-issue"
                                >
                                  Mark as Issued
                                </button>
                              </div>
                            )}

                            {(req.status === 'rejected' || req.status === 'issued') && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No further actions required.
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
