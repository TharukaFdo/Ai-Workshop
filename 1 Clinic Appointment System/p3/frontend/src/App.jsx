import React, { useState, useEffect } from 'react';

// API Base configuration
const API_BASE_URL = 'http://localhost:5000/api';

const CLINIC_DOCTORS = ['Dr. Smith', 'Dr. Jones'];

function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ username: 'receptionist1', password: 'password123' });
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Appointment List & Filter State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters state
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form states (Create / Edit)
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorName: CLINIC_DOCTORS[0],
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });

  const [editingAppointment, setEditingAppointment] = useState(null);

  // Doctor Note state
  const [activeDoctorNote, setActiveDoctorNote] = useState(null);
  const [visitNoteText, setVisitNoteText] = useState('');
  const [visitStatus, setVisitStatus] = useState('completed');

  // Notification Toast State
  const [toast, setToast] = useState(null);

  // Show status toasts
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch appointments from API
  const fetchAppointments = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      // Enforce filter behavior
      if (currentUser.role === 'Receptionist' && filterDoctor) {
        params.append('doctorName', filterDoctor);
      }
      if (filterDate) params.append('appointmentDate', filterDate);
      if (filterStatus) params.append('status', filterStatus);

      const res = await fetch(`${API_BASE_URL}/appointments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Failed to load data: ${res.statusText}`);
      }

      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server connection error. Please make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Reload appointments when filter parameters or active user changes
  useEffect(() => {
    fetchAppointments();
  }, [currentUser, filterDoctor, filterDate, filterStatus]);

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      setCurrentUser(data);
      showToast(`Welcome back, ${data.username}!`);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setAppointments([]);
    showToast('Logged out successfully.');
  };

  // Handle appointment creation (Receptionist only)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error creating appointment.');
      }

      showToast('Appointment booked successfully!');
      // Reset form
      setFormData({
        patientName: '',
        patientPhone: '',
        doctorName: CLINIC_DOCTORS[0],
        appointmentDate: '',
        appointmentTime: '',
        reason: ''
      });
      fetchAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle edit form submit (Receptionist only)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${editingAppointment.id}/booking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(editingAppointment)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error updating appointment booking.');
      }

      showToast('Booking details updated successfully!');
      setEditingAppointment(null);
      fetchAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle cancellation (Receptionist only)
  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error cancelling appointment.');
      }

      showToast('Appointment cancelled successfully.');
      fetchAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Doctor Accept
  const handleAcceptAppointment = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error accepting appointment.');
      }

      showToast('Appointment accepted.');
      fetchAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Doctor Reject
  const handleRejectAppointment = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error rejecting appointment.');
      }

      showToast('Appointment rejected.');
      fetchAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle visit note saving (Doctor only)
  const handleSaveNotesSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${activeDoctorNote.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          visitNote: visitNoteText,
          status: visitStatus
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error updating notes.');
      }

      showToast('Visit notes and status updated!');
      setActiveDoctorNote(null);
      fetchAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Start Note Edit flow
  const openNoteEditor = (appointment) => {
    setActiveDoctorNote(appointment);
    setVisitNoteText(appointment.visitNote || '');
    setVisitStatus(appointment.status === 'accepted' ? 'completed' : appointment.status);
  };

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
          <h1 style={{ fontSize: '24px', textAlign: 'center', marginBottom: '8px' }}>Clinic Login</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Prototype Authorization Gateway
          </p>

          {authError && (
            <div style={{ background: 'var(--danger-bg)', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text"
                required
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              />
            </div>

            <button type="submit" disabled={authLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              {authLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong>Demo Accounts (password: password123):</strong>
            <ul style={{ marginLeft: '16px', marginTop: '6px' }}>
              <li><code>receptionist1</code> (Receptionist)</li>
              <li><code>dr_smith</code> (Doctor - Dr. Smith)</li>
              <li><code>dr_jones</code> (Doctor - Dr. Jones)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Alert Banner */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header Area */}
      <header>
        <div>
          <h1>Clinic Scheduler</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Active Session: <strong>{currentUser.username}</strong> ({currentUser.role})
          </p>
        </div>
        
        <button className="btn btn-secondary" onClick={handleLogout}>
          Sign Out
        </button>
      </header>

      {/* Primary Dashboard Grid Layout */}
      <div className={`dashboard-grid ${currentUser.role === 'Receptionist' ? 'with-sidebar' : ''}`}>
        
        {/* Receptionist View Sidebar Booking Form */}
        {currentUser.role === 'Receptionist' && (
          <aside className="glass-card">
            <h2 style={{ marginBottom: '20px' }}>Book Appointment</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Patient Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Full Name"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input 
                  type="text" 
                  placeholder="555-0100"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({...formData, patientPhone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Assigned Doctor *</label>
                <select 
                  value={formData.doctorName}
                  onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
                >
                  {CLINIC_DOCTORS.map(doc => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input 
                    type="time" 
                    required
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Visit *</label>
                <textarea 
                  required
                  rows="3"
                  placeholder="Describe main complaints..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                Create Appointment
              </button>
            </form>
          </aside>
        )}

        {/* Dashboard Main Workspace Area */}
        <main className="glass-card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>
              {currentUser.role === 'Doctor' ? `Schedule for ${currentUser.doctorName}` : 'All Clinic Bookings'}
            </h2>
            <button className="btn btn-secondary" onClick={fetchAppointments}>
              ↻ Refresh
            </button>
          </div>

          {/* Filtering controls */}
          <div className="filter-bar">
            {/* Filter by Doctor is hidden for Doctors, who only see their own */}
            {currentUser.role === 'Receptionist' && (
              <select 
                value={filterDoctor} 
                onChange={(e) => setFilterDoctor(e.target.value)}
              >
                <option value="">All Doctors</option>
                {CLINIC_DOCTORS.map(doc => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
            )}

            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Filter by Date"
            />

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted (Confirmed)</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Table Container / States */}
          {loading ? (
            <div className="state-container">
              <div className="state-icon">⌛</div>
              <p>Loading appointments from secure database...</p>
            </div>
          ) : error ? (
            <div className="state-container" style={{ color: '#fca5a5' }}>
              <div className="state-icon">⚠️</div>
              <p>{error}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="state-container">
              <div className="state-icon">📅</div>
              <p>No appointments match the active filters.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Patient Details</th>
                    {currentUser.role === 'Receptionist' && <th>Doctor</th>}
                    <th>Date & Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {currentUser.role === 'Doctor' && <th>Visit Notes</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{appointment.patientName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {appointment.patientPhone || 'No Phone'}
                        </div>
                      </td>
                      {currentUser.role === 'Receptionist' && <td>{appointment.doctorName}</td>}
                      <td>
                        <div>{new Date(appointment.appointmentDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {appointment.appointmentTime.substring(0, 5)}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', maxWidth: '200px', wordBreak: 'break-word' }}>
                        {appointment.reason}
                      </td>
                      <td>
                        <span className={`badge badge-${appointment.status}`}>
                          {appointment.status}
                        </span>
                      </td>
                      {currentUser.role === 'Doctor' && (
                        <td style={{ fontSize: '13px', fontStyle: 'italic', maxWidth: '200px', wordBreak: 'break-word' }}>
                          {appointment.visitNote || '—'}
                        </td>
                      )}
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {/* Receptionist actions: Edit and Cancel are only allowed on pending or accepted bookings */}
                          {currentUser.role === 'Receptionist' && ['pending', 'accepted'].includes(appointment.status) && (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => setEditingAppointment(appointment)}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleCancelAppointment(appointment.id)}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          
                          {/* Doctor actions: Accept/Reject if pending. Notes if accepted. */}
                          {currentUser.role === 'Doctor' && appointment.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-success"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleAcceptAppointment(appointment.id)}
                              >
                                Accept
                              </button>
                              <button 
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleRejectAppointment(appointment.id)}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {currentUser.role === 'Doctor' && appointment.status === 'accepted' && (
                            <button 
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => openNoteEditor(appointment)}
                            >
                              Add/Edit Notes
                            </button>
                          )}

                          {appointment.status === 'cancelled' && (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cancelled</span>
                          )}
                          {appointment.status === 'rejected' && (
                            <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Rejected</span>
                          )}
                          {appointment.status === 'completed' && (
                            <span style={{ fontSize: '12px', color: 'var(--success)' }}>Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Edit Appointment Booking (Receptionist only) */}
      {editingAppointment && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h2 style={{ marginBottom: '20px' }}>Edit Booking Details</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Patient Name *</label>
                <input 
                  type="text" 
                  required
                  value={editingAppointment.patientName}
                  onChange={(e) => setEditingAppointment({...editingAppointment, patientName: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input 
                  type="text" 
                  value={editingAppointment.patientPhone || ''}
                  onChange={(e) => setEditingAppointment({...editingAppointment, patientPhone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Doctor *</label>
                <select 
                  value={editingAppointment.doctorName}
                  onChange={(e) => setEditingAppointment({...editingAppointment, doctorName: e.target.value})}
                >
                  {CLINIC_DOCTORS.map(doc => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input 
                    type="date" 
                    required
                    // Normalize standard MySQL date format to YYYY-MM-DD for picker
                    value={editingAppointment.appointmentDate.substring(0, 10)}
                    onChange={(e) => setEditingAppointment({...editingAppointment, appointmentDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input 
                    type="time" 
                    required
                    value={editingAppointment.appointmentTime}
                    onChange={(e) => setEditingAppointment({...editingAppointment, appointmentTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Visit *</label>
                <textarea 
                  required
                  rows="3"
                  value={editingAppointment.reason}
                  onChange={(e) => setEditingAppointment({...editingAppointment, reason: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingAppointment(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Doctor Note Editor & Complete (Doctor only) */}
      {activeDoctorNote && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h2 style={{ marginBottom: '10px' }}>Add Clinical Visit Note</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Patient: <strong style={{ color: 'var(--text-primary)' }}>{activeDoctorNote.patientName}</strong>
            </p>
            <form onSubmit={handleSaveNotesSubmit}>
              <div className="form-group">
                <label>Visit Notes</label>
                <textarea 
                  rows="6"
                  required
                  placeholder="Record summary details of diagnosis, prescriptions, or advice..."
                  value={visitNoteText}
                  onChange={(e) => setVisitNoteText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Consultation Status</label>
                <select 
                  value={visitStatus}
                  onChange={(e) => setVisitStatus(e.target.value)}
                >
                  <option value="booked">Keep status: Booked</option>
                  <option value="completed">Complete & close appointment</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveDoctorNote(null)}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
