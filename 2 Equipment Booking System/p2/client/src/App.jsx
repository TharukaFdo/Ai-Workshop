import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import FilterBar from './components/FilterBar';
import BookingForm from './components/BookingForm';
import BookingCard from './components/BookingCard';
import DecisionModal from './components/DecisionModal';

const EQUIPMENT_LIST = ['Spectrophotometer A', 'Centrifuge B', 'PCR Machine', 'Autoclave'];

function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('booking_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Booking Lists & Filters State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [filters, setFilters] = useState({
    equipmentName: '',
    bookingDate: '',
    status: ''
  });

  // Create Request Form State
  const [formBooking, setFormBooking] = useState({
    equipmentName: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });

  // Assistant Action Modal State
  const [activeModal, setActiveModal] = useState(null); // { booking, actionType: 'Approved' | 'Rejected' }
  const [commentText, setCommentText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch Bookings Handler
  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    setActionError('');
    try {
      const queryParams = new URLSearchParams();
      if (filters.equipmentName) queryParams.append('equipmentName', filters.equipmentName);
      if (filters.bookingDate) queryParams.append('bookingDate', filters.bookingDate);
      if (filters.status) queryParams.append('status', filters.status);

      const res = await fetch(`/api/bookings?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings.');
      setBookings(data);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters or user changes
  useEffect(() => {
    fetchBookings();
  }, [user, filters]);

  // Alert Auto-Clear
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!loginUsername || !loginPassword) {
      setAuthError('Please fill in all credentials.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed.');

      localStorage.setItem('booking_user', JSON.stringify(data));
      setUser(data);
      // Clear forms
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('booking_user');
    setUser(null);
    setBookings([]);
    setFilters({ equipmentName: '', bookingDate: '', status: '' });
  };

  // Create Booking Request Handler
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setActionError('');
    setSuccessMessage('');

    if (!formBooking.equipmentName || !formBooking.bookingDate || !formBooking.startTime || !formBooking.endTime || !formBooking.purpose) {
      setActionError('All booking fields are required.');
      return;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formBooking)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request.');

      setSuccessMessage('Booking request created successfully!');
      // Reset form fields
      setFormBooking({
        equipmentName: '',
        bookingDate: '',
        startTime: '',
        endTime: '',
        purpose: ''
      });
      fetchBookings();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Update Status Handler (Assistant Action Modal)
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!activeModal) return;
    setActionError('');
    setSubmittingAction(true);

    const { booking, actionType } = activeModal;

    if (actionType === 'Rejected' && (!commentText || !commentText.trim())) {
      setActionError('A rejection comment is mandatory.');
      setSubmittingAction(false);
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          status: actionType,
          assistantComment: commentText
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update booking request status.');

      setSuccessMessage(`Booking request was successfully ${actionType.toLowerCase()}.`);
      setActiveModal(null);
      setCommentText('');
      fetchBookings();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenActionModal = (booking, actionType) => {
    setActiveModal({ booking, actionType });
  };

  // Reset Filters
  const handleClearFilters = () => {
    setFilters({ equipmentName: '', bookingDate: '', status: '' });
  };

  // 1. Auth Page View
  if (!user) {
    return (
      <LoginForm
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        authError={authError}
        handleLogin={handleLogin}
      />
    );
  }

  // 2. Main Dashboard Page View
  return (
    <div className="container">
      {/* Header Panel */}
      <header className="navbar">
        <div>
          <h1 style={{ fontSize: '1.75rem', background: 'linear-gradient(to right, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lab Equipment Booking
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Logged in:</span>
            <span className="user-tag">{user.username} ({user.role})</span>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Notifications */}
      {actionError && <div className="alert alert-danger">{actionError}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Filtering Section */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        equipmentList={EQUIPMENT_LIST}
        handleClearFilters={handleClearFilters}
      />

      {/* Dashboard Content Grid */}
      <div className={`dashboard-grid ${user.role === 'Staff' ? 'staff-layout' : 'assistant-layout'}`}>
        
        {/* Left Column: Form (only for Staff Member) */}
        {user.role === 'Staff' && (
          <BookingForm
            formBooking={formBooking}
            setFormBooking={setFormBooking}
            equipmentList={EQUIPMENT_LIST}
            handleCreateBooking={handleCreateBooking}
          />
        )}

        {/* Right Column / Full Width: Bookings List */}
        <section className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
            {user.role === 'Staff' ? 'Your Booking Requests' : 'All Booking Requests'}
          </h2>

          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Retrieving booking data...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              No booking requests found.
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userRole={user.role}
                  onOpenModal={handleOpenActionModal}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Decision Comment Modal */}
      <DecisionModal
        activeModal={activeModal}
        commentText={commentText}
        setCommentText={setCommentText}
        submittingAction={submittingAction}
        handleStatusSubmit={handleStatusSubmit}
        onClose={() => {
          setActiveModal(null);
          setCommentText('');
        }}
      />
    </div>
  );
}

export default App;
