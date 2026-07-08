import React, { useState, useEffect } from 'react';

const PRESET_ROOMS = [
  'Conference Room A',
  'Boardroom',
  'Meeting Room B',
  'Training Room',
  'Huddle Space'
];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeUser, setActiveUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );

  // Login Form States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Bookings List States
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form states for creating/editing bookings
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [roomName, setRoomName] = useState(PRESET_ROOMS[0]);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  // Filters state
  const [filterRoom, setFilterRoom] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Review modal states (Coordinator action)
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [coordinatorNote, setCoordinatorNote] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch bookings based on active user and filters
  const fetchBookings = async () => {
    if (!token || !activeUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterRoom) params.append('roomName', filterRoom);
      if (filterDate) params.append('bookingDate', filterDate);
      if (filterStatus) params.append('status', filterStatus);

      const res = await fetch(`${apiUrl}/bookings?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load bookings: ${res.statusText}`);
      }

      const data = await res.json();
      setBookings(data.bookings || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeUser) {
      fetchBookings();
    }
  }, [token, activeUser, filterRoom, filterDate, filterStatus]);

  // Reset form inputs
  const resetForm = () => {
    setEditingBookingId(null);
    setRoomName(PRESET_ROOMS[0]);
    setBookingDate('');
    setStartTime('');
    setEndTime('');
    setPurpose('');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      // Save session
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setActiveUser(data.user);
      setUsernameInput('');
      setPasswordInput('');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setActiveUser(null);
    setBookings([]);
    resetForm();
  };

  // Form submission (Create or Edit)
  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!roomName || !bookingDate || !startTime || !endTime || !purpose) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    if (endTime <= startTime) {
      showNotification('End time must be after the start time.', 'error');
      return;
    }

    const bookingPayload = {
      roomName,
      bookingDate,
      startTime,
      endTime,
      purpose,
      requesterId: activeUser.id
    };

    try {
      let res;
      if (editingBookingId) {
        res = await fetch(`${apiUrl}/bookings/${editingBookingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingPayload)
        });
      } else {
        res = await fetch(`${apiUrl}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingPayload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      showNotification(
        editingBookingId 
          ? 'Booking updated successfully!' 
          : 'Booking request submitted successfully!'
      );
      resetForm();
      fetchBookings();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Cancel own booking
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;

    try {
      const res = await fetch(`${apiUrl}/bookings/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel booking');
      }

      showNotification('Booking cancelled successfully.');
      fetchBookings();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Populate form for editing
  const handleEditClick = (booking) => {
    setEditingBookingId(booking.id);
    setRoomName(booking.roomName);
    const formattedDate = booking.bookingDate.split('T')[0];
    setBookingDate(formattedDate);
    setStartTime(booking.startTime);
    setEndTime(booking.endTime);
    setPurpose(booking.purpose);
  };

  // Coordinator: Open review modal
  const handleOpenReview = (booking) => {
    setReviewingBooking(booking);
    setCoordinatorNote(booking.coordinatorNote || '');
  };

  // Coordinator: Submit approval/rejection
  const handleSubmitReview = async (status) => {
    if (!reviewingBooking) return;

    try {
      const res = await fetch(`${apiUrl}/bookings/${reviewingBooking.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          coordinatorNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Status update failed');
      }

      showNotification(`Booking has been ${status} successfully.`);
      setReviewingBooking(null);
      setCoordinatorNote('');
      fetchBookings();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Render Login Screen if not authenticated
  if (!token || !activeUser) {
    return (
      <div className="app-wrapper" style={{ justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
        <div className="welcome-card" style={{ maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Room Booking</h2>
          <p style={{ textAlign: 'center', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Please log in to manage your bookings.
          </p>

          {loginError && (
            <div className="notification notification-error" style={{ padding: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.9rem' }}>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                value={usernameInput} 
                onChange={(e) => setUsernameInput(e.target.value)} 
                className="form-input" 
                placeholder="e.g., alice_staff"
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                className="form-input" 
                placeholder="e.g., password123"
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Sign In
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: var(--text-secondary) }}>
            <strong>Demo Logins (Password: <code>password123</code>):</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem' }}>
              <li><code>alice_staff</code> (Staff Member)</li>
              <li><code>bob_staff</code> (Staff Member)</li>
              <li><code>charlie_coord</code> (Coordinator)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="logo-section">
          <h1>Room Booking System</h1>
        </div>
        
        <div className="user-switcher">
          <span className="user-select-label">Logged in as:</span>
          <strong style={{ color: 'var(--text-primary)', marginRight: '0.5rem' }}>{activeUser.username}</strong>
          <span className={`role-badge role-${activeUser.role}`} style={{ marginRight: '1rem' }}>
            {activeUser.role}
          </span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className={`dashboard-container ${activeUser.role === 'staff' ? 'staff-layout' : ''}`}>
        
        {notification && (
          <div className={`notification notification-${notification.type}`} style={{ gridColumn: '1 / -1' }}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="notification-close">&times;</button>
          </div>
        )}

        {/* Staff view left form column */}
        {activeUser.role === 'staff' && (
          <section className="form-card">
            <h2>{editingBookingId ? 'Edit Booking Request' : 'Request Room Booking'}</h2>
            <form onSubmit={handleSubmitBooking}>
              <div className="form-group">
                <label>Room Name</label>
                <select 
                  value={roomName} 
                  onChange={(e) => setRoomName(e.target.value)}
                  className="form-select"
                >
                  {PRESET_ROOMS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={bookingDate} 
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Start Time</label>
                <input 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Purpose</label>
                <textarea 
                  value={purpose} 
                  onChange={(e) => setPurpose(e.target.value)}
                  className="form-textarea"
                  rows="3"
                  placeholder="Describe booking purpose..."
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary">
                {editingBookingId ? 'Save Changes' : 'Submit Request'}
              </button>
              
              {editingBookingId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="btn btn-secondary" 
                  style={{ marginTop: '0.75rem' }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </section>
        )}

        {/* Right Bookings list column */}
        <section className="list-section">
          <div className="section-header">
            <h2>
              {activeUser.role === 'staff' ? 'My Booking Requests' : 'All Booking Requests'}
            </h2>
          </div>

          {/* Filtering Bar */}
          <div className="filters-bar">
            <div className="filter-item">
              <label>Filter by Room</label>
              <select 
                value={filterRoom} 
                onChange={(e) => setFilterRoom(e.target.value)}
                className="form-select"
              >
                <option value="">All Rooms</option>
                {PRESET_ROOMS.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Filter by Date</label>
              <input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="filter-item">
              <label>Filter by Status</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {(filterRoom || filterDate || filterStatus) && (
              <button 
                onClick={() => {
                  setFilterRoom('');
                  setFilterDate('');
                  setFilterStatus('');
                }}
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '0.6rem 1rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="loading-spinner">Loading bookings...</div>
          ) : error ? (
            <div className="notification notification-error">
              <span>{error}</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <h3>No bookings found</h3>
              <p>Try resetting filters or submitting a new room booking request.</p>
            </div>
          ) : (
            <div className="bookings-grid">
              {bookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="card-header">
                    <span className="room-name">{booking.roomName}</span>
                    <span className={`booking-status status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="booking-detail-item">
                    <span className="detail-label">Requested by:</span>
                    <span className="detail-value">{booking.requesterName}</span>
                  </div>

                  <div className="booking-detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{booking.bookingDate.split('T')[0]}</span>
                  </div>

                  <div className="booking-detail-item">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{booking.startTime} - {booking.endTime}</span>
                  </div>

                  <div className="booking-purpose">
                    &ldquo;{booking.purpose}&rdquo;
                  </div>

                  {booking.coordinatorNote && (
                    <div className="coordinator-note-box">
                      <span className="note-label">Coordinator Note:</span>
                      <p>{booking.coordinatorNote}</p>
                    </div>
                  )}

                  {/* Contextual Action Buttons */}
                  <div className="card-actions">
                    {activeUser.role === 'staff' && booking.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleEditClick(booking)} 
                          className="btn btn-secondary"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleCancelBooking(booking.id)} 
                          className="btn btn-danger"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {activeUser.role === 'coordinator' && (
                      <button 
                        onClick={() => handleOpenReview(booking)} 
                        className="btn btn-primary"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Review Dialog Modal overlay */}
      {reviewingBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-header">Review Booking Request</h3>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <p><strong>Room:</strong> {reviewingBooking.roomName}</p>
              <p><strong>Date:</strong> {reviewingBooking.bookingDate.split('T')[0]}</p>
              <p><strong>Time:</strong> {reviewingBooking.startTime} - {reviewingBooking.endTime}</p>
              <p><strong>Purpose:</strong> {reviewingBooking.purpose}</p>
              <p><strong>Requester:</strong> {reviewingBooking.requesterName}</p>
            </div>

            <div className="form-group">
              <label>Coordinator Notes</label>
              <textarea 
                value={coordinatorNote} 
                onChange={(e) => setCoordinatorNote(e.target.value)}
                className="form-textarea"
                rows="3"
                placeholder="Enter feedback or notes..."
              ></textarea>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => handleSubmitReview('approved')} 
                className="btn btn-success"
              >
                Approve
              </button>
              <button 
                onClick={() => handleSubmitReview('rejected')} 
                className="btn btn-danger"
              >
                Reject
              </button>
              <button 
                onClick={() => setReviewingBooking(null)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
