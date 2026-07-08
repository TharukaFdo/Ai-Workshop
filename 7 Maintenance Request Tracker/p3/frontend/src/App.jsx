import React, { useState, useEffect } from 'react';

const LOCATIONS = ['Lobby', 'Building A', 'Building B', 'Room 101', 'Room 102'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['submitted', 'inProgress', 'completed', 'closed'];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  // Login form states
  const [loginUsername, setLoginUsername] = useState('alice_requester');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');

  // Main UI states
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for creating a new request
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState(LOCATIONS[0]);
  const [newPriority, setNewPriority] = useState(PRIORITIES[0]);
  const [newRequesterName, setNewRequesterName] = useState('');

  // Form states for updating/editing
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPriority, setEditPriority] = useState('');
  
  // Technician edit states
  const [editStatus, setEditStatus] = useState('');
  const [editTechnicianNote, setEditTechnicianNote] = useState('');

  // Filters state
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Initialize requester name when logged in
  useEffect(() => {
    if (currentUser) {
      setNewRequesterName(currentUser.username === 'alice_requester' ? 'Alice Smith' : 'Charlie Brown');
      fetchRequests();
    }
  }, [currentUser]);

  // Fetch requests when filters change
  useEffect(() => {
    if (token) {
      fetchRequests();
    }
  }, [filterLocation, filterPriority, filterStatus]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      // Save auth state
      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setRequests([]);
    setSelectedRequest(null);
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterLocation) params.append('location', filterLocation);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/requests?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests.');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Something went wrong fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newTitle.trim() || !newDescription.trim() || !newRequesterName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          location: newLocation,
          priority: newPriority,
          requesterName: newRequesterName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      setSuccess('Maintenance request submitted successfully!');
      setNewTitle('');
      setNewDescription('');
      setNewLocation(LOCATIONS[0]);
      setNewPriority(PRIORITIES[0]);
      fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
    setEditTitle(request.title);
    setEditDescription(request.description);
    setEditLocation(request.location);
    setEditPriority(request.priority);
    setEditStatus(request.status);
    setEditTechnicianNote(request.technician_note || '');
    setError('');
    setSuccess('');
  };

  const handleRequesterUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editTitle.trim() || !editDescription.trim()) {
      setError('Title and Description are required.');
      return;
    }

    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          location: editLocation,
          priority: editPriority
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update request.');
      }

      setSuccess('Request details updated successfully!');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTechnicianUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (editStatus === 'closed' && selectedRequest.priority === 'High' && !editTechnicianNote.trim()) {
      setError('High priority requests cannot be closed without a technician note.');
      return;
    }

    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus,
          technicianNote: editTechnicianNote
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update request status/notes.');
      }

      setSuccess('Request updated successfully!');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  // Render Login view if not authenticated
  if (!token || !currentUser) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ width: '400px' }}>
          <h2 style={{ textAlign: 'center', color: 'var(--primary-color)' }}>FixIt Login 🛠️</h2>
          {loginError && <div className="alert alert-error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Select User</label>
              <select value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}>
                <option value="alice_requester">Alice Smith (Requester)</option>
                <option value="charlie_requester">Charlie Brown (Requester)</option>
                <option value="bob_technician">Bob Tech (Technician)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Note: Standard seeded password is <strong>password123</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header bar */}
      <header className="app-header">
        <div className="brand">
          <h1>FixIt Portal 🛠️</h1>
          <p>Logged in as: <strong>{currentUser.username}</strong> ({currentUser.role})</p>
        </div>
        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Alert states */}
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Main Layout Grid */}
      <div className={`dashboard-grid ${currentUser.role === 'Requester' ? 'requester-layout' : ''}`}>
        
        {/* Requester Form */}
        {currentUser.role === 'Requester' && (
          <div className="card">
            <h2>Submit Request</h2>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Your Name</label>
                <input 
                  type="text" 
                  value={newRequesterName} 
                  onChange={(e) => setNewRequesterName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Problem Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Leaking pipe" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <select value={newLocation} onChange={(e) => setNewLocation(e.target.value)}>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                  {PRIORITIES.map(pri => (
                    <option key={pri} value={pri}>{pri}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows="4" 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary">Submit Request</button>
            </form>
          </div>
        )}

        {/* List view (Both Roles) */}
        <div className="card">
          <h2>
            {currentUser.role === 'Requester' ? 'My Requests' : 'All Requests Dashboard'}
          </h2>

          <div className="filter-bar">
            <div className="filter-group">
              <label>Location</label>
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                <option value="">All Locations</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Priority</label>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="">All Priorities</option>
                {PRIORITIES.map(pri => (
                  <option key={pri} value={pri}>{pri}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(stat => (
                  <option key={stat} value={stat}>{stat}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No requests found matching filters.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} onClick={() => handleOpenDetails(req)}>
                      <td>#{req.id}</td>
                      <td><strong>{req.title}</strong></td>
                      <td>{req.location}</td>
                      <td>
                        <span className={`badge badge-${req.priority.toLowerCase()}`}>
                          {req.priority}
                        </span>
                        {req.priority === 'High' && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#b91c1c' }}>🚨 Urgent</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${req.status}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details/Action Modal */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request Details (ID #{selectedRequest.id})</h3>
              <button className="close-btn" onClick={() => setSelectedRequest(null)}>&times;</button>
            </div>

            <div className="status-row">
              <div>
                <strong>Status: </strong>
                <span className={`badge badge-${selectedRequest.status}`}>{selectedRequest.status}</span>
              </div>
              <div>
                <strong>Priority: </strong>
                <span className={`badge badge-${selectedRequest.priority.toLowerCase()}`}>{selectedRequest.priority}</span>
              </div>
            </div>

            {currentUser.role === 'Requester' ? (
              <form onSubmit={handleRequesterUpdate}>
                <div className="form-group">
                  <label>Title</label>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    disabled={selectedRequest.status !== 'submitted'} 
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <select 
                    value={editLocation} 
                    onChange={(e) => setEditLocation(e.target.value)}
                    disabled={selectedRequest.status !== 'submitted'}
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    value={editPriority} 
                    onChange={(e) => setEditPriority(e.target.value)}
                    disabled={selectedRequest.status !== 'submitted'}
                  >
                    {PRIORITIES.map(pri => (
                      <option key={pri} value={pri}>{pri}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    rows="3" 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    disabled={selectedRequest.status !== 'submitted'}
                  />
                </div>

                {selectedRequest.technician_note && (
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
                    <strong>Technician Notes:</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>{selectedRequest.technician_note}</p>
                  </div>
                )}

                {selectedRequest.status === 'submitted' ? (
                  <button type="submit" className="btn btn-primary">Update Details</button>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Note: This request is already in progress or closed and cannot be modified.
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={handleTechnicianUpdate}>
                {selectedRequest.priority === 'High' && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    ⚠️ This is a High priority request. A technician note is mandatory before you can close this request.
                  </div>
                )}
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                  <p><strong>Submitted By:</strong> {selectedRequest.requester_name}</p>
                  <p><strong>Location:</strong> {selectedRequest.location}</p>
                  <p style={{ margin: 0 }}><strong>Description:</strong> {selectedRequest.description}</p>
                </div>

                <div className="form-group">
                  <label>Update Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    {STATUSES.map(stat => (
                      <option key={stat} value={stat}>{stat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Technician Notes</label>
                  <textarea 
                    rows="4" 
                    placeholder="Enter diagnostic details..."
                    value={editTechnicianNote} 
                    onChange={(e) => setEditTechnicianNote(e.target.value)} 
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--tech-color)' }}>
                  Save Workflow & Notes
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
