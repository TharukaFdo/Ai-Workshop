import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import StaffDashboard from './components/StaffDashboard';
import AssistantDashboard from './components/AssistantDashboard';
import BookingForm from './components/BookingForm';
import ActionModal from './components/ActionModal';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filtering states (lifted up to fetch from backend)
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // Modal states (For Assistant reviews)
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewAction, setReviewAction] = useState('');

  const handleLoginSuccess = (userToken, userDetails) => {
    setToken(userToken);
    setCurrentUser(userDetails);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userDetails));
    setError(null);
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setBookings([]);
    setShowForm(false);
    setEditingBooking(null);
    setReviewBooking(null);
    setFilterEquipment('');
    setFilterDate('');
    setFilterStatus('');
  };

  // Fetch bookings with backend query params
  const fetchBookings = () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const params = new URLSearchParams();
    if (filterEquipment) params.append('equipmentName', filterEquipment);
    if (filterDate) params.append('bookingDate', filterDate);
    if (filterStatus) params.append('status', filterStatus);

    const url = `/api/bookings?${params.toString()}`;

    fetch(url, { headers })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `HTTP error! status: ${res.status}`);
        return data;
      })
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch bookings: ' + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, [token, currentUser, filterEquipment, filterDate, filterStatus]);

  // Handle Form submit (Create or Edit)
  const handleFormSubmit = (formData) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const isEdit = !!editingBooking;
    const url = isEdit ? `/api/bookings/${editingBooking.id}` : '/api/bookings';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers,
      body: JSON.stringify(formData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Operation failed');
        return data;
      })
      .then(() => {
        setSuccessMessage(isEdit ? 'Booking request updated!' : 'Booking requested successfully!');
        setShowForm(false);
        setEditingBooking(null);
        fetchBookings();
        setTimeout(() => setSuccessMessage(''), 4000);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  // Handle Assistant review submit (Approve or Reject)
  const handleReviewSubmit = (id, status, comment) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, assistantComment: comment })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Review operation failed');
        return data;
      })
      .then(() => {
        setSuccessMessage(`Booking request successfully ${status}!`);
        setReviewBooking(null);
        fetchBookings();
        setTimeout(() => setSuccessMessage(''), 4000);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  if (!token || !currentUser) {
    return (
      <div className="container">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-meta">
          <h1>Equipment Booking System</h1>
          <p className="subtitle">Shared Lab Resource Coordinator</p>
        </div>
        
        <div className="role-switcher">
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Logged in as: <strong style={{ color: 'var(--text-main)' }}>{currentUser.username}</strong>
          </span>
          <span className="role-badge" data-role={currentUser.role}>
            {currentUser.role.toUpperCase()}
          </span>
          <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {successMessage && <div className="toast toast-success">{successMessage}</div>}
      {error && <div className="toast toast-error" onClick={() => setError(null)}>{error}</div>}

      <main className="main-content">
        {showForm ? (
          <BookingForm
            booking={editingBooking}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingBooking(null);
            }}
          />
        ) : currentUser.role === 'staff' ? (
          <StaffDashboard
            bookings={bookings}
            loading={loading}
            filterEquipment={filterEquipment}
            setFilterEquipment={setFilterEquipment}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onCreateClick={() => {
              setEditingBooking(null);
              setShowForm(true);
            }}
            onEditClick={(booking) => {
              setEditingBooking(booking);
              setShowForm(true);
            }}
          />
        ) : (
          <AssistantDashboard
            bookings={bookings}
            loading={loading}
            filterEquipment={filterEquipment}
            setFilterEquipment={setFilterEquipment}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onActionClick={(booking, action) => {
              setReviewBooking(booking);
              setReviewAction(action);
            }}
            onStatusTransition={handleReviewSubmit}
          />
        )}
      </main>

      {reviewBooking && (
        <ActionModal
          booking={reviewBooking}
          actionType={reviewAction}
          onSubmit={handleReviewSubmit}
          onClose={() => setReviewBooking(null)}
        />
      )}

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Equipment Booking System</p>
      </footer>
    </div>
  );
}

export default App;
