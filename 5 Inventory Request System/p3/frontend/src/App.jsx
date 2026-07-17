import React, { useEffect, useState } from 'react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Login form states
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Filtering states
  const [filterItemName, setFilterItemName] = useState('');
  const [filterRequesterName, setFilterRequesterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Submit request form states
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newRequestedDate, setNewRequestedDate] = useState('');

  // Edit modal states
  const [editingRequest, setEditingRequest] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editRequestedDate, setEditRequestedDate] = useState('');

  // Storekeeper Action modal states (Approve / Reject / Issue)
  const [activeActionRequest, setActiveActionRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // 'review' or 'issue'
  const [storekeeperNote, setStorekeeperNote] = useState('');
  const [issuedQuantity, setIssuedQuantity] = useState('');

  // Fetch requests whenever filters or active user change
  useEffect(() => {
    if (!token) return;
    fetchRequests();
  }, [token, filterItemName, filterRequesterName, filterStatus]);

  const fetchRequests = () => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (filterItemName) queryParams.append('itemName', filterItemName);
    if (filterStatus) queryParams.append('status', filterStatus);
    if (currentUser?.role === 'storekeeper' && filterRequesterName) {
      queryParams.append('requesterName', filterRequesterName);
    }

    fetch(`/api/requests?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        if (!res.ok) throw new Error('Failed to fetch inventory requests.');
        return res.json();
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

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (!usernameInput || !passwordInput) {
      setLoginError('Please enter username and password.');
      return;
    }

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
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
        // Clear login fields
        setUsernameInput('');
        setPasswordInput('');
      })
      .catch((err) => {
        setLoginError(err.message);
      });
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setRequests([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Submit request handler
  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!newItemName || !newQuantity || !newReason || !newRequestedDate) {
      alert('Please fill out all fields.');
      return;
    }
    if (parseInt(newQuantity) <= 0) {
      alert('Quantity must be a positive integer.');
      return;
    }

    fetch('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        itemName: newItemName,
        quantity: parseInt(newQuantity),
        reason: newReason,
        requestedDate: newRequestedDate
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Submission failed');
        return data;
      })
      .then(() => {
        showSuccess('Inventory request submitted successfully!');
        setNewItemName('');
        setNewQuantity('');
        setNewReason('');
        setNewRequestedDate('');
        fetchRequests();
      })
      .catch((err) => alert(err.message));
  };

  // Open edit modal for pending requests
  const openEditModal = (req) => {
    setEditingRequest(req);
    setEditItemName(req.item_name);
    setEditQuantity(req.quantity.toString());
    setEditReason(req.reason);
    const dateStr = req.requested_date ? req.requested_date.split('T')[0] : '';
    setEditRequestedDate(dateStr);
  };

  const handleUpdateRequest = (e) => {
    e.preventDefault();
    if (!editItemName || !editQuantity || !editReason || !editRequestedDate) {
      alert('Please fill out all fields.');
      return;
    }
    if (parseInt(editQuantity) <= 0) {
      alert('Quantity must be a positive integer.');
      return;
    }

    fetch(`/api/requests/${editingRequest.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        itemName: editItemName,
        quantity: parseInt(editQuantity),
        reason: editReason,
        requestedDate: editRequestedDate
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update failed');
        return data;
      })
      .then(() => {
        showSuccess('Request updated successfully!');
        setEditingRequest(null);
        fetchRequests();
      })
      .catch((err) => alert(err.message));
  };

  // Storekeeper actions
  const openActionModal = (req, type) => {
    setActiveActionRequest(req);
    setActionType(type);
    setStorekeeperNote('');
    setIssuedQuantity(req.quantity.toString());
  };

  const handleStorekeeperReview = (status) => {
    fetch(`/api/requests/${activeActionRequest.id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status,
        storekeeperNote
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Status change failed');
        return data;
      })
      .then(() => {
        showSuccess(`Request successfully ${status}!`);
        setActiveActionRequest(null);
        fetchRequests();
      })
      .catch((err) => alert(err.message));
  };

  const handleStorekeeperIssue = (e) => {
    e.preventDefault();
    if (!issuedQuantity || parseInt(issuedQuantity) <= 0) {
      alert('Please specify a positive quantity.');
      return;
    }
    if (parseInt(issuedQuantity) > activeActionRequest.quantity) {
      alert(`Cannot issue more than requested (${activeActionRequest.quantity}).`);
      return;
    }

    fetch(`/api/requests/${activeActionRequest.id}/issue`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        issuedQuantity: parseInt(issuedQuantity)
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Issuing failed');
        return data;
      })
      .then(() => {
        showSuccess('Item successfully marked as issued!');
        setActiveActionRequest(null);
        fetchRequests();
      })
      .catch((err) => alert(err.message));
  };

  // Render Login View if not logged in
  if (!token) {
    return (
      <div className="container" style={{ maxWidth: '450px', marginTop: '10vh' }}>
        <header style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <h1>📦 Inventory Request System</h1>
        </header>

        <div className="card">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Account Sign In</h2>
          {loginError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-error)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(239,68,68,0.2)' }}>
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="e.g. john_staff"
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
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn" style={{ width: '100%', marginTop: '0.5rem' }}>
              Sign In
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Demo Accounts (Password: <code>password123</code>):</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li>Staff: <code>john_staff</code> or <code>jane_staff</code></li>
              <li>Storekeeper: <code>bob_storekeeper</code> or <code>alice_storekeeper</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {successMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: 'var(--accent-success)', color: 'white', padding: '1rem 2rem',
          borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontWeight: 600
        }}>
          {successMsg}
        </div>
      )}

      {/* Header with Logout & identity display */}
      <header>
        <div>
          <h1>📦 Inventory Request System</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Logged in as: <strong>{currentUser?.full_name}</strong> ({currentUser?.role.toUpperCase()})
          </p>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-error)', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--accent-error)' }}>Error: {error}</p>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left Column: Staff Submit Request Form */}
        <div>
          {currentUser?.role === 'staff' ? (
            <div className="card">
              <h2>New Inventory Request</h2>
              <form onSubmit={handleCreateRequest}>
                <div className="form-group">
                  <label htmlFor="itemName">Item Name</label>
                  <input
                    id="itemName"
                    type="text"
                    placeholder="e.g. ThinkPad Laptop"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reason">Reason for Request</label>
                  <textarea
                    id="reason"
                    rows="3"
                    placeholder="Provide justification..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="requestedDate">Required Date</label>
                  <input
                    id="requestedDate"
                    type="date"
                    value={newRequestedDate}
                    onChange={(e) => setNewRequestedDate(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn" style={{ width: '100%' }}>
                  Submit Request
                </button>
              </form>
            </div>
          ) : (
            <div className="card" style={{ opacity: 0.85 }}>
              <h2>Storekeeper Controls</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                You are currently viewing the admin workspace.
              </p>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Review all staff requests</li>
                <li>Approve or Reject pending requests with custom review feedback</li>
                <li>Record item delivery details (issued quantity)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Listing and Filter actions */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2>
                {currentUser?.role === 'staff' ? 'My Submitted Requests' : 'All Inventory Requests'}
              </h2>
              {loading && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading...</span>}
            </div>

            {/* Filter controls */}
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Filter by Item Name..."
                value={filterItemName}
                onChange={(e) => setFilterItemName(e.target.value)}
              />
              {currentUser?.role === 'storekeeper' && (
                <input
                  type="text"
                  placeholder="Filter by Staff Name..."
                  value={filterRequesterName}
                  onChange={(e) => setFilterRequesterName(e.target.value)}
                />
              )}
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="issued">Issued</option>
              </select>
            </div>

            {/* Requests List */}
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No requests match the criteria.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Try modifying your filter options.</p>
              </div>
            ) : (
              <div className="request-list">
                {requests.map((req) => (
                  <div key={req.id} className="request-item">
                    <div className="request-header">
                      <div>
                        <span className="request-title">{req.item_name}</span>
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          x {req.quantity}
                        </span>
                      </div>
                      <span className={`status-badge ${req.status}`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="request-details">
                      <div><strong>Requester:</strong> {req.requester_name}</div>
                      <div><strong>Required By:</strong> {new Date(req.requested_date).toLocaleDateString()}</div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <strong>Reason:</strong> {req.reason}
                      </div>
                      {req.status === 'issued' && (
                        <>
                          <div><strong>Issued Qty:</strong> {req.issued_quantity}</div>
                          <div><strong>Issued At:</strong> {new Date(req.issued_at).toLocaleString()}</div>
                        </>
                      )}
                    </div>

                    {req.storekeeper_note && (
                      <div className="note-box">
                        <strong>Storekeeper Note:</strong> {req.storekeeper_note}
                      </div>
                    )}

                    {/* Action buttons based on Role and Status */}
                    {currentUser?.role === 'staff' && req.status === 'pending' && (
                      <div className="request-actions">
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openEditModal(req)}>
                          Edit Request
                        </button>
                      </div>
                    )}

                    {currentUser?.role === 'storekeeper' && req.status === 'pending' && (
                      <div className="request-actions">
                        {req.requester_id === currentUser.id ? (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            Self-approval disabled
                          </span>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => openActionModal(req, 'review')}
                          >
                            Approve / Reject
                          </button>
                        )}
                      </div>
                    )}

                    {currentUser?.role === 'storekeeper' && req.status === 'approved' && (
                      <div className="request-actions">
                        {req.requester_id === currentUser.id ? (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            Self-issuing disabled
                          </span>
                        ) : (
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => openActionModal(req, 'issue')}
                          >
                            Mark as Issued
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Request Modal (Staff) */}
      {editingRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Inventory Request</h2>
            <form onSubmit={handleUpdateRequest}>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reason for Request</label>
                <textarea
                  rows="3"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Required Date</label>
                <input
                  type="date"
                  value={editRequestedDate}
                  onChange={(e) => setEditRequestedDate(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  Save Changes
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingRequest(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal (Storekeeper) */}
      {activeActionRequest && actionType === 'review' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Review Inventory Request</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Reviewing request for <strong>{activeActionRequest.item_name}</strong> requested by {activeActionRequest.requester_name}.
            </p>
            <div className="form-group">
              <label>Storekeeper Decision Feedback / Note</label>
              <textarea
                rows="3"
                placeholder="Explain approval or rejection decision..."
                value={storekeeperNote}
                onChange={(e) => setStorekeeperNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-success"
                style={{ flex: 1 }}
                onClick={() => handleStorekeeperReview('approved')}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn btn-error"
                style={{ flex: 1 }}
                onClick={() => handleStorekeeperReview('rejected')}
              >
                Reject
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveActionRequest(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal (Storekeeper) */}
      {activeActionRequest && actionType === 'issue' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Delivery (Issue)</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Confirm delivery of <strong>{activeActionRequest.item_name}</strong>. Requested quantity: {activeActionRequest.quantity}.
            </p>
            <form onSubmit={handleStorekeeperIssue}>
              <div className="form-group">
                <label>Actual Issued Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={activeActionRequest.quantity}
                  value={issuedQuantity}
                  onChange={(e) => setIssuedQuantity(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  Confirm Delivery
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveActionRequest(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
