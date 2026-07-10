import React, { useState, useEffect } from 'react';

function App() {
  // Authentication states
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Login form inputs
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Applications and filter states
  const [applications, setApplications] = useState([]);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Student Form & Edit State
  const [formData, setFormData] = useState({
    studentName: currentUser?.username || '',
    companyName: '',
    positionTitle: '',
    startDate: '',
    endDate: '',
    submittedDate: new Date().toISOString().split('T')[0]
  });
  const [editingAppId, setEditingAppId] = useState(null);

  // Coordinator Review Form State
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('submitted');
  const [reviewComment, setReviewComment] = useState('');

  // UX Feedback Banner States
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync studentName when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, studentName: currentUser.username }));
    }
  }, [currentUser]);

  // Load applications from API
  const loadApplications = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      let url = '/api/applications';
      const queryParams = [];
      if (currentUser?.role === 'student') {
        queryParams.push(`studentId=${currentUser.id}`);
      }
      
      if (filterCompany) {
        queryParams.push(`companyName=${encodeURIComponent(filterCompany)}`);
      }
      if (filterStatus !== 'all') {
        queryParams.push(`status=${encodeURIComponent(filterStatus)}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch applications.');
      }

      const data = await res.json();
      setApplications(data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadApplications();
    }
  }, [authToken, currentUser, filterCompany, filterStatus]);

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setAlert({ type: 'error', message: 'Please enter both username and password.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setAlert({ type: 'success', message: `Welcome back, ${data.user.username}!` });
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken('');
    setCurrentUser(null);
    setApplications([]);
    setAlert(null);
    setEditingAppId(null);
    setSelectedApp(null);
  };

  // Handle student application submit
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // Client-side validation checks
    if (!formData.companyName.trim() || !formData.positionTitle.trim() || !formData.startDate || !formData.endDate || !formData.submittedDate) {
      setAlert({ type: 'error', message: 'All application fields are required.' });
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setAlert({ type: 'error', message: 'End date must be strictly after the start date.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        studentName: formData.studentName || currentUser.username,
        companyName: formData.companyName,
        positionTitle: formData.positionTitle,
        startDate: formData.startDate,
        endDate: formData.endDate,
        submittedDate: formData.submittedDate
      };

      if (editingAppId) {
        // Edit flow
        const res = await fetch(`/api/applications/${editingAppId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
          await loadApplications();
          setAlert({ type: 'success', message: 'Application updated successfully!' });
          setEditingAppId(null);
          setFormData(prev => ({
            ...prev,
            companyName: '',
            positionTitle: '',
            startDate: '',
            endDate: ''
          }));
        } else {
          setAlert({ type: 'error', message: data.error || 'Failed to update application.' });
        }
      } else {
        // Create flow
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
          await loadApplications();
          setAlert({ type: 'success', message: 'Application submitted successfully!' });
          setFormData(prev => ({
            ...prev,
            companyName: '',
            positionTitle: '',
            startDate: '',
            endDate: ''
          }));
        } else {
          setAlert({ type: 'error', message: data.error || 'Failed to submit application.' });
        }
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Server request failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Trigger editing state for student
  const handleStartEdit = (app) => {
    if (app.status !== 'changesRequested') {
      setAlert({ type: 'error', message: 'You can only edit applications in the "changesRequested" stage.' });
      return;
    }
    setEditingAppId(app.id);
    setFormData({
      studentName: app.student_name,
      companyName: app.company_name,
      positionTitle: app.position_title,
      startDate: app.start_date.split('T')[0],
      endDate: app.end_date.split('T')[0],
      submittedDate: app.submitted_date.split('T')[0]
    });
  };

  // Cancel student edit
  const handleCancelEdit = () => {
    setEditingAppId(null);
    setFormData(prev => ({
      ...prev,
      companyName: '',
      positionTitle: '',
      startDate: '',
      endDate: ''
    }));
  };

  // Open Coordinator review drawer
  const handleSelectAppForReview = (app) => {
    setSelectedApp(app);
    setReviewStatus(app.status);
    setReviewComment(app.coordinator_comment || '');
  };

  // Handle coordinator submit comments & status
  const handleCoordinatorSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setLoading(true);
    try {
      const payload = {
        status: reviewStatus,
        comment: reviewComment
      };

      const res = await fetch(`/api/applications/${selectedApp.id}/decision`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        await loadApplications();
        setAlert({ type: 'success', message: 'Status and comments updated successfully!' });
        setSelectedApp(null);
      } else {
        setAlert({ type: 'error', message: data.error || 'Failed to update review status.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Server request failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Render Login Panel if unauthenticated
  if (!currentUser) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
          <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-blue)' }}>
              Internship Application
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Sign in to manage & review applications
            </p>
          </header>

          {alert && (
            <div className={`alert alert-${alert.type}`} style={{ marginBottom: '1rem' }}>
              {alert.message}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-username">Username</label>
              <input
                type="text"
                id="login-username"
                placeholder="e.g. student1, coordinator1"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Seeded Prototype Users:</strong>
            <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
              <li>Student: <code>student1</code> / <code>student123</code></li>
              <li>Student: <code>student2</code> / <code>student123</code></li>
              <li>Coordinator: <code>coordinator1</code> / <code>coordinator123</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-section">
          <h1>Internship Application Tracker</h1>
          <p>Logged in as: <strong>{currentUser.username}</strong> ({currentUser.role})</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 1rem', width: 'auto' }}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        {currentUser.role === 'student' ? (
          /* ==================== STUDENT INTERFACE ==================== */
          <div className="dashboard-grid">
            <section className="card">
              <h2 className="card-title">
                {editingAppId ? 'Edit Application' : 'Submit Application'}
              </h2>
              <form onSubmit={handleStudentSubmit}>
                <div className="form-group">
                  <label htmlFor="studentName">Student Name *</label>
                  <input
                    type="text"
                    id="studentName"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyName">Company Name *</label>
                  <input
                    type="text"
                    id="companyName"
                    placeholder="e.g. Google"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="positionTitle">Position Title *</label>
                  <input
                    type="text"
                    id="positionTitle"
                    placeholder="e.g. Software Engineering Intern"
                    value={formData.positionTitle}
                    onChange={(e) => setFormData({ ...formData, positionTitle: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date *</label>
                    <input
                      type="date"
                      id="startDate"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date *</label>
                    <input
                      type="date"
                      id="endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="submittedDate">Submitted Date *</label>
                  <input
                    type="date"
                    id="submittedDate"
                    value={formData.submittedDate}
                    onChange={(e) => setFormData({ ...formData, submittedDate: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginBottom: editingAppId ? '0.5rem' : '0' }}>
                  {editingAppId ? 'Save Changes' : 'Submit Application'}
                </button>

                {editingAppId && (
                  <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                    Cancel Edit
                  </button>
                )}
              </form>
            </section>

            <section className="card">
              <h2 className="card-title">My Applications</h2>

              <div className="filter-bar">
                <div className="filter-group">
                  <label htmlFor="student-filter-company">Company:</label>
                  <input
                    type="text"
                    id="student-filter-company"
                    placeholder="Search company..."
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="student-filter-status">Status:</label>
                  <select
                    id="student-filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="underReview">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="changesRequested">Changes Requested</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p>Loading applications...</p>
              ) : applications.length === 0 ? (
                <div className="empty-state">No internship applications found.</div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Position</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <strong>{app.company_name}</strong>
                          </td>
                          <td>{app.position_title}</td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {app.start_date.split('T')[0]} to {app.end_date.split('T')[0]}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${app.status}`}>{app.status}</span>
                            {app.coordinator_comment && (
                              <div className="comment-box" title="Coordinator Comment">
                                <strong>Feedback:</strong> {app.coordinator_comment}
                              </div>
                            )}
                          </td>
                          <td>
                            {app.status === 'changesRequested' ? (
                              <button className="btn btn-secondary" onClick={() => handleStartEdit(app)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                                Edit
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Locked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* ==================== COORDINATOR INTERFACE ==================== */
          <div className="dashboard-grid coordinator-grid">
            <section className="card">
              <h2 className="card-title">Review Dashboard</h2>

              <div className="filter-bar">
                <div className="filter-group">
                  <label htmlFor="coord-filter-company">Company:</label>
                  <input
                    type="text"
                    id="coord-filter-company"
                    placeholder="Filter by company..."
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="coord-filter-status">Status:</label>
                  <select
                    id="coord-filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="underReview">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="changesRequested">Changes Requested</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p>Loading applications...</p>
              ) : applications.length === 0 ? (
                <div className="empty-state">No matching student submissions.</div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Company</th>
                        <th>Position</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id}>
                          <td>{app.student_name}</td>
                          <td>
                            <strong>{app.company_name}</strong>
                          </td>
                          <td>{app.position_title}</td>
                          <td>{app.submitted_date.split('T')[0]}</td>
                          <td>
                            <span className={`badge badge-${app.status}`}>{app.status}</span>
                            {app.coordinator_comment && (
                              <div className="comment-box">
                                <strong>Feedback:</strong> {app.coordinator_comment}
                              </div>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-primary" onClick={() => handleSelectAppForReview(app)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Coordinator Review Actions Panel */}
              {selectedApp && (
                <div className="action-panel">
                  <h3 style={{ marginTop: 0, color: 'var(--accent-blue)' }}>
                    Reviewing: {selectedApp.student_name} - {selectedApp.company_name}
                  </h3>
                  <form onSubmit={handleCoordinatorSubmitReview}>
                    <div className="form-group">
                      <label htmlFor="review-status">Set Status *</label>
                      <select
                        id="review-status"
                        value={reviewStatus}
                        onChange={(e) => setReviewStatus(e.target.value)}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="underReview">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="changesRequested">Changes Requested</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="review-comment">Feedback Comments</label>
                      <textarea
                        id="review-comment"
                        rows="4"
                        placeholder="Add review notes or feedback..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <button type="submit" className="btn btn-primary">
                        Save Review
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedApp(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Internship Application Tracker &copy; {new Date().getFullYear()} Prototype</p>
      </footer>
    </div>
  );
}

export default App;
