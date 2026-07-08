import React, { useState, useEffect } from 'react';
import BookingForm from '../components/BookingForm';

export default function Dashboard({ user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [filterRoom, setFilterRoom] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals / Selected Items
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Coordinator Notes inputs
  const [noteInputs, setNoteInputs] = useState({}); // bookingId -> string

  // Fetch bookings from backend
  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterRoom) params.append('room', filterRoom);
      if (filterDate) params.append('date', filterDate);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`http://localhost:5000/api/bookings?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
          return;
        }
        throw new Error('Failed to retrieve bookings');
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filterRoom, filterDate, filterStatus]);

  // Handle Create or Update submission
  const handleFormSubmit = async (formData) => {
    setError('');
    setSuccessMsg('');
    const method = selectedBooking ? 'PUT' : 'POST';
    const url = selectedBooking 
      ? `http://localhost:5000/api/bookings/${selectedBooking.id}` 
      : 'http://localhost:5000/api/bookings';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save booking request');
      }

      setSuccessMsg(selectedBooking ? 'Booking updated successfully!' : 'Booking requested successfully!');
      setIsFormOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  // Coordinator Status Actions
  const handleStatusUpdate = async (id, status) => {
    setError('');
    setSuccessMsg('');
    const coordinatorNote = noteInputs[id] || '';

    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status, coordinator_note: coordinatorNote })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update booking status');
      }

      setSuccessMsg(`Booking successfully ${status}!`);
      setNoteInputs(prev => ({ ...prev, [id]: '' }));
      fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderBadge = (status) => {
    return <span className={`badge badge-${status}`}>{status}</span>;
  };

  return (
    <div>
      {/* Top Header */}
      <div className="header-bar">
        <div className="logo-container">
          <h1 style={{ background: 'linear-gradient(to right, #818cf8, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Room Booking Manager
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="user-tag">{user.username} ({user.role})</span>
          <button className="btn btn-secondary" onClick={onLogout} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Logout</button>
        </div>
      </div>

      {/* Action / Alert Info */}
      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Filter Row */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Filter Bookings</h2>
          {user.role === 'Staff' && (
            <button className="btn btn-primary" onClick={() => { setSelectedBooking(null); setIsFormOpen(true); }}>
              + Book a Room
            </button>
          )}
        </div>

        <div className="filter-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search Room</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g., Board Room"
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select 
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ height: '42px' }}
            onClick={() => { setFilterRoom(''); setFilterDate(''); setFilterStatus(''); }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          {user.role === 'Coordinator' ? 'All Booking Requests' : 'Your Bookings'}
        </h2>

        {loading ? (
          <div className="loading-indicator">Loading room bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">No room bookings match the criteria.</div>
        ) : (
          <div className="bookings-table-container">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Time Range</th>
                  <th>Requester</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Coordinator Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={{ fontWeight: 600 }}>{booking.room_name}</td>
                    <td>{booking.booking_date ? booking.booking_date.split('T')[0] : ''}</td>
                    <td style={{ color: '#a5b4fc', fontWeight: '500' }}>
                      {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                    </td>
                    <td>{booking.requester_name}</td>
                    <td style={{ fontSize: '0.9rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {booking.purpose}
                    </td>
                    <td>{renderBadge(booking.status)}</td>
                    <td style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      {booking.coordinator_note || '—'}
                    </td>
                    <td>
                      {/* Coordinator Actions */}
                      {user.role === 'Coordinator' && (
                        <div className="coord-action-box">
                          <input
                            type="text"
                            placeholder="Add explanation note..."
                            className="form-control"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                            value={noteInputs[booking.id] || ''}
                            onChange={(e) => setNoteInputs({ ...noteInputs, [booking.id]: e.target.value })}
                          />
                          <div className="coord-action-buttons">
                            <button 
                              className="btn btn-success" 
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => handleStatusUpdate(booking.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Staff Actions */}
                      {user.role === 'Staff' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className={`btn btn-secondary ${booking.status !== 'pending' ? 'btn-disabled' : ''}`}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            disabled={booking.status !== 'pending'}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsFormOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className={`btn btn-danger ${booking.status !== 'pending' ? 'btn-disabled' : ''}`}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            disabled={booking.status !== 'pending'}
                            onClick={async () => {
                              if (confirm('Cancel this request?')) {
                                try {
                                  const res = await fetch(`http://localhost:5000/api/bookings/${booking.id}/status`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${user.token}`
                                    },
                                    body: JSON.stringify({ status: 'cancelled' })
                                  });
                                  if (res.ok) {
                                    setSuccessMsg('Request cancelled successfully.');
                                    fetchBookings();
                                  } else {
                                    const data = await res.json();
                                    setError(data.error || 'Failed to cancel request.');
                                  }
                                } catch (e) {
                                  setError('Failed to cancel request.');
                                }
                              }
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Create/Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <BookingForm
              booking={selectedBooking}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setSelectedBooking(null); }}
              error={error}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
