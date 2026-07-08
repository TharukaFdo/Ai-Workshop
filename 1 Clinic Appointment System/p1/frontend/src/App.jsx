import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Authentication state
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('clinic_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(null);

  // Application data state
  const [appointments, setAppointments] = useState([]);

  // Filters state
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Get local YYYY-MM-DD date string
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Form & Modal states
  const [formData, setFormData] = useState({
    patient_name: '',
    contact_number: '',
    doctor_name: 'Dr. Adams',
    appointment_date: todayStr,
    appointment_time: '',
    reason: ''
  });
  
  // Editing state
  const [editingAppointment, setEditingAppointment] = useState(null);
  
  // Visit note modal state
  const [notingAppointment, setNotingAppointment] = useState(null);
  const [visitNoteText, setVisitNoteText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch appointments using authenticated headers
  const fetchAppointments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/appointments', {
        headers: {
          'Authorization': user.username
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          throw new Error('Session expired or invalid credentials.');
        }
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      setAppointments(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingAppointment({
      ...editingAppointment,
      [name]: value
    });
  };

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCredentials)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('clinic_user', JSON.stringify(data.user));
      setUser(data.user);
      setLoginCredentials({ username: '', password: '' });
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('clinic_user');
    setUser(null);
    setAppointments([]);
  };

  // Create new appointment (Receptionist only)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (formData.appointment_date < todayStr) {
      alert('Error: Cannot book appointments in the past.');
      return;
    }
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!phoneRegex.test(formData.contact_number)) {
      alert('Error: Contact number must be a valid phone number (7-15 digits/symbols).');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user.username
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save appointment');
      }

      fetchAppointments();
      setFormData({
        patient_name: '',
        contact_number: '',
        doctor_name: 'Dr. Adams',
        appointment_date: todayStr,
        appointment_time: '',
        reason: ''
      });
      alert('Appointment requested successfully! Currently Pending doctor review.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Cancel an appointment (Receptionist only)
  const handleCancel = async (apt) => {
    if (apt.status !== 'Pending' && apt.status !== 'Rejected') {
      alert('Error: Confirmed, Completed, or Cancelled appointments cannot be cancelled.');
      return;
    }
    if (!window.confirm(`Are you sure you want to cancel the appointment for ${apt.patient_name}?`)) return;
    
    try {
      const formattedDate = new Date(apt.appointment_date).toISOString().split('T')[0];
      const response = await fetch(`http://localhost:5000/api/appointments/${apt.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user.username
        },
        body: JSON.stringify({
          ...apt,
          appointment_date: formattedDate,
          status: 'Cancelled'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to cancel appointment');
      }
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Submit edit changes (Receptionist only)
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (editingAppointment.appointment_date < todayStr && editingAppointment.status !== 'Cancelled') {
      alert('Error: Appointment date cannot be in the past.');
      return;
    }
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!phoneRegex.test(editingAppointment.contact_number)) {
      alert('Error: Contact number must be a valid phone number (7-15 digits/symbols).');
      return;
    }

    try {
      const formattedDate = new Date(editingAppointment.appointment_date).toISOString().split('T')[0];
      const response = await fetch(`http://localhost:5000/api/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user.username
        },
        body: JSON.stringify({
          ...editingAppointment,
          appointment_date: formattedDate
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update appointment');
      }
      
      setEditingAppointment(null);
      fetchAppointments();
      alert('Appointment updated successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Doctor Action: Accept or Reject an appointment status
  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user.username
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to ${status.toLowerCase()} appointment`);
      }

      fetchAppointments();
      alert(`Appointment successfully ${status.toLowerCase()}!`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Submit doctor visit notes (Doctor only)
  const handleSaveNotes = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${notingAppointment.id}/notes`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user.username
        },
        body: JSON.stringify({ visit_note: visitNoteText })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save visit note');
      }

      setNotingAppointment(null);
      setVisitNoteText('');
      fetchAppointments();
      alert('Visit notes saved. Appointment marked as Completed.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const startWritingNotes = (apt) => {
    if (apt.status !== 'Confirmed' && apt.status !== 'Completed') {
      alert('Error: You can only record notes for Confirmed or Completed appointments.');
      return;
    }
    setNotingAppointment(apt);
    setVisitNoteText(apt.visit_note || '');
  };

  // Filter application helper
  const getFilteredAppointments = () => {
    return appointments.filter(apt => {
      if (user.role === 'receptionist' && filterDoctor !== 'all' && apt.doctor_name !== filterDoctor) {
        return false;
      }

      if (filterStatus !== 'all' && apt.status !== filterStatus) {
        return false;
      }

      if (filterDate) {
        const aptDateStr = new Date(apt.appointment_date).toISOString().split('T')[0];
        if (aptDateStr !== filterDate) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredList = getFilteredAppointments();

  // Render Login Card if not logged in
  if (!user) {
    return (
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-header">
            <span className="logo-icon">🏥</span>
            <h2>ClinicCare Portal Login</h2>
            <p>Enter your clinic credentials to log in.</p>
          </div>
          <form onSubmit={handleLoginSubmit} className="login-form">
            {loginError && <div className="login-alert-error">{loginError}</div>}
            <div className="form-group">
              <label htmlFor="login-username">Username</label>
              <input
                type="text"
                id="login-username"
                value={loginCredentials.username}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                required
                placeholder="receptionist or dr_adams"
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="login-submit-btn">Sign In</button>
          </form>
          <div className="demo-credentials">
            <p><strong>Demo Accounts:</strong></p>
            <ul>
              <li>Receptionist: <code>receptionist</code> / <code>password123</code></li>
              <li>Doctor Adams: <code>dr_adams</code> / <code>password123</code></li>
              <li>Doctor Baker: <code>dr_baker</code> / <code>password123</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Render Portal if logged in
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <span className="logo-icon">🏥</span>
          <h1>ClinicCare Portal</h1>
        </div>
        <div className="header-controls">
          <div className="user-profile-badge">
            <span className="user-dot"></span>
            <strong>{user.username}</strong> ({user.role === 'receptionist' ? 'Receptionist' : `${user.doctor_name} / Doctor`})
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
            <button onClick={fetchAppointments} className="retry-btn">Retry Connection</button>
          </div>
        )}

        {user.role === 'receptionist' ? (
          <div className="receptionist-grid">
            <section className="booking-section">
              <h2>Book New Appointment</h2>
              <form onSubmit={handleSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="patient_name">Patient Name</label>
                  <input
                    type="text"
                    id="patient_name"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact_number">Contact Number</label>
                  <input
                    type="text"
                    id="contact_number"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. 555-1234 (7-15 chars)"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="doctor_name">Assign Doctor</label>
                    <select
                      id="doctor_name"
                      name="doctor_name"
                      value={formData.doctor_name}
                      onChange={handleInputChange}
                    >
                      <option value="Dr. Adams">Dr. Adams</option>
                      <option value="Dr. Baker">Dr. Baker</option>
                      <option value="Dr. Carter">Dr. Carter</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="appointment_date">Date</label>
                    <input
                      type="date"
                      id="appointment_date"
                      name="appointment_date"
                      min={todayStr}
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="appointment_time">Time</label>
                  <input
                    type="time"
                    id="appointment_time"
                    name="appointment_time"
                    value={formData.appointment_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason for Visit</label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                    placeholder="Describe symptoms or purpose"
                    rows="3"
                  />
                </div>

                <button type="submit" className="submit-btn">
                  📅 Request Appointment
                </button>
              </form>
            </section>

            <section className="list-section">
              <div className="list-header">
                <h2>All Appointments</h2>
                <div className="filters-row">
                  <div className="filter-item">
                    <label>Doctor:</label>
                    <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)}>
                      <option value="all">All Doctors</option>
                      <option value="Dr. Adams">Dr. Adams</option>
                      <option value="Dr. Baker">Dr. Baker</option>
                      <option value="Dr. Carter">Dr. Carter</option>
                    </select>
                  </div>
                  <div className="filter-item">
                    <label>Status:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="filter-item">
                    <label>Date:</label>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="loading-spinner">Loading appointments...</div>
              ) : (
                <div className="table-wrapper">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Patient / Contact</th>
                        <th>Doctor</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-state">No matching appointments found.</td>
                        </tr>
                      ) : (
                        filteredList.map((apt) => (
                          <tr key={apt.id}>
                            <td>
                              <div className="patient-name">{apt.patient_name}</div>
                              <div className="contact-sub">{apt.contact_number}</div>
                              <div className="visit-reason"><strong>Reason:</strong> {apt.reason}</div>
                              {apt.visit_note && (
                                <div className="note-preview-readonly">
                                  <span>Note:</span> {apt.visit_note}
                                </div>
                              )}
                            </td>
                            <td>{apt.doctor_name}</td>
                            <td>
                              <div className="date-badge">
                                {new Date(apt.appointment_date).toLocaleDateString()}
                              </div>
                              <div className="time-badge">{apt.appointment_time}</div>
                            </td>
                            <td>
                              <span className={`status-pill ${apt.status.toLowerCase()}`}>
                                {apt.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {apt.status === 'Pending' || apt.status === 'Rejected' ? (
                                  <>
                                    <button 
                                      className="action-btn edit-btn"
                                      onClick={() => setEditingAppointment({
                                        ...apt,
                                        appointment_date: new Date(apt.appointment_date).toISOString().split('T')[0]
                                      })}
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button 
                                      className="action-btn cancel-btn"
                                      onClick={() => handleCancel(apt)}
                                    >
                                      ❌ Cancel
                                    </button>
                                  </>
                                ) : (
                                  <span className="no-actions-label">Locked</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="doctor-dashboard">
            <section className="list-section full-width">
              <div className="list-header">
                <div>
                  <h2>Consultation Schedule for {user.doctor_name}</h2>
                  <p className="section-subtitle">Clinical dashboard. Review requests, accept/reject, or record clinical notes.</p>
                </div>
                <div className="filters-row">
                  <div className="filter-item">
                    <label>Status:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="filter-item">
                    <label>Date:</label>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="loading-spinner">Loading appointments...</div>
              ) : (
                <div className="table-wrapper">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Reason</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Visit Clinical Note</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-state">No appointments scheduled.</td>
                        </tr>
                      ) : (
                        filteredList.map((apt) => (
                          <tr key={apt.id}>
                            <td>
                              <div className="patient-name">{apt.patient_name}</div>
                              <div className="contact-sub">{apt.contact_number}</div>
                            </td>
                            <td>{apt.reason}</td>
                            <td>
                              <div className="date-badge">
                                {new Date(apt.appointment_date).toLocaleDateString()}
                              </div>
                              <div className="time-badge">{apt.appointment_time}</div>
                            </td>
                            <td>
                              <span className={`status-pill ${apt.status.toLowerCase()}`}>
                                {apt.status}
                              </span>
                            </td>
                            <td>
                              {apt.visit_note ? (
                                <div className="note-preview">📝 {apt.visit_note}</div>
                              ) : (
                                <span className="no-note">No consultation note recorded</span>
                              )}
                            </td>
                            <td>
                              <div className="action-buttons">
                                {apt.status === 'Pending' && (
                                  <>
                                    <button 
                                      className="action-btn accept-btn"
                                      onClick={() => handleUpdateStatus(apt.id, 'Confirmed')}
                                    >
                                      ✅ Accept
                                    </button>
                                    <button 
                                      className="action-btn reject-btn"
                                      onClick={() => handleUpdateStatus(apt.id, 'Rejected')}
                                    >
                                      ❌ Reject
                                    </button>
                                  </>
                                )}
                                {apt.status === 'Confirmed' && (
                                  <button 
                                    className="action-btn note-btn"
                                    onClick={() => startWritingNotes(apt)}
                                  >
                                    📝 Add Note
                                  </button>
                                )}
                                {apt.status === 'Completed' && (
                                  <button 
                                    className="action-btn note-btn"
                                    onClick={() => startWritingNotes(apt)}
                                  >
                                    ✏️ Edit Note
                                  </button>
                                )}
                                {apt.status === 'Cancelled' && (
                                  <span className="no-note">Cancelled</span>
                                )}
                                {apt.status === 'Rejected' && (
                                  <span className="no-note">Rejected</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Modal: Editing Appointment (Receptionist Only) */}
        {editingAppointment && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Edit Booking Details</h3>
              <form onSubmit={handleUpdate} className="modal-form">
                <div className="form-group">
                  <label>Patient Name</label>
                  <input
                    type="text"
                    name="patient_name"
                    value={editingAppointment.patient_name}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    name="contact_number"
                    value={editingAppointment.contact_number}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Doctor</label>
                    <select
                      name="doctor_name"
                      value={editingAppointment.doctor_name}
                      onChange={handleEditInputChange}
                    >
                      <option value="Dr. Adams">Dr. Adams</option>
                      <option value="Dr. Baker">Dr. Baker</option>
                      <option value="Dr. Carter">Dr. Carter</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={editingAppointment.status}
                      onChange={handleEditInputChange}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="appointment_date"
                      min={todayStr}
                      value={editingAppointment.appointment_date}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      name="appointment_time"
                      value={editingAppointment.appointment_time}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Reason for Visit</label>
                  <textarea
                    name="reason"
                    value={editingAppointment.reason}
                    onChange={handleEditInputChange}
                    required
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="action-btn cancel-btn" onClick={() => setEditingAppointment(null)}>
                    Discard
                  </button>
                  <button type="submit" className="action-btn submit-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Adding Doctor Notes (Doctor Only) */}
        {notingAppointment && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Consultation Notes - {notingAppointment.patient_name}</h3>
              <p className="note-meta-subtitle">
                Appointment date: {new Date(notingAppointment.appointment_date).toLocaleDateString()} at {notingAppointment.appointment_time}
              </p>
              <form onSubmit={handleSaveNotes} className="modal-form">
                <div className="form-group">
                  <label htmlFor="visit_note_textarea">Visit Medical Note</label>
                  <textarea
                    id="visit_note_textarea"
                    value={visitNoteText}
                    onChange={(e) => setVisitNoteText(e.target.value)}
                    required
                    placeholder="Enter short visit summary details, prescriptions or advice..."
                    rows="5"
                  />
                </div>
                <p className="note-disclaimer">
                  * Saving this note will automatically update the appointment status to <strong>Completed</strong>.
                </p>
                <div className="modal-actions">
                  <button type="button" className="action-btn cancel-btn" onClick={() => setNotingAppointment(null)}>
                    Discard
                  </button>
                  <button type="submit" className="action-btn submit-btn">
                    💾 Save & Complete
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Clinic Appointment System Prototype &copy; 2026</p>
      </footer>
    </div>
  );
}

export default App;
