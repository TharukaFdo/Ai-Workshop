import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Filters state
  const [filterSupervisor, setFilterSupervisor] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Project Form state (for Students)
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [studentName, setStudentName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [submittedDate, setSubmittedDate] = useState('');

  // Review state (for Supervisors)
  const [activeProject, setActiveProject] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Fetch projects when user changes or filters are applied
  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser, filterSupervisor, filterCategory, filterStatus]);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (filterSupervisor) queryParams.append('supervisorName', filterSupervisor);
      if (filterCategory) queryParams.append('category', filterCategory);
      if (filterStatus) queryParams.append('status', filterStatus);

      const res = await fetch(`${API_BASE}/projects?${queryParams.toString()}`, {
        headers: {
          'x-user-id': currentUser.id.toString()
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch project submissions');
      }

      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setCurrentUser(data);
      if (data.role === 'student') {
        setStudentName(data.fullName);
      }
      resetForm();
      setActiveProject(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setProjects([]);
    resetForm();
    setActiveProject(null);
    setSuccess('');
    setError('');
  };

  const resetForm = () => {
    setFormMode('create');
    setSelectedProjectId(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setSupervisorName('');
    setSubmittedDate('');
    if (currentUser && currentUser.role === 'student') {
      setStudentName(currentUser.fullName);
    }
  };

  const handleCreateOrUpdateProject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !description || !category || !supervisorName || !submittedDate) {
      setError('All fields are required.');
      return;
    }

    const payload = {
      title,
      description,
      category,
      supervisorName,
      submittedDate
    };

    try {
      const url = formMode === 'create' 
        ? `${API_BASE}/projects` 
        : `${API_BASE}/projects/${selectedProjectId}`;
      const method = formMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit project');
      }

      setSuccess(formMode === 'create' ? 'Project submitted successfully!' : 'Project updated successfully!');
      resetForm();
      fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectProjectForEdit = (project) => {
    setFormMode('edit');
    setSelectedProjectId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category);
    setStudentName(project.studentName);
    setSupervisorName(project.supervisorName);
    const formattedDate = project.submittedDate ? project.submittedDate.substring(0, 10) : '';
    setSubmittedDate(formattedDate);
  };

  const handleSelectProjectForReview = (project) => {
    setActiveProject(project);
    setReviewStatus(project.status);
    setReviewFeedback(project.feedback || '');
    setSuccess('');
    setError('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/projects/${activeProject.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: reviewFeedback
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update review');
      }

      setSuccess('Review updated successfully!');
      fetchProjects();
      setActiveProject({ ...activeProject, status: reviewStatus, feedback: reviewFeedback });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <h1>Student Project Tracker</h1>
        </div>
        {currentUser && (
          <div className="user-selector-container">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Logged in as: <strong>{currentUser.fullName}</strong> ({currentUser.role})
            </span>
            <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 1rem' }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="main-content">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {!currentUser ? (
          <div className="card" style={{ maxWidth: '450px', margin: '4rem auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Account Sign In</h2>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="e.g. alice_student"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
                Sign In
              </button>
            </form>
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: '600', margin: '0 0 0.5rem 0' }}>Seeded Demo Credentials:</p>
              <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                <li>Students: <code>alice_student</code> or <code>bob_student</code> (Password: <code>password123</code>)</li>
                <li>Supervisors: <code>supervisor_john</code> or <code>supervisor_jane</code> (Password: <code>password123</code>)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            {/* Filters (Secondary Feature) */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>Filter Project Submissions</h3>
              <div className="filters-bar">
                <div className="filter-select">
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Supervisor</label>
                  <select 
                    className="form-control" 
                    value={filterSupervisor} 
                    onChange={(e) => setFilterSupervisor(e.target.value)}
                  >
                    <option value="">All Supervisors</option>
                    <option value="Prof. John Doe">Prof. John Doe</option>
                    <option value="Prof. Jane Smith">Prof. Jane Smith</option>
                  </select>
                </div>
                <div className="filter-select">
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</label>
                  <select 
                    className="form-control" 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Mobile Applications">Mobile Applications</option>
                    <option value="Web Applications">Web Applications</option>
                  </select>
                </div>
                <div className="filter-select">
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</label>
                  <select 
                    className="form-control" 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="underReview">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="revisionRequested">Revision Requested</option>
                  </select>
                </div>
                {(filterSupervisor || filterCategory || filterStatus) && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ alignSelf: 'flex-end', width: 'auto', height: '42px', padding: '0 1rem' }}
                    onClick={() => {
                      setFilterSupervisor('');
                      setFilterCategory('');
                      setFilterStatus('');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Dashboard grid depending on user role */}
            {currentUser.role === 'student' ? (
              <div className="dashboard-layout student-layout">
                {/* Submit / Edit Form (Student action) */}
                <div className="card">
                  <h2>{formMode === 'create' ? 'Submit New Project' : 'Edit Project Details'}</h2>
                  <form onSubmit={handleCreateOrUpdateProject}>
                    <div className="form-group">
                      <label>Project Title</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. AI-based Medical Diagnosis"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        className="form-control" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed project summary..."
                        rows="4"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select 
                        className="form-control" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      >
                        <option value="">-- Select Category --</option>
                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                        <option value="Mobile Applications">Mobile Applications</option>
                        <option value="Web Applications">Web Applications</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Student Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={studentName} 
                        disabled 
                      />
                    </div>
                    <div className="form-group">
                      <label>Supervisor Name</label>
                      <select 
                        className="form-control" 
                        value={supervisorName} 
                        onChange={(e) => setSupervisorName(e.target.value)}
                        required
                      >
                        <option value="">-- Select Supervisor --</option>
                        <option value="Prof. John Doe">Prof. John Doe</option>
                        <option value="Prof. Jane Smith">Prof. Jane Smith</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Submission Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={submittedDate} 
                        onChange={(e) => setSubmittedDate(e.target.value)}
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                      <button type="submit" className="btn">
                        {formMode === 'create' ? 'Submit Project' : 'Save Changes'}
                      </button>
                      {formMode === 'edit' && (
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Submissions List (Student view own submissions) */}
                <div className="card">
                  <h2>My Submissions</h2>
                  {loading ? (
                    <div className="loading-spinner">Loading submissions...</div>
                  ) : projects.length === 0 ? (
                    <div className="empty-state">No submissions found. Try resetting filters or submit a new project.</div>
                  ) : (
                    <div className="projects-list">
                      {projects.map((project) => (
                        <div key={project.id} className="project-item">
                          <div className="project-header">
                            <h4 className="project-title">{project.title}</h4>
                            <span className={`badge badge-${project.status}`}>{project.status}</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                            {project.description}
                          </p>
                          <div className="project-meta">
                            <span>Category: {project.category}</span>
                            <span>Supervisor: {project.supervisorName}</span>
                            <span>Submitted: {project.submittedDate ? project.submittedDate.substring(0, 10) : ''}</span>
                          </div>
                          
                          {project.feedback && (
                            <div className="feedback-box">
                              <h4>Supervisor Feedback</h4>
                              <p className="feedback-text">{project.feedback}</p>
                            </div>
                          )}

                          {project.status === 'revisionRequested' && (
                            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => handleSelectProjectForEdit(project)}
                              >
                                Edit Details & Resubmit
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Supervisor Layout */
              <div className="dashboard-layout supervisor-layout">
                {/* List of Submissions */}
                <div className="card">
                  <h2>All Student Submissions</h2>
                  {loading ? (
                    <div className="loading-spinner">Loading submissions...</div>
                  ) : projects.length === 0 ? (
                    <div className="empty-state">No student submissions matching filters.</div>
                  ) : (
                    <div className="projects-list">
                      {projects.map((project) => (
                        <div 
                          key={project.id} 
                          className={`project-item ${activeProject && activeProject.id === project.id ? 'selected' : ''}`}
                          onClick={() => handleSelectProjectForReview(project)}
                        >
                          <div className="project-header">
                            <h4 className="project-title">{project.title}</h4>
                            <span className={`badge badge-${project.status}`}>{project.status}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                            Student: {project.studentName}
                          </p>
                          <div className="project-meta">
                            <span>Category: {project.category}</span>
                            <span>Supervisor: {project.supervisorName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review & Feedback Actions */}
                <div className="card">
                  <h2>Review Panel</h2>
                  {activeProject ? (
                    <div>
                      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>{activeProject.title}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                          Submitted by: {activeProject.studentName} on {activeProject.submittedDate ? activeProject.submittedDate.substring(0, 10) : ''}
                        </p>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{activeProject.description}</p>
                      </div>

                      <form onSubmit={handleReviewSubmit}>
                        <div className="form-group">
                          <label>Update Status</label>
                          <select 
                            className="form-control" 
                            value={reviewStatus} 
                            onChange={(e) => setReviewStatus(e.target.value)}
                            required
                          >
                            <option value="submitted">Submitted</option>
                            <option value="underReview">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="revisionRequested">Revision Requested</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Add / Edit Feedback</label>
                          <textarea 
                            className="form-control" 
                            value={reviewFeedback} 
                            onChange={(e) => setReviewFeedback(e.target.value)}
                            placeholder="Provide details of your review..."
                            rows="5"
                          />
                        </div>
                        <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
                          Save Review Decision
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="empty-state">
                      Select a project from the left list to review details and leave feedback.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
