import React, { useState, useEffect } from 'react'

function App() {
  // Current logged in user object: { id, username, role }
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters (for Coordinator)
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Student Form fields
  const [formData, setFormData] = useState({
    student_name: '',
    company_name: '',
    position_title: '',
    start_date: '',
    end_date: ''
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Student Edit Application Mode
  const [editAppId, setEditAppId] = useState(null);

  const handleStartEdit = (app) => {
    setEditAppId(app.id);
    setFormData({
      student_name: app.student_name,
      company_name: app.company_name,
      position_title: app.position_title,
      start_date: new Date(app.start_date).toISOString().split('T')[0],
      end_date: new Date(app.end_date).toISOString().split('T')[0]
    });
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  const handleCancelEdit = () => {
    setEditAppId(null);
    setFormData({
      student_name: '',
      company_name: '',
      position_title: '',
      start_date: '',
      end_date: ''
    });
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  // Coordinator Review state
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [reviewError, setReviewError] = useState(null);

  // Fetch applications based on role and active filters
  const fetchApplications = () => {
    if (!user) return;
    setLoading(true);
    let url = '/api/applications';
    
    const params = new URLSearchParams();
    if (filterStatus) params.append('status', filterStatus);
    if (filterCompany) params.append('company_name', filterCompany);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    fetch(url, {
      headers: {
        'x-user-id': user.id.toString()
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load applications.');
        return res.json();
      })
      .then(data => {
        setApplications(data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Re-fetch when filters change or user changes
  useEffect(() => {
    fetchApplications();
    setSelectedApp(null);
  }, [user, filterStatus, filterCompany]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUsername, password: loginPassword })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed.');
        return data;
      })
      .then(userData => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setLoginUsername('');
        setLoginPassword('');
      })
      .catch(err => setLoginError(err.message))
      .finally(() => setLoginLoading(false));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setApplications([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    // Client-side validations
    const studentNameTrimmed = formData.student_name.trim();
    const companyNameTrimmed = formData.company_name.trim();
    const positionTitleTrimmed = formData.position_title.trim();

    if (!studentNameTrimmed || !companyNameTrimmed || !positionTitleTrimmed) {
      setSubmitError('All text fields are required and cannot be empty whitespace.');
      setSubmitLoading(false);
      return;
    }

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (end < start) {
      setSubmitError('End Date cannot be earlier than Start Date.');
      setSubmitLoading(false);
      return;
    }

    const url = editAppId ? `/api/applications/${editAppId}/resubmit` : '/api/applications';
    const method = editAppId ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': user.id.toString()
      },
      body: JSON.stringify({
        ...formData,
        student_name: studentNameTrimmed,
        company_name: companyNameTrimmed,
        position_title: positionTitleTrimmed
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit application.');
        return data;
      })
      .then(() => {
        setSubmitSuccess(editAppId ? 'Application updated and resubmitted successfully!' : 'Application submitted successfully!');
        setEditAppId(null);
        setFormData({
          student_name: '',
          company_name: '',
          position_title: '',
          start_date: '',
          end_date: ''
        });
        fetchApplications();
      })
      .catch(err => setSubmitError(err.message))
      .finally(() => setSubmitLoading(false));
  };

  const handleStartReview = (app) => {
    setSelectedApp(app);
    setReviewStatus(app.status);
    setReviewComments(app.coordinator_comments || '');
    setReviewSuccess(null);
    setReviewError(null);
  };

  const handleSaveReview = (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewSuccess(null);
    setReviewError(null);

    fetch(`/api/applications/${selectedApp.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': user.id.toString()
      },
      body: JSON.stringify({
        status: reviewStatus,
        coordinator_comments: reviewComments
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update review.');
        return data;
      })
      .then(() => {
        setReviewSuccess('Review saved successfully!');
        fetchApplications();
        setTimeout(() => setSelectedApp(null), 1000);
      })
      .catch(err => setReviewError(err.message))
      .finally(() => setReviewLoading(false));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'var(--status-approved)';
      case 'rejected': return 'var(--status-rejected)';
      case 'under_review': return 'var(--status-review)';
      case 'needs_changes': return 'var(--accent-secondary)';
      default: return 'var(--status-submitted)';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'SUBMITTED';
    return status.replace('_', ' ').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 1. Render Login Screen if user not logged in
  if (!user) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎓</span>
          <h1 className="title-gradient" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Internship Application Tracker</h1>
          <p className="subtitle">Prototype Portal</p>
        </header>

        <main className="glass-panel card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Sign In</h2>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            <div>
              <label htmlFor="username" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Username
              </label>
              <input
                type="text"
                id="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                placeholder="Enter username"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                placeholder="Enter password"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>{loginError}</p>}

            <button type="submit" disabled={loginLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Access Helper */}
          <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-color)', textAlign: 'left', fontSize: '0.8rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Demo Accounts:</p>
            <div style={{ color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
              <p>👤 <strong>Student 1:</strong> <code>student1</code> / <code>password</code></p>
              <p>👤 <strong>Student 2:</strong> <code>student2</code> / <code>password</code></p>
              <p>💼 <strong>Coordinator:</strong> <code>coordinator1</code> / <code>password</code></p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. Render authenticated views
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🎓</span>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '0.5px' }}>TRACKER</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="btn"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            Logout
          </button>
        </div>
      </nav>

      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {user.role === 'student' ? 'Student Dashboard' : 'Coordinator Portal'}
        </h1>
        <p className="subtitle" style={{ margin: '0 auto' }}>
          {user.role === 'student' 
            ? 'Submit details for your internship and track approval status.' 
            : 'Review submitted internship proposals, assign status updates, and write feedback.'
          }
        </p>
      </header>

      {error && (
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-rejected)', marginBottom: '2rem' }}>
          <p style={{ color: '#ef4444', fontWeight: 600 }}>API Request Failed</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{error}</p>
        </div>
      )}

      {/* Render student screen if role is student */}
      {user.role === 'student' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Submission Form (Student) */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              {editAppId ? `Edit Application #${editAppId}` : 'Submit Internship Details'}
            </h2>
            <form onSubmit={handleSubmitApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label htmlFor="student_name" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Your Full Name
                </label>
                <input
                  type="text"
                  id="student_name"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  placeholder="e.g. Jane Doe"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label htmlFor="company_name" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Company Name
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  placeholder="e.g. Google"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label htmlFor="position_title" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Position Title
                </label>
                <input
                  type="text"
                  id="position_title"
                  name="position_title"
                  value={formData.position_title}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  placeholder="e.g. Software Engineer Intern"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="start_date" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label htmlFor="end_date" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              {submitSuccess && <p style={{ color: '#10b981', fontSize: '0.875rem' }}>{submitSuccess}</p>}
              {submitError && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{submitError}</p>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ flexGrow: 1 }}>
                  {submitLoading ? 'Submitting...' : editAppId ? 'Resubmit' : 'Submit Application'}
                </button>
                {editAppId && (
                  <button type="button" onClick={handleCancelEdit} className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* List (Student - ONLY shows own applications) */}
          <section className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '400px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>My Submissions</h2>
            
            {/* Filter controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Search company..."
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_changes">Needs Changes</option>
              </select>
            </div>
            
            {loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto' }}>Loading applications...</p>
            ) : applications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>No applications submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '550px' }}>
                {applications.map(app => (
                  <div key={app.id} style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(27, 37, 69, 0.4)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{app.company_name}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{app.position_title}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '4px', backgroundColor: getStatusColor(app.status) + '22', color: getStatusColor(app.status), border: `1px solid ${getStatusColor(app.status)}33` }}>
                        {getStatusLabel(app.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gap: '0.3rem', marginBottom: '0.75rem' }}>
                      <p><strong>Student:</strong> {app.student_name}</p>
                      <p><strong>Duration:</strong> {formatDate(app.start_date)} - {formatDate(app.end_date)}</p>
                    </div>
                    {app.coordinator_comments ? (
                      <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderLeft: '3px solid var(--accent-secondary)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Coordinator Comments</p>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{app.coordinator_comments}</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No coordinator comments yet.</p>
                    )}

                    {app.status === 'needs_changes' && (
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)' }}
                          onClick={() => handleStartEdit(app)}
                        >
                          Edit & Resubmit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Coordinator View (Shows all applications, allows filter & review) */
        <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '2fr 1.2fr' : '1fr', gap: '2rem', alignItems: 'start', transition: 'var(--transition-smooth)' }}>
          
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Student Submissions Dashboard</h2>
              
              {/* Filter controls */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Filter by company name..."
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0' }}>Loading applications...</p>
            ) : applications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No applications match the search filters.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applications.map(app => (
                  <div 
                    key={app.id} 
                    style={{ 
                      padding: '1.25rem', 
                      borderRadius: '12px', 
                      backgroundColor: selectedApp?.id === app.id ? 'rgba(59, 130, 246, 0.08)' : 'rgba(27, 37, 69, 0.4)', 
                      border: selectedApp?.id === app.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1.5rem',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{app.company_name}</h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2' + 'rem 0.5rem', borderRadius: '4px', backgroundColor: getStatusColor(app.status) + '22', color: getStatusColor(app.status), border: `1px solid ${getStatusColor(app.status)}33` }}>
                          {getStatusLabel(app.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <p><strong>Student:</strong> {app.student_name}</p>
                        <p><strong>Position:</strong> {app.position_title}</p>
                        <p><strong>Dates:</strong> {formatDate(app.start_date)} - {formatDate(app.end_date)}</p>
                      </div>
                      {app.coordinator_comments && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                          <strong>Comment:</strong> "{app.coordinator_comments}"
                        </p>
                      )}
                    </div>
                    <div>
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => handleStartReview(app)}>
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right panel: Edit review options */}
          {selectedApp && (
            <section className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Review Submission</h2>
                <button 
                  onClick={() => setSelectedApp(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <p><strong>Student:</strong> {selectedApp.student_name}</p>
                <p><strong>Company:</strong> {selectedApp.company_name}</p>
                <p><strong>Position:</strong> {selectedApp.position_title}</p>
              </div>

              <form onSubmit={handleSaveReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="review_status" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Application Status
                  </label>
                  <select
                    id="review_status"
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="needs_changes">Needs Changes</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="review_comments" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Coordinator Comments
                  </label>
                  <textarea
                    id="review_comments"
                    rows="4"
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    maxLength={1000}
                    placeholder="Enter coordinator feedback..."
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  ></textarea>
                </div>

                {reviewSuccess && <p style={{ color: '#10b981', fontSize: '0.875rem' }}>{reviewSuccess}</p>}
                {reviewError && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{reviewError}</p>}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" disabled={reviewLoading} className="btn btn-primary" style={{ flexGrow: 1 }}>
                    {reviewLoading ? 'Saving...' : 'Save Review'}
                  </button>
                  <button type="button" onClick={() => setSelectedApp(null)} className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

export default App
