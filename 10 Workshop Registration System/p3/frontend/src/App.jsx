import { useState, useEffect } from 'react';
import './App.css';

const WORKSHOPS = [
  'Advanced React Patterns & compiler',
  'Node.js Scale, Performance & Clustering',
  'Mastering CSS Grid & Flexbox layouts',
  'Database Systems & MySQL Query Optimization'
];

function App() {
  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || '';
  });
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'status' for participant
  
  // Notification / Message state
  const [notification, setNotification] = useState(null);

  // Participant form state
  const [formData, setFormData] = useState({
    participantName: '',
    email: '',
    workshopTitle: WORKSHOPS[0],
    registrationDetails: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Participant look-up state
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [searching, setSearching] = useState(false);
  const [editingReg, setEditingReg] = useState(null); // Registration currently being edited
  const [editDetailsText, setEditDetailsText] = useState('');

  // Organizer state
  const [organizerRegs, setOrganizerRegs] = useState([]);
  const [loadingOrg, setLoadingOrg] = useState(false);
  
  // Filters
  const [filterWorkshop, setFilterWorkshop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAttendance, setFilterAttendance] = useState('');
  const [participantFilterStatus, setParticipantFilterStatus] = useState('');

  // Helper to trigger message notifications
  const triggerNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      triggerNotification('Please enter both email and password.', 'error');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      // Pre-fill participant email if role is participant
      if (data.user.role === 'participant') {
        setFormData(prev => ({ ...prev, email: data.user.email }));
        fetchMyRegistrations(data.user.email, data.token);
      }

      triggerNotification('Logged in successfully!');
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setMyRegistrations([]);
    setOrganizerRegs([]);
    setEmailInput('');
    setPasswordInput('');
    triggerNotification('Logged out successfully.');
  };

  // 1. Participant Action: Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.participantName || !formData.email || !formData.workshopTitle || !formData.registrationDetails) {
      triggerNotification('Please fill in all fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration.');
      }
      triggerNotification('Registration submitted successfully! Current status: Pending.');
      setFormData({
        participantName: '',
        email: user.email, // lock back to logged in user email
        workshopTitle: WORKSHOPS[0],
        registrationDetails: ''
      });
      setActiveTab('status');
      fetchMyRegistrations(user.email, token);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Participant Action: View own registrations
  const fetchMyRegistrations = async (emailToSearch, activeToken = token) => {
    if (!emailToSearch || !activeToken) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/registrations/my?email=${encodeURIComponent(emailToSearch)}`, {
        headers: {
          'x-auth-token': activeToken
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search registrations.');
      }
      setMyRegistrations(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setSearching(false);
    }
  };

  // 3. Participant Action: Edit details
  const handleStartEdit = (reg) => {
    setEditingReg(reg.id);
    setEditDetailsText(reg.registrationDetails);
  };

  const handleSaveEdit = async (reg) => {
    try {
      const res = await fetch(`/api/registrations/${reg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          email: reg.email,
          registrationDetails: editDetailsText
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update details.');
      }
      triggerNotification('Registration details updated successfully!');
      setEditingReg(null);
      fetchMyRegistrations(user.email);
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  // 4. Organizer Action: Fetch all registrations (with filters)
  const fetchOrganizerRegistrations = async () => {
    if (!token) return;
    setLoadingOrg(true);
    try {
      const params = new URLSearchParams();
      if (filterWorkshop) params.append('workshopTitle', filterWorkshop);
      if (filterStatus) params.append('status', filterStatus);
      if (filterAttendance) params.append('attendanceStatus', filterAttendance);

      const res = await fetch(`/api/registrations?${params.toString()}`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch registrations.');
      }
      setOrganizerRegs(data);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoadingOrg(false);
    }
  };

  // 5. Organizer Action: Update status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/registrations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }
      triggerNotification(`Status updated to ${newStatus}.`);
      fetchOrganizerRegistrations();
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  // 6. Organizer Action: Mark attendance
  const handleUpdateAttendance = async (id, newAttendance) => {
    try {
      const res = await fetch(`/api/registrations/${id}/attendance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ attendanceStatus: newAttendance })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update attendance.');
      }
      triggerNotification(`Attendance marked as ${newAttendance}.`);
      fetchOrganizerRegistrations();
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  // 7. Organizer Action: Update organizer note
  const handleUpdateNote = async (id, noteText) => {
    try {
      const res = await fetch(`/api/registrations/${id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ organizerNote: noteText })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update note.');
      }
      triggerNotification('Organizer note updated.');
      fetchOrganizerRegistrations();
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  // Sync dashboard data on component mount if user was already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'participant') {
        setFormData(prev => ({ ...prev, email: user.email }));
        fetchMyRegistrations(user.email, token);
      } else if (user.role === 'organizer') {
        fetchOrganizerRegistrations();
      }
    }
  }, [user, filterWorkshop, filterStatus, filterAttendance]);

  // Statistics for Organizer dashboard
  const stats = {
    total: organizerRegs.length,
    pending: organizerRegs.filter(r => r.status === 'pending').length,
    waitlisted: organizerRegs.filter(r => r.status === 'waitlisted').length,
    confirmed: organizerRegs.filter(r => r.status === 'confirmed').length,
    present: organizerRegs.filter(r => r.attendanceStatus === 'present').length
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="login-container animate-fade">
        {notification && (
          <div className={`notification toast-${notification.type}`}>
            {notification.text}
          </div>
        )}
        <div className="login-card">
          <h2>Workshop Manager</h2>
          <p className="login-subtitle">Sign in to access your dashboard</p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email"
                placeholder="name@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="seeded-users-info">
            <h4>Seeded Test Accounts:</h4>
            <ul>
              <li><strong>Organizer:</strong> organizer@workshop.com / admin123</li>
              <li><strong>Participant:</strong> participant@workshop.com / user123</li>
              <li><strong>Participant:</strong> john@example.com / john123</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification toast-${notification.type}`}>
          {notification.text}
        </div>
      )}

      {/* Header Panel */}
      <header className="dashboard-header">
        <div className="logo-section">
          <h2>Workshop Manager</h2>
          <span className="badge badge-tech">{user.role.toUpperCase()} SESSION</span>
        </div>
        
        {/* User Identity & Logout Button */}
        <div className="user-nav-actions">
          <span className="user-email-tag">{user.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="dashboard-body">
        
        {/* PARTICIPANT VIEWS */}
        {user.role === 'participant' && (
          <div className="panel animate-fade">
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Register for Workshop
              </button>
              <button 
                className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('status');
                  fetchMyRegistrations(user.email);
                }}
              >
                Track My Registrations
              </button>
            </div>

            {/* TAB: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="interactive-form">
                <h3>Submit Registration Form</h3>
                
                <div className="form-group">
                  <label htmlFor="participantName">Full Name</label>
                  <input
                    type="text"
                    id="participantName"
                    value={formData.participantName}
                    onChange={(e) => setFormData({ ...formData, participantName: e.target.value })}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="workshopTitle">Select Workshop</label>
                  <select
                    id="workshopTitle"
                    value={formData.workshopTitle}
                    onChange={(e) => setFormData({ ...formData, workshopTitle: e.target.value })}
                  >
                    {WORKSHOPS.map((title) => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="registrationDetails">Registration & Requirements Details</label>
                  <textarea
                    id="registrationDetails"
                    rows="4"
                    value={formData.registrationDetails}
                    onChange={(e) => setFormData({ ...formData, registrationDetails: e.target.value })}
                    placeholder="E.g., What do you hope to learn? Dietary needs, physical accommodations?"
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting Form...' : 'Complete Registration'}
                </button>
              </form>
            )}

            {/* TAB: TRACK STATUS */}
            {activeTab === 'status' && (
              <div className="status-tracker">
                <div className="status-header">
                  <h3>Your Registrations</h3>
                  <button onClick={() => fetchMyRegistrations(user.email)} className="btn-refresh">Refresh</button>
                </div>

                <div className="participant-filter-section" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label htmlFor="partFilter" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Filter by Status:</label>
                  <select 
                    id="partFilter" 
                    value={participantFilterStatus} 
                    onChange={(e) => setParticipantFilterStatus(e.target.value)}
                    style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--panel-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-main)' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="waitlisted">Waitlisted</option>
                  </select>
                </div>

                {searching ? (
                  <p className="loading-text">Fetching registrations...</p>
                ) : myRegistrations.length === 0 ? (
                  <div className="empty-state">
                    <p>You have not registered for any workshops yet.</p>
                  </div>
                ) : myRegistrations.filter(r => !participantFilterStatus || r.status === participantFilterStatus).length === 0 ? (
                  <div className="empty-state">
                    <p>No registrations match the status filter "{participantFilterStatus}".</p>
                  </div>
                ) : (
                  <div className="registration-list">
                    {myRegistrations
                      .filter(reg => !participantFilterStatus || reg.status === participantFilterStatus)
                      .map((reg) => (
                        <div key={reg.id} className="registration-card">
                          <div className="card-header">
                            <h4>{reg.workshopTitle}</h4>
                            <span className={`status-badge status-${reg.status}`}>
                              {reg.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="card-details">
                            <p><strong>Attendee Name:</strong> {reg.participantName}</p>
                            <p><strong>Attendance:</strong> {reg.attendanceStatus === 'notMarked' ? 'Not Marked' : reg.attendanceStatus}</p>
                            
                            {editingReg === reg.id ? (
                              <div className="edit-block">
                                <textarea
                                  value={editDetailsText}
                                  onChange={(e) => setEditDetailsText(e.target.value)}
                                  rows="3"
                                />
                                <div className="edit-actions">
                                  <button className="btn-save" onClick={() => handleSaveEdit(reg)}>Save</button>
                                  <button className="btn-cancel" onClick={() => setEditingReg(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p><strong>Details Provided:</strong> {reg.registrationDetails}</p>
                            )}

                            {reg.organizerNote && (
                              <div className="organizer-notes-display">
                                <strong>Organizer Notes:</strong>
                                <p>{reg.organizerNote}</p>
                              </div>
                            )}
                          </div>

                          {reg.status === 'pending' && editingReg !== reg.id && (
                            <button 
                              className="btn-text-action" 
                              onClick={() => handleStartEdit(reg)}
                            >
                              Edit Registration Details
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ORGANIZER VIEW */}
        {user.role === 'organizer' && (
          <div className="panel organizer-panel animate-fade">
            
            {/* Organizer Dashboard Counters */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="number">{stats.total}</div>
                <div className="label">Total Registrations</div>
              </div>
              <div className="stat-card">
                <div className="number yellow">{stats.pending}</div>
                <div className="label">Pending Confirmation</div>
              </div>
              <div className="stat-card">
                <div className="number purple" style={{ color: '#c084fc' }}>{stats.waitlisted}</div>
                <div className="label">Waitlisted</div>
              </div>
              <div className="stat-card">
                <div className="number green">{stats.confirmed}</div>
                <div className="label">Confirmed Spots</div>
              </div>
              <div className="stat-card">
                <div className="number blue">{stats.present}</div>
                <div className="label">Attended (Present)</div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="filter-controls">
              <h3>Filter Options</h3>
              <div className="filters-grid">
                <div className="filter-item">
                  <label>Workshop</label>
                  <select value={filterWorkshop} onChange={(e) => setFilterWorkshop(e.target.value)}>
                    <option value="">All Workshops</option>
                    {WORKSHOPS.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Status</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="waitlisted">Waitlisted</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label>Attendance</label>
                  <select value={filterAttendance} onChange={(e) => setFilterAttendance(e.target.value)}>
                    <option value="">All Attendances</option>
                    <option value="notMarked">Not Marked</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Registrations list */}
            <div className="organizer-list-wrapper">
              <div className="list-header-row">
                <h3>Registered Participants</h3>
                <button onClick={fetchOrganizerRegistrations} className="btn-refresh">Refresh List</button>
              </div>

              {loadingOrg ? (
                <p className="loading-text">Loading master registrations...</p>
              ) : organizerRegs.length === 0 ? (
                <div className="empty-state">
                  <p>No registrations match selected filter criteria.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="registrations-table">
                    <thead>
                      <tr>
                        <th>Attendee & Email</th>
                        <th>Workshop Title</th>
                        <th>Registration Details</th>
                        <th>Status</th>
                        <th>Attendance</th>
                        <th>Organizer Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizerRegs.map((reg) => (
                        <tr key={reg.id}>
                          <td>
                            <div className="user-info">
                              <span className="user-name">{reg.participantName}</span>
                              <span className="user-email">{reg.email}</span>
                            </div>
                          </td>
                          <td className="workshop-cell">{reg.workshopTitle}</td>
                          <td className="details-cell">{reg.registrationDetails}</td>
                          <td>
                            <select 
                              value={reg.status} 
                              onChange={(e) => handleUpdateStatus(reg.id, e.target.value)}
                              className={`status-select select-${reg.status}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="waitlisted">Waitlisted</option>
                            </select>
                          </td>
                          <td>
                            <div className="attendance-buttons">
                              <button 
                                className={`btn-att ${reg.attendanceStatus === 'present' ? 'active-present' : ''}`}
                                onClick={() => handleUpdateAttendance(reg.id, 'present')}
                                title="Mark Present"
                              >
                                Present
                              </button>
                              <button 
                                className={`btn-att ${reg.attendanceStatus === 'absent' ? 'active-absent' : ''}`}
                                onClick={() => handleUpdateAttendance(reg.id, 'absent')}
                                title="Mark Absent"
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td>
                            <textarea
                              className="note-textarea"
                              defaultValue={reg.organizerNote || ''}
                              onBlur={(e) => handleUpdateNote(reg.id, e.target.value)}
                              placeholder="Click to add private note..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;
