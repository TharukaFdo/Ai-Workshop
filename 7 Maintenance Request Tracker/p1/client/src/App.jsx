import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Request & Dashboard States
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Global Statistics State
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, closed: 0 });

  // Filter States
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [locationSearch, setLocationSearch] = useState('');

  // Form State (for Requester)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'Medium',
    requester_name: user?.username || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Editing state for technicians
  const [editStates, setEditStates] = useState({}); // Stores { [reqId]: { status, technician_notes } }

  // Sync requester name with logged in username
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        requester_name: user.username
      }));
    }
  }, [user]);

  // Fetch request statistics
  const fetchStats = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5001/api/requests/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch filtered requests
  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (priorityFilter !== 'All') queryParams.append('priority', priorityFilter);
      if (locationSearch.trim() !== '') queryParams.append('location', locationSearch);

      const response = await fetch(`http://localhost:5001/api/requests?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }
      if (!response.ok) {
        throw new Error('Failed to fetch requests from server');
      }
      const data = await response.json();
      setRequests(data);

      // Initialize/update edit states for each request
      const initialEditStates = {};
      data.forEach((req) => {
        initialEditStates[req.id] = {
          status: req.status,
          technician_notes: req.technician_notes || ''
        };
      });
      setEditStates(initialEditStates);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not connect to the backend API');
    } finally {
      setLoading(false);
    }
  };

  // Fetch list and stats on mount, token change, or filter updates
  useEffect(() => {
    if (token) {
      fetchRequests();
      fetchStats();
    }
  }, [token, statusFilter, priorityFilter, locationSearch]);

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setAuthError('Please enter both username and password.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUsernameInput('');
      setPasswordInput('');
    } catch (err) {
      setAuthError(err.message || 'Failed to authenticate.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setRequests([]);
    setStats({ total: 0, open: 0, inProgress: 0, closed: 0 });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location || !formData.requester_name) {
      alert('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(false);
    try {
      const response = await fetch('http://localhost:5001/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        throw new Error('Failed to save request to server');
      }

      const newRequest = await response.json();
      
      // If the request matches current filters, prepend to the local list
      const matchesStatus = statusFilter === 'All' || statusFilter === 'Open';
      const matchesPriority = priorityFilter === 'All' || priorityFilter === newRequest.priority;
      const matchesLocation = newRequest.location.toLowerCase().includes(locationSearch.toLowerCase());
      
      if (matchesStatus && matchesPriority && matchesLocation) {
        setRequests((prev) => [newRequest, ...prev]);
        setEditStates((prev) => ({
          ...prev,
          [newRequest.id]: {
            status: newRequest.status,
            technician_notes: ''
          }
        }));
      }

      // Refresh global counts
      fetchStats();

      setFormData({
        title: '',
        description: '',
        location: '',
        priority: 'Medium',
        requester_name: user?.username || ''
      });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      alert(err.message || 'An error occurred while saving the request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTechUpdateChange = (reqId, field, value) => {
    setEditStates((prev) => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [field]: value
      }
    }));
  };

  const handleTechSubmit = async (reqId, overrideStatus = null) => {
    const editData = editStates[reqId];
    const finalStatus = overrideStatus || editData.status;

    // Enforce note validation when closing urgent requests
    const targetReq = requests.find(r => r.id === reqId);
    if (finalStatus === 'Closed' && (targetReq.priority === 'High' || targetReq.is_urgent === 1)) {
      if (!editData.technician_notes || editData.technician_notes.trim() === '') {
        alert('Error: Urgent requests cannot be closed without technician notes.');
        return;
      }
    }

    try {
      const response = await fetch(`http://localhost:5001/api/requests/${reqId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: finalStatus,
          technician_notes: editData.technician_notes
        })
      });

      const data = await response.json();
      if (response.status === 403) {
        throw new Error(data.error || 'Forbidden: You are not authorized to perform this update.');
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update request');
      }

      // If the updated request no longer matches current filters, remove from UI
      const matchesStatus = statusFilter === 'All' || statusFilter === data.status;
      const matchesPriority = priorityFilter === 'All' || priorityFilter === data.priority;
      const matchesLocation = data.location.toLowerCase().includes(locationSearch.toLowerCase());

      if (matchesStatus && matchesPriority && matchesLocation) {
        setRequests((prev) =>
          prev.map((req) => (req.id === reqId ? data : req))
        );
        setEditStates((prev) => ({
          ...prev,
          [reqId]: {
            status: data.status,
            technician_notes: data.technician_notes || ''
          }
        }));
      } else {
        setRequests((prev) => prev.filter((req) => req.id !== reqId));
      }

      // Refresh global counts
      fetchStats();

      alert(`Request #${reqId} successfully updated to "${finalStatus}".`);
    } catch (err) {
      alert(err.message || 'An error occurred while updating the request');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  // RENDER LOGIN SCREEN if not logged in
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="gradient-text text-center">Maintenance Tracker</h1>
          <p className="login-subtitle text-center">Please log in with your credentials to access the system.</p>

          {authError && <div className="error-banner">{authError}</div>}

          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. requester1 or tech1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={authLoading}>
              {authLoading ? 'Verifying Credentials...' : 'Log In'}
            </button>
          </form>

          <div className="login-info-box">
            <h4>Demo Accounts:</h4>
            <ul>
              <li><strong>Requester:</strong> <code>requester1</code> / <code>password123</code></li>
              <li><strong>Technician:</strong> <code>tech1</code> / <code>password123</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // RENDER MAIN APPLICATION DASHBOARD
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-meta">
          <div className="user-profile">
            <span className="user-avatar">{user?.username[0].toUpperCase()}</span>
            <div className="user-details">
              <strong>{user?.username}</strong>
              <span className="user-role-badge">{user?.role}</span>
            </div>
          </div>
          <button className="btn btn-logout" onClick={handleLogout}>Log Out</button>
        </div>

        <h1 className="gradient-text">Maintenance Request Tracker</h1>
        <p className="subtitle">Securely report issues and manage repairs.</p>
      </header>

      {/* Summary Metrics Bar */}
      <section className="metrics-bar">
        <div className="metric-card">
          <span className="metric-num">{stats.total}</span>
          <span className="metric-label">Total Requests</span>
        </div>
        <div className="metric-card">
          <span className="metric-num text-open">{stats.open}</span>
          <span className="metric-label">Open</span>
        </div>
        <div className="metric-card">
          <span className="metric-num text-progress">{stats.inProgress}</span>
          <span className="metric-label">In Progress</span>
        </div>
        <div className="metric-card">
          <span className="metric-num text-closed">{stats.closed}</span>
          <span className="metric-label">Closed</span>
        </div>
      </section>

      <main className="app-content">
        {/* Left column: Submit form (visible to Requesters only) */}
        {user?.role === 'requester' ? (
          <section className="form-section">
            <div className="card">
              <h2>Submit a New Request</h2>
              <form onSubmit={handleSubmit} className="request-form">
                <div className="form-group">
                  <label htmlFor="requester_name">Your Name</label>
                  <input
                    type="text"
                    id="requester_name"
                    name="requester_name"
                    value={formData.requester_name}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="title">Problem Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Leaking sink in pantry"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location / Room</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Room 402, 2nd Floor Cafeteria"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="priority">Priority Level</label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Detailed Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Describe the issue so technicians understand what tools/materials to bring..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving to Database...' : 'Submit Request'}
                </button>

                {submitSuccess && (
                  <div className="success-banner">
                    ✓ Request successfully submitted and saved to MySQL!
                  </div>
                )}
              </form>
            </div>
          </section>
        ) : (
          <section className="info-section">
            <div className="card tech-welcome-card">
              <h2>Technician Portal</h2>
              <p>You have access to update job progress, append diagnostic notes, and close requests after repair completion.</p>
              <div className="portal-badge">Technician Mode Active</div>
            </div>
          </section>
        )}

        {/* Right column: Requests List */}
        <section className="list-section">
          {/* Filters Panel */}
          <div className="filters-card">
            <h3>Filter Requests</h3>
            <div className="filters-grid">
              <div className="form-group">
                <label htmlFor="filter-status">Status</label>
                <select 
                  id="filter-status" 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filter-priority">Priority</label>
                <select 
                  id="filter-priority" 
                  value={priorityFilter} 
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="search-location">Location Search</label>
                <input 
                  type="text" 
                  id="search-location"
                  placeholder="e.g. Room 102"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="list-header">
            <h2>Submitted Requests ({requests.length})</h2>
            <button className="btn btn-secondary" onClick={fetchRequests} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>

          {error && (
            <div className="error-banner">
              ⚠️ {error}. Make sure the backend server is running and the database is configured.
            </div>
          )}

          {loading && requests.length === 0 ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading maintenance requests from database...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <p>No matching maintenance requests found.</p>
            </div>
          ) : (
            <div className="requests-grid">
              {requests.map((req) => {
                const editState = editStates[req.id] || { status: req.status, technician_notes: '' };
                
                return (
                  <div key={req.id} className="request-card">
                    <div className="card-header">
                      <div className="badge-group">
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(req.priority) }}
                        >
                          {req.priority}
                        </span>
                        {req.is_urgent === 1 && (
                          <span className="urgent-badge">🚨 URGENT</span>
                        )}
                      </div>
                      <span className={`status-badge status-${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {req.status}
                      </span>
                    </div>

                    <h3 className="card-title">{req.title}</h3>
                    <p className="card-desc">{req.description}</p>

                    <div className="card-details">
                      <div className="detail-item">
                        <strong>Location:</strong> {req.location}
                      </div>
                      <div className="detail-item">
                        <strong>Submitted By:</strong> {req.requester_name}
                      </div>
                      
                      {/* Read-Only notes display */}
                      {req.technician_notes && (
                        <div className="tech-notes">
                          <strong>Technician Notes:</strong> {req.technician_notes}
                        </div>
                      )}
                    </div>

                    {/* Technician Edit Interface */}
                    {user?.role === 'technician' && (
                      <div className="tech-actions-panel">
                        <h4>Update Request Status & Notes</h4>
                        
                        <div className="form-group">
                          <label htmlFor={`tech-notes-${req.id}`}>Technician Notes</label>
                          <textarea
                            id={`tech-notes-${req.id}`}
                            value={editState.technician_notes}
                            onChange={(e) => handleTechUpdateChange(req.id, 'technician_notes', e.target.value)}
                            rows="2"
                            placeholder="Add progress/diagnostic details here..."
                          ></textarea>
                        </div>

                        <div className="tech-actions-buttons">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleTechSubmit(req.id, 'In Progress')}
                            disabled={req.status === 'Closed'}
                          >
                            Mark In Progress
                          </button>
                          
                          <button 
                            className="btn btn-primary btn-sm btn-close-action"
                            onClick={() => handleTechSubmit(req.id, 'Closed')}
                            disabled={req.status === 'Closed'}
                          >
                            Close Request
                          </button>
                          
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleTechSubmit(req.id)}
                          >
                            Save Notes Only
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="card-footer">
                      <span>ID: #{req.id}</span>
                      <span>{new Date(req.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
