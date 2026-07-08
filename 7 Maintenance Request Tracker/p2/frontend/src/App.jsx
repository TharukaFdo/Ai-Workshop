import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import RequesterDashboard from './pages/RequesterDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState('');

  // Filters state
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Submission Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Selected Request for Technician editing
  const [editingRequest, setEditingRequest] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Load user & token from localStorage if exists
  useEffect(() => {
    const savedUser = localStorage.getItem('mrt_user');
    const savedToken = localStorage.getItem('mrt_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  // Fetch requests when user or token is logged in or filters change
  useEffect(() => {
    if (user && token) {
      fetchRequests();
    }
  }, [user, token, filterLocation, filterPriority, filterStatus]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    setRequestsError('');
    try {
      const params = new URLSearchParams();
      if (filterLocation) params.append('location', filterLocation);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterStatus) params.append('status', filterStatus);

      const res = await fetch(`/api/requests?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to load requests');
      }
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setRequestsError(err.message);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('mrt_user', JSON.stringify(data.user));
      localStorage.setItem('mrt_token', data.token);
      setUsernameInput('');
      setPasswordInput('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('mrt_user');
    localStorage.removeItem('mrt_token');
    setEditingRequest(null);
    setRequests([]);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          location,
          priority
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setFormSuccess('Request submitted successfully!');
      setTitle('');
      setDescription('');
      setLocation('');
      setPriority('Medium');
      fetchRequests();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    setUpdateError('');

    // High priority requests closure rule validation
    if (updateStatus === 'closed' && editingRequest && editingRequest.priority === 'High') {
      const existingNote = editingRequest.technician_note;
      if (!updateNote.trim() && (!existingNote || !existingNote.trim())) {
        setUpdateError('A technician note is required to close high-priority requests.');
        return;
      }
    }

    setUpdateLoading(true);

    try {
      const res = await fetch(`/api/requests/${editingRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updateStatus,
          technicianNote: updateNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }

      setEditingRequest(null);
      fetchRequests();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const selectRequestForEdit = (req) => {
    setEditingRequest(req);
    setUpdateStatus(req.status);
    setUpdateNote(req.technician_note || '');
    setUpdateError('');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'submitted':
        return { bg: '#2563eb1e', color: '#60a5fa', text: 'Submitted' };
      case 'inProgress':
        return { bg: '#d977061e', color: '#fbbf24', text: 'In Progress' };
      case 'completed':
        return { bg: '#0596691e', color: '#34d399', text: 'Completed' };
      case 'closed':
        return { bg: '#dc26261e', color: '#f87171', text: 'Closed' };
      default:
        return { bg: '#4755691e', color: '#94a3b8', text: status };
    }
  };

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'var(--font-family)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-color)' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔧 Maintenance Request Tracker
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prototype Workshop Edition</span>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>{user.username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.target.style.borderColor = 'var(--danger)'}
              onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {!user ? (
          <Login
            usernameInput={usernameInput}
            setUsernameInput={setUsernameInput}
            passwordInput={passwordInput}
            setPasswordInput={setPasswordInput}
            loginError={loginError}
            loginLoading={loginLoading}
            handleLogin={handleLogin}
          />
        ) : user.role === 'requester' ? (
          <RequesterDashboard
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            location={location}
            setLocation={setLocation}
            priority={priority}
            setPriority={setPriority}
            formSuccess={formSuccess}
            formError={formError}
            formLoading={formLoading}
            handleRequestSubmit={handleRequestSubmit}
            requests={requests}
            loadingRequests={loadingRequests}
            requestsError={requestsError}
            filterLocation={filterLocation}
            setFilterLocation={setFilterLocation}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            getStatusStyle={getStatusStyle}
            getPriorityColor={getPriorityColor}
          />
        ) : (
          <TechnicianDashboard
            requests={requests}
            loadingRequests={loadingRequests}
            requestsError={requestsError}
            filterLocation={filterLocation}
            setFilterLocation={setFilterLocation}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            editingRequest={editingRequest}
            setEditingRequest={setEditingRequest}
            selectRequestForEdit={selectRequestForEdit}
            updateStatus={updateStatus}
            setUpdateStatus={setUpdateStatus}
            updateNote={updateNote}
            setUpdateNote={setUpdateNote}
            updateError={updateError}
            updateLoading={updateLoading}
            handleUpdateRequest={handleUpdateRequest}
            getStatusStyle={getStatusStyle}
            getPriorityColor={getPriorityColor}
          />
        )}
      </main>
    </div>
  );
}

export default App;
