import { useState, useEffect } from 'react';
import './App.css';

const EQUIPMENTS = ['Centrifuge A', 'Spectrophotometer', 'Autoclave 1', 'PCR Machine', 'Gel Electrophoresis', 'Lab Incubator'];

function App() {
  // Authentication states
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Main system states
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ equipment: '', date: '', status: '' });
  
  // Form state
  const [equipmentName, setEquipmentName] = useState(EQUIPMENTS[0]);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Editing state
  const [editingBooking, setEditingBooking] = useState(null);

  // Decision Modal/State
  const [actionBooking, setActionBooking] = useState(null);
  const [assistantComment, setAssistantComment] = useState('');
  const [actionError, setActionError] = useState('');

  // Logout utility
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setBookings([]);
    setEditingBooking(null);
    setActionBooking(null);
  };

  // Helper for authenticated fetch requests
  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired');
    }
    return response;
  };

  // Fetch bookings
  const fetchBookings = async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (filters.equipment) params.append('equipment', filters.equipment);
      if (filters.date) params.append('date', filters.date);
      if (filters.status) params.append('status', filters.status);

      const res = await authenticatedFetch(`http://localhost:5000/api/bookings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token, filters]);

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setUsernameInput('');
        setPasswordInput('');
      } else {
        const errorData = await res.json();
        setLoginError(errorData.error || 'Login failed.');
      }
    } catch (err) {
      setLoginError('Server connection error. Please try again.');
    }
  };

  // Handle request or update booking
  const handleRequestBooking = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!bookingDate || !startTime || !endTime || !purpose.trim()) {
      setFormError('Please fill out all fields.');
      return;
    }

    try {
      const url = editingBooking 
        ? `http://localhost:5000/api/bookings/${editingBooking.id}`
        : 'http://localhost:5000/api/bookings';
      const method = editingBooking ? 'PUT' : 'POST';

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment_name: equipmentName,
          booking_date: bookingDate,
          start_time: startTime + (startTime.length === 5 ? ':00' : ''),
          end_time: endTime + (endTime.length === 5 ? ':00' : ''),
          purpose
        })
      });

      if (res.ok) {
        setFormSuccess(editingBooking ? 'Booking updated successfully!' : 'Booking requested successfully!');
        setBookingDate('');
        setStartTime('');
        setEndTime('');
        setPurpose('');
        setEditingBooking(null);
        fetchBookings();
      } else {
        const errorData = await res.json();
        setFormError(errorData.error || 'Failed to submit request.');
      }
    } catch (err) {
      setFormError('Connection error. Please try again.');
    }
  };

  // Handle Approve/Reject decision
  const handleDecision = async (status) => {
    setActionError('');
    if (!assistantComment.trim()) {
      setActionError('Comment is required to approve or reject a request.');
      return;
    }

    try {
      const res = await authenticatedFetch(`http://localhost:5000/api/bookings/${actionBooking.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assistant_comment: assistantComment
        })
      });

      if (res.ok) {
        setActionBooking(null);
        setAssistantComment('');
        fetchBookings();
      } else {
        const errorData = await res.json();
        setActionError(errorData.error || 'Failed to update booking.');
      }
    } catch (err) {
      setActionError('Connection error. Please try again.');
    }
  };

  // Handle direct assistant status updates (Collected, Returned)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await authenticatedFetch(`http://localhost:5000/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchBookings();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update booking status.');
      }
    } catch (err) {
      alert('Connection error. Please try again.');
    }
  };

  // Render Login view if not authenticated
  if (!token || !user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-brand">
            <span className="brand-logo">🧪</span>
            <h2>Lab Booking Login</h2>
            <p className="subtitle">Sign in to request and manage shared equipment</p>
          </div>

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter username (e.g. john_doe, alice)"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>

            {loginError && <div className="error-alert">{loginError}</div>}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Sign In
            </button>
          </form>

          <div className="login-footer">
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: '1.5rem' }}>
              Demo accounts password: <code>password123</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-logo">🧪</span>
          <div>
            <h2>Lab Booking</h2>
            <p className="subtitle">Shared Lab Equipment Management</p>
          </div>
        </div>

        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-role badge-role">{user.role}</span>
          </div>
          <button className="btn btn-logout" onClick={handleLogout}>Log Out</button>
        </div>
      </header>

      <main className="main-content">
        {user.role === 'Staff' ? (
          <div className="grid-layout">
            {/* Staff Booking Request Form */}
            <section className="form-card">
              <h3>{editingBooking ? 'Edit Booking Request' : 'Request Equipment'}</h3>
              <form onSubmit={handleRequestBooking}>
                <div className="form-group">
                  <label htmlFor="equipment">Equipment</label>
                  <select
                    id="equipment"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                  >
                    {EQUIPMENTS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>

                <div className="time-row">
                  <div className="form-group">
                    <label htmlFor="start">Start Time</label>
                    <input
                      type="time"
                      id="start"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end">End Time</label>
                    <input
                      type="time"
                      id="end"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="purpose">Purpose</label>
                  <textarea
                    id="purpose"
                    rows="3"
                    placeholder="Describe experimental purpose..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>

                {formError && <div className="error-alert">{formError}</div>}
                {formSuccess && <div className="success-alert">{formSuccess}</div>}

                <button type="submit" className="btn btn-primary">
                  {editingBooking ? 'Update Request' : 'Submit Request'}
                </button>

                {editingBooking && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                    onClick={() => {
                      setEditingBooking(null);
                      setEquipmentName(EQUIPMENTS[0]);
                      setBookingDate('');
                      setStartTime('');
                      setEndTime('');
                      setPurpose('');
                      setFormError('');
                      setFormSuccess('');
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </section>

            {/* My Bookings List */}
            <section className="list-card">
              <div className="card-header">
                <h3>My Bookings ({user.username})</h3>
                <button className="btn-refresh" onClick={fetchBookings}>🔄 Refresh</button>
              </div>

              {/* Booking Filters */}
              <div className="filters-bar">
                <input
                  type="text"
                  placeholder="Filter by equipment..."
                  value={filters.equipment}
                  onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}
                />
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Collected">Collected</option>
                  <option value="Returned">Returned</option>
                </select>
                {(filters.equipment || filters.date || filters.status) && (
                  <button className="btn-clear" onClick={() => setFilters({ equipment: '', date: '', status: '' })}>Clear</button>
                )}
              </div>

              <div className="bookings-grid">
                {bookings.length === 0 ? (
                  <div className="no-bookings">No booking requests found.</div>
                ) : (
                  bookings.map((booking) => (
                    <div className="booking-item-card" key={booking.id}>
                      <div className="booking-card-header">
                        <h4 className="equipment-title">{booking.equipment_name}</h4>
                        <span className={`badge badge-${booking.status.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="booking-details">
                        <p><strong>Date:</strong> {new Date(booking.booking_date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}</p>
                        <p><strong>Purpose:</strong> {booking.purpose}</p>
                        {booking.assistant_comment && (
                          <div className="comment-box">
                            <span className="comment-label">Assistant Note:</span>
                            <p className="comment-text">"{booking.assistant_comment}"</p>
                          </div>
                        )}
                        {booking.status === 'Pending' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ marginTop: '0.75rem', fontSize: '0.85rem', padding: '0.4rem', width: '100%' }}
                            onClick={() => {
                              setEditingBooking(booking);
                              setEquipmentName(booking.equipment_name);
                              const dateStr = new Date(booking.booking_date).toISOString().split('T')[0];
                              setBookingDate(dateStr);
                              setStartTime(booking.start_time.substring(0, 5));
                              setEndTime(booking.end_time.substring(0, 5));
                              setPurpose(booking.purpose);
                              setFormError('');
                              setFormSuccess('');
                            }}
                          >
                            ✏️ Edit Request
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : (
          /* Lab Assistant View */
          <div className="full-layout">
            <section className="list-card">
              <div className="card-header">
                <h3>All Booking Requests (Lab Assistant Portal)</h3>
                <button className="btn-refresh" onClick={fetchBookings}>🔄 Refresh</button>
              </div>

              {/* Booking Filters */}
              <div className="filters-bar">
                <input
                  type="text"
                  placeholder="Filter by equipment..."
                  value={filters.equipment}
                  onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}
                />
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Collected">Collected</option>
                  <option value="Returned">Returned</option>
                </select>
                {(filters.equipment || filters.date || filters.status) && (
                  <button className="btn-clear" onClick={() => setFilters({ equipment: '', date: '', status: '' })}>Clear</button>
                )}
              </div>

              <div className="table-responsive">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Requested User</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      <th>Assistant Comment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="no-bookings">No booking requests found.</td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td><strong>{booking.equipment_name}</strong></td>
                          <td>{booking.requested_user}</td>
                          <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                          <td>{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}</td>
                          <td><p className="purpose-cell" title={booking.purpose}>{booking.purpose}</p></td>
                          <td>
                            <span className={`badge badge-${booking.status.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td>{booking.assistant_comment || <span className="muted">-</span>}</td>
                          <td>
                            {booking.status === 'Pending' ? (
                              <button
                                className="btn btn-action"
                                onClick={() => setActionBooking(booking)}
                              >
                                Review
                              </button>
                            ) : booking.status === 'Approved' ? (
                              <button
                                className="btn btn-action"
                                style={{ backgroundColor: 'var(--pending)', color: '#fff' }}
                                onClick={() => handleUpdateStatus(booking.id, 'Collected')}
                              >
                                Collect
                              </button>
                            ) : booking.status === 'Collected' ? (
                              <button
                                className="btn btn-action"
                                style={{ backgroundColor: 'var(--success)', color: '#fff' }}
                                onClick={() => handleUpdateStatus(booking.id, 'Returned')}
                              >
                                Return
                              </button>
                            ) : (
                              <span className="text-completed">
                                {booking.status === 'Rejected' ? 'Rejected' : 'Returned'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Review Action Drawer/Modal */}
            {actionBooking && (
              <div className="action-modal-overlay">
                <div className="action-modal">
                  <h3>Review Booking Request</h3>
                  <div className="modal-summary">
                    <p><strong>Equipment:</strong> {actionBooking.equipment_name}</p>
                    <p><strong>User:</strong> {actionBooking.requested_user}</p>
                    <p><strong>Time:</strong> {new Date(actionBooking.booking_date).toLocaleDateString()} @ {actionBooking.start_time.substring(0, 5)} - {actionBooking.end_time.substring(0, 5)}</p>
                    <p><strong>Purpose:</strong> {actionBooking.purpose}</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="comment">Assistant Decision Comment</label>
                    <textarea
                      id="comment"
                      rows="3"
                      placeholder="Add reason for approval or rejection..."
                      value={assistantComment}
                      onChange={(e) => setAssistantComment(e.target.value)}
                    />
                  </div>

                  {actionError && <div className="error-alert">{actionError}</div>}

                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => setActionBooking(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={() => handleDecision('Rejected')}>Reject</button>
                    <button className="btn btn-success" onClick={() => handleDecision('Approved')}>Approve</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
