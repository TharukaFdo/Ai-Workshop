import { useState, useEffect } from 'react';

function App() {
  // Login / Session State
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // App Bookings & Filters
  const [bookings, setBookings] = useState([]);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Booking Form State
  const [formData, setFormData] = useState({
    room_name: '',
    booking_date: '',
    start_time: '',
    end_time: '',
    purpose: ''
  });

  // Coordinator Actions State (notes by booking ID)
  const [actionNotes, setActionNotes] = useState({});

  const fetchBookings = () => {
    if (!user) return;

    const params = new URLSearchParams({
      userId: user.id
    });

    fetch(`http://localhost:5000/api/bookings?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('API server returned an error');
        return res.json();
      })
      .then((data) => setBookings(data))
      .catch((err) => console.error('Error fetching bookings:', err));
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setUsernameInput('');
        setPasswordInput('');
      })
      .catch((err) => {
        console.error(err);
        setLoginError('Invalid username or password.');
      });
  };

  const handleLogout = () => {
    setUser(null);
    setBookings([]);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      userId: user.id
    };

    fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create booking');
        return res.json();
      })
      .then(() => {
        setFormData({ room_name: '', booking_date: '', start_time: '', end_time: '', purpose: '' });
        fetchBookings();
      })
      .catch((err) => console.error('Error creating booking:', err));
  };

  const handleStatusUpdate = (bookingId, newStatus) => {
    const notes = actionNotes[bookingId] || '';

    fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        notes: notes,
        userId: user.id
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update status');
        return res.json();
      })
      .then(() => {
        setActionNotes((prev) => ({ ...prev, [bookingId]: '' }));
        fetchBookings();
      })
      .catch((err) => console.error('Error updating status:', err));
  };

  // Client side filtering (can filter by room, date, status)
  const filteredBookings = bookings.filter((booking) => {
    const matchesRoom = filterRoom === '' || booking.room_name.toLowerCase().includes(filterRoom.toLowerCase());
    const matchesDate = filterDate === '' || booking.booking_date.startsWith(filterDate);
    const matchesStatus = filterStatus === '' || booking.status === filterStatus;
    return matchesRoom && matchesDate && matchesStatus;
  });

  // Login view if user is not authenticated
  if (!user) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 2rem', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Room Booking System</h1>
        <div style={{ border: '1px solid #ddd', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1.5rem', color: '#555' }}>Please Log In</h2>
          {loginError && <p style={{ color: '#c0392b', fontSize: '0.9rem', marginBottom: '1rem' }}>{loginError}</p>}
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Username" 
              value={usernameInput} 
              onChange={(e) => setUsernameInput(e.target.value)} 
              required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button 
              type="submit" 
              style={{ background: '#0066cc', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Sign In
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#777', textAlign: 'left', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <p style={{ margin: '0 0 4px 0' }}><strong>Demo Credentials:</strong></p>
            <ul style={{ paddingLeft: '15px', margin: 0 }}>
              <li>Staff: <code>alice</code> / <code>password123</code></li>
              <li>Staff: <code>bob</code> / <code>password123</code></li>
              <li>Coordinator: <code>admin</code> / <code>admin123</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view if user is authenticated
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Premium Header and Session Info */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a' }}>Room Booking Portal</h1>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>Secure room scheduling & approval management</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f5f5f5', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Logged in as:</span>
            <div style={{ fontWeight: 'bold' }}>{user.username} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#777', textTransform: 'capitalize' }}>({user.role})</span></div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'staff' ? '1fr 2fr' : '1fr', gap: '2rem' }}>
        
        {/* Left Column: Booking Form (Staff Only) */}
        {user.role === 'staff' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Request a Room</h2>
            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Staff Username</label>
                <input 
                  type="text" 
                  value={user.username} 
                  disabled 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#e9e9e9' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Room Name</label>
                <input 
                  type="text" 
                  name="room_name" 
                  placeholder="e.g. Conference Room A" 
                  value={formData.room_name} 
                  onChange={handleFormChange} 
                  required 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Date</label>
                <input 
                  type="date" 
                  name="booking_date" 
                  value={formData.booking_date} 
                  onChange={handleFormChange} 
                  required 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Start Time</label>
                  <input 
                    type="time" 
                    name="start_time" 
                    value={formData.start_time} 
                    onChange={handleFormChange} 
                    required 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>End Time</label>
                  <input 
                    type="time" 
                    name="end_time" 
                    value={formData.end_time} 
                    onChange={handleFormChange} 
                    required 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Purpose</label>
                <textarea 
                  name="purpose" 
                  placeholder="Describe the meeting topic..." 
                  value={formData.purpose} 
                  onChange={handleFormChange} 
                  required 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px' }}
                />
              </div>
              <button 
                type="submit" 
                style={{ background: '#0066cc', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Submit Request
              </button>
            </form>
          </div>
        )}

        {/* Right / Full Column: Filter & Bookings Dashboard */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
              {user.role === 'coordinator' ? 'Coordinator Dashboard (All Bookings)' : 'My Requested Bookings'}
            </h2>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#f9f9f9', padding: '12px', borderRadius: '6px', border: '1px solid #eee' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <input 
                type="text" 
                placeholder="Filter by Room..." 
                value={filterRoom} 
                onChange={(e) => setFilterRoom(e.target.value)} 
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ width: '150px' }}>
              <input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ width: '150px' }}>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button 
              onClick={() => { setFilterRoom(''); setFilterDate(''); setFilterStatus(''); }} 
              style={{ background: '#e0e0e0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <p style={{ color: '#777', fontStyle: 'italic' }}>No matching bookings found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredBookings.map((booking) => {
                let statusColor = '#e67e22'; // Pending (Orange)
                if (booking.status === 'approved') statusColor = '#27ae60'; // Approved (Green)
                if (booking.status === 'rejected') statusColor = '#c0392b'; // Rejected (Red)

                return (
                  <div key={booking.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{booking.room_name}</h3>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#555' }}>
                          <strong>Date:</strong> {new Date(booking.booking_date).toLocaleDateString()} &nbsp;|&nbsp; 
                          <strong> Time:</strong> {booking.start_time.substring(0,5)} - {booking.end_time.substring(0,5)}
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                          <strong>Requested By:</strong> {booking.staff_name}
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#333' }}>
                          <strong>Purpose:</strong> {booking.purpose}
                        </p>
                        {booking.notes && (
                          <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fcf8e3', borderLeft: '4px solid #f0ad4e', borderRadius: '4px', fontSize: '0.88rem' }}>
                            <strong>Coordinator Note:</strong> {booking.notes}
                          </div>
                        )}
                      </div>
                      
                      {/* Status and Action Panel */}
                      <div style={{ textAlign: 'right', minWidth: '150px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', backgroundColor: statusColor, textTransform: 'capitalize', marginBottom: '10px' }}>
                          {booking.status}
                        </span>

                        {/* Coordinator Decision Form */}
                        {user.role === 'coordinator' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            <input 
                              type="text" 
                              placeholder="Add feedback / notes..." 
                              value={actionNotes[booking.id] || ''}
                              onChange={(e) => setActionNotes({ ...actionNotes, [booking.id]: e.target.value })}
                              style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => handleStatusUpdate(booking.id, 'approved')}
                                style={{ flex: 1, backgroundColor: '#2ac06d', color: 'white', border: 'none', padding: '5px 0', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                                style={{ flex: 1, backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 0', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
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
