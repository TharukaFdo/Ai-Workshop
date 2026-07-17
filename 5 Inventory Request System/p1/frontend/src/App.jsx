import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('inventory_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login Form State
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Application Data State
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [filterItem, setFilterItem] = useState('');
  const [filterRequester, setFilterRequester] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form State (for Staff)
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    reason: '',
    requested_date: new Date().toISOString().split('T')[0]
  });

  // Action Notes State (keyed by request ID)
  const [notes, setNotes] = useState({});
  const [issuedQuantities, setIssuedQuantities] = useState({});

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = () => {
    setLoading(true);
    fetch('/api/requests', {
      headers: {
        'Authorization': user.username
      }
    })
      .then(res => {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please login again.');
        }
        if (!res.ok) throw new Error('Failed to load requests');
        return res.json();
      })
      .then(data => {
        setRequests(data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        return data;
      })
      .then(loggedInUser => {
        setUser(loggedInUser);
        localStorage.setItem('inventory_user', JSON.stringify(loggedInUser));
        setLoginData({ username: '', password: '' });
      })
      .catch(err => setLoginError(err.message));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('inventory_user');
    setRequests([]);
  };

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNoteChange = (id, val) => {
    setNotes(prev => ({ ...prev, [id]: val }));
  };

  const handleIssuedQtyChange = (id, val) => {
    setIssuedQuantities(prev => ({ ...prev, [id]: val }));
  };

  // Submit new request (Staff)
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!formData.item_name || !formData.quantity || !formData.reason || !formData.requested_date) {
      alert('Please fill in all fields');
      return;
    }

    fetch('/api/requests', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': user.username
      },
      body: JSON.stringify({
        ...formData,
        quantity: parseInt(formData.quantity)
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit request');
        return data;
      })
      .then(newRequest => {
        setRequests(prev => [newRequest, ...prev]);
        setFormData({
          item_name: '',
          quantity: '',
          reason: '',
          requested_date: new Date().toISOString().split('T')[0]
        });
      })
      .catch(err => alert(`Error: ${err.message}`));
  };

  // Action on request (Storekeeper)
  const handleRequestAction = (id, actionStatus) => {
    const note = notes[id] || '';
    
    let issuedQty = null;
    if (actionStatus === 'issued') {
      const originalReq = requests.find(r => r.id === id);
      const rawQty = issuedQuantities[id];
      const parsed = rawQty !== undefined ? parseInt(rawQty) : (originalReq ? originalReq.quantity : 1);
      
      if (isNaN(parsed) || parsed <= 0) {
        alert('Issued quantity must be a positive integer greater than 0');
        return;
      }
      if (originalReq && parsed > originalReq.quantity) {
        alert(`Issued quantity (${parsed}) cannot exceed the requested quantity (${originalReq.quantity})`);
        return;
      }
      issuedQty = parsed;
    }
    
    fetch(`/api/requests/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': user.username
      },
      body: JSON.stringify({
        status: actionStatus,
        storekeeper_note: note,
        issued_quantity: issuedQty
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update request');
        return data;
      })
      .then(updated => {
        setRequests(prev => prev.map(req => req.id === id ? { 
          ...req, 
          status: updated.status, 
          storekeeper_note: updated.storekeeper_note,
          issued_quantity: updated.issued_quantity 
        } : req));
        setNotes(prev => {
          const updatedNotes = { ...prev };
          delete updatedNotes[id];
          return updatedNotes;
        });
        setIssuedQuantities(prev => {
          const updatedQty = { ...prev };
          delete updatedQty[id];
          return updatedQty;
        });
      })
      .catch(err => alert(`Action Denied: ${err.message}`));
  };

  // Filter Logic
  const filteredRequests = requests.filter(req => {
    const matchesItem = req.item_name.toLowerCase().includes(filterItem.toLowerCase());
    const matchesRequester = req.requester_name.toLowerCase().includes(filterRequester.toLowerCase());
    const matchesStatus = filterStatus ? req.status === filterStatus : true;
    return matchesItem && matchesRequester && matchesStatus;
  });

  // Login Screen Render
  if (!user) {
    return (
      <div className="login-container">
        <header className="header">
          <h1>Inventory Request System</h1>
          <p className="subtitle">Database-Backed User Authentication</p>
        </header>

        <main className="login-card">
          <h2>Account Sign In</h2>
          <form onSubmit={handleLoginSubmit} className="login-form">
            {loginError && <div className="error-banner">{loginError}</div>}
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input 
                type="text" 
                id="username" 
                value={loginData.username} 
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username (e.g. alice, john)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                value={loginData.password} 
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="login-btn">Log In</button>
          </form>

          <div className="account-helpers">
            <h4>Demo Credentials:</h4>
            <ul>
              <li><strong>Staff accounts:</strong> <code>alice</code> or <code>bob</code> (password: <code>password</code>)</li>
              <li><strong>Storekeeper accounts:</strong> <code>john</code> or <code>sarah</code> (password: <code>password</code>)</li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard Render
  return (
    <div className="container">
      {/* Logged In Navbar */}
      <nav className="navbar">
        <div className="nav-title">Inventory Dashboard</div>
        <div className="nav-profile">
          <span className="profile-text">
            Logged in as: <strong className="user-highlight">{user.display_name}</strong> ({user.role.toUpperCase()})
          </span>
          <button onClick={handleLogout} className="logout-btn">Log Out</button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="main-content">
        
        {/* Left Hand Form Area: Visible only to Staff */}
        {user.role === 'staff' && (
          <section className="card form-section">
            <h2>Request New Inventory Item</h2>
            <form onSubmit={handleRequestSubmit} className="request-form">
              <div className="form-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  name="item_name" 
                  value={formData.item_name}
                  onChange={handleFormInputChange}
                  placeholder="e.g. Ergonomic Office Chair" 
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={formData.quantity}
                    onChange={handleFormInputChange}
                    min="1" 
                    placeholder="1" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Needed By</label>
                  <input 
                    type="date" 
                    name="requested_date" 
                    value={formData.requested_date}
                    onChange={handleFormInputChange}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea 
                  name="reason" 
                  value={formData.reason}
                  onChange={handleFormInputChange}
                  placeholder="Why do you need this item?" 
                  rows="3" 
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">Submit Request</button>
            </form>
          </section>
        )}

        {/* Right Hand Dashboard Area: List, Filter, Actions */}
        <section className={`card dashboard-section ${user.role === 'storekeeper' ? 'full-width' : ''}`}>
          <div className="section-header">
            <h2>{user.role === 'storekeeper' ? 'Manage Inventory Requests' : 'My Requests Status'}</h2>
            <button onClick={fetchRequests} className="refresh-btn">Refresh ⟳</button>
          </div>

          {/* Filters */}
          <div className="filters-container">
            <input 
              type="text" 
              placeholder="Filter by Item..." 
              value={filterItem}
              onChange={(e) => setFilterItem(e.target.value)}
            />
            {user.role === 'storekeeper' && (
              <input 
                type="text" 
                placeholder="Filter by Staff..." 
                value={filterRequester}
                onChange={(e) => setFilterRequester(e.target.value)}
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

          {/* Request Grid / Table */}
          {loading ? (
            <div className="loader">Loading inventory requests...</div>
          ) : error ? (
            <div className="error-msg">Error: {error}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">No matching requests found.</div>
          ) : (
            <div className="table-responsive">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Item Details</th>
                    <th>Date Needed</th>
                    <th>Status / Storekeeper Note</th>
                    {user.role === 'storekeeper' && <th>Action Panel</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => {
                    const isOwnRequest = req.requester_name.toLowerCase() === user.display_name.toLowerCase();

                    return (
                      <tr key={req.id}>
                        <td>
                          <div className="font-semibold">{req.requester_name}</div>
                          {isOwnRequest && <span className="own-badge">You</span>}
                        </td>
                        <td>
                          <div>
                            <span className="item-highlight">{req.item_name}</span>
                            <span className="qty-tag">×{req.quantity}</span>
                          </div>
                          <div className="reason-sub" title={req.reason}>Reason: {req.reason}</div>
                        </td>
                        <td>
                          {new Date(req.requested_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </td>
                        <td>
                          <span className={`status-badge ${req.status}`}>{req.status}</span>
                          {req.status === 'issued' && req.issued_quantity !== null && (
                            <span className="qty-tag">Issued: {req.issued_quantity}/{req.quantity}</span>
                          )}
                          {req.storekeeper_note ? (
                            <div className="note-display">
                              <span className="note-label">Storekeeper Note:</span>
                              <p className="note-text">{req.storekeeper_note}</p>
                            </div>
                          ) : (
                            <div className="note-display text-secondary italic">No notes added.</div>
                          )}
                        </td>
                        
                        {/* Action Panel for Storekeepers */}
                        {user.role === 'storekeeper' && (
                          <td>
                            {req.status === 'pending' ? (
                              <div className="action-box">
                                {isOwnRequest ? (
                                  <span className="error-text font-semibold">Self-approval disabled</span>
                                ) : (
                                  <>
                                    <input 
                                      type="text" 
                                      placeholder="Add storekeeper note..." 
                                      value={notes[req.id] || ''}
                                      onChange={(e) => handleNoteChange(req.id, e.target.value)}
                                      className="note-input"
                                    />
                                    <div className="action-row">
                                      <button 
                                        onClick={() => handleRequestAction(req.id, 'approved')} 
                                        className="approve-btn"
                                      >
                                        Approve
                                      </button>
                                      <button 
                                        onClick={() => handleRequestAction(req.id, 'rejected')} 
                                        className="reject-btn"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : req.status === 'approved' ? (
                              <div className="action-box">
                                {isOwnRequest ? (
                                  <span className="error-text font-semibold">Self-issuing disabled</span>
                                ) : (
                                  <>
                                    <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                                      <label className="note-label">Qty to Issue (Max {req.quantity}):</label>
                                      <input 
                                        type="number"
                                        min="1"
                                        max={req.quantity}
                                        value={issuedQuantities[req.id] !== undefined ? issuedQuantities[req.id] : req.quantity}
                                        onChange={(e) => handleIssuedQtyChange(req.id, e.target.value)}
                                        className="note-input"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => handleRequestAction(req.id, 'issued')} 
                                      className="issue-btn"
                                    >
                                      Mark as Issued
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-secondary italic">Request finalized</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <footer className="footer">
        <p>Inventory Request System Demo &copy; 2026 - Created using React & Express</p>
      </footer>
    </div>
  );
}

export default App;
