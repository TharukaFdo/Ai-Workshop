import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // { token, role, username }
  const [projects, setProjects] = useState([]);
  
  // Login Form State
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Student Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Application',
    supervisor_name: ''
  });

  // Track if a student is editing a project
  const [editingProjectId, setEditingProjectId] = useState(null);
  
  // Unified Filters State (Appended to GET query)
  const [filters, setFilters] = useState({
    supervisor_name: '',
    category: '',
    status: ''
  });

  // Supervisor Editing Feedbacks State
  const [editingReviews, setEditingReviews] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check for stored session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('userSession');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('userSession');
      }
    }
  }, []);

  // Fetch projects from the database with filter queries
  const fetchProjects = async (token = user?.token, currentFilters = filters) => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (currentFilters.supervisor_name) params.append('supervisor_name', currentFilters.supervisor_name);
      if (currentFilters.category) params.append('category', currentFilters.category);
      if (currentFilters.status) params.append('status', currentFilters.status);

      const res = await fetch(`http://localhost:5001/api/projects?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);

      const initialEditing = {};
      data.forEach((p) => {
        initialEditing[p.id] = {
          status: p.status,
          supervisor_feedback: p.supervisor_feedback || ''
        };
      });
      setEditingReviews(initialEditing);
    } catch (err) {
      console.error(err);
      setError('Could not load project submissions.');
    }
  };

  // Re-fetch projects when filters change
  useEffect(() => {
    if (user?.token) {
      fetchProjects(user.token, filters);
    }
  }, [filters, user]);

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('userSession', JSON.stringify(data));
      setUser(data);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUser(null);
    setProjects([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewChange = (projectId, field, value) => {
    setEditingReviews((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value
      }
    }));
  };

  const handleEditStart = (project) => {
    setEditingProjectId(project.id);
    setFormData({
      title: project.title,
      description: project.description,
      category: project.category,
      supervisor_name: project.supervisor_name
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setFormData({
      title: '',
      description: '',
      category: 'Web Application',
      supervisor_name: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let res;
      if (editingProjectId) {
        res = await fetch(`http://localhost:5001/api/projects/${editingProjectId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch('http://localhost:5001/api/projects', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(formData)
        });
      }

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Submission failed');

      setSuccess(editingProjectId ? 'Project updated successfully!' : 'Project submitted successfully!');
      setFormData({
        title: '',
        description: '',
        category: 'Web Application',
        supervisor_name: ''
      });
      setEditingProjectId(null);
      fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReview = async (projectId) => {
    const reviewData = editingReviews[projectId];
    if (!reviewData) return;

    try {
      const res = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          status: reviewData.status,
          supervisor_feedback: reviewData.supervisor_feedback
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update review');

      alert('Review saved successfully!');
      fetchProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  // Render Login view if not logged in
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Student Project Tracker</h1>
          <p className="login-subtitle">Sign in to your student or supervisor account</p>
          
          {loginError && <div className="alert error-alert">{loginError}</div>}
          
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login_username">Username</label>
              <input
                type="text"
                id="login_username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                required
                placeholder="e.g. alice or dr_john"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="login_password">Password</label>
              <input
                type="password"
                id="login_password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button type="submit" className="submit-btn">Login</button>
          </form>
          <div className="login-helper">
            <p>💡 Demo Accounts:</p>
            <ul>
              <li><strong>Student:</strong> alice / password123</li>
              <li><strong>Supervisor:</strong> dr_john / password123</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Session Info Bar */}
      <div className="role-selector-bar">
        <span className="role-label">
          Signed in as: <strong style={{ color: '#0f172a' }}>{user.username}</strong> ({user.role})
        </span>
        <button onClick={handleLogout} className="role-btn">
          Logout
        </button>
      </div>

      <header className="header">
        <h1>Student Project Tracker</h1>
        <p className="subtitle">
          {user.role === 'student' 
            ? 'Submit and track your academic software project details' 
            : 'Review submitted projects, add feedback, and update statuses'}
        </p>
      </header>

      <div className="main-content">
        {/* Left Section */}
        {user.role === 'student' ? (
          /* Student View Form */
          <section className="form-section">
            <h2>{editingProjectId ? 'Edit Project Submission' : 'New Project Submission'}</h2>
            {error && <div className="alert error-alert">{error}</div>}
            {success && <div className="alert success-alert">{success}</div>}

            <form onSubmit={handleSubmit} className="project-form">
              <div className="form-group">
                <label htmlFor="title">Project Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Smart Attendance System"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Brief summary of the project scope and tech stack..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="Web Application">Web Application</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="supervisor_name">Supervisor Name</label>
                  <input
                    type="text"
                    id="supervisor_name"
                    name="supervisor_name"
                    value={formData.supervisor_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Supervisor's full name"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={loading} className="submit-btn" style={{ flex: 1 }}>
                  {loading ? 'Saving...' : editingProjectId ? 'Update Project' : 'Submit Project'}
                </button>
                {editingProjectId && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit} 
                    className="cancel-btn"
                    style={{ flex: 1 }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>
        ) : (
          /* Info Panel for Supervisor view */
          <section className="form-section">
            <h2>Supervisor Panel</h2>
            <div className="instructions-card">
              <p>As a supervisor, you can review and update the status of student submissions.</p>
              <ul>
                <li>Use the unified filters to find submissions.</li>
                <li>Write constructive feedback for students.</li>
                <li>Set statuses to <strong>Approved</strong> or <strong>Rejected</strong>.</li>
              </ul>
            </div>
          </section>
        )}

        {/* Right Section: Submissions List */}
        <section className="list-section">
          <div className="list-header-row">
            <h2>
              {user.role === 'student' ? 'My Submissions' : 'Submissions to Review'} 
              <span className="count-badge">({projects.length})</span>
            </h2>
          </div>

          {/* Unified Filter Bar */}
          <div className="filters-bar-horizontal">
            <div className="filter-input-group">
              <input
                type="text"
                name="supervisor_name"
                value={filters.supervisor_name}
                onChange={handleFilterChange}
                placeholder="Filter supervisor..."
              />
            </div>

            <div className="filter-input-group">
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="Web Application">Web Application</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="filter-input-group">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Revision Requested">Revision Requested</option>
              </select>
            </div>

            {(filters.supervisor_name || filters.category || filters.status) && (
              <button 
                type="button" 
                onClick={() => setFilters({ supervisor_name: '', category: '', status: '' })}
                className="clear-btn-small"
              >
                Reset
              </button>
            )}
          </div>

          <div className="project-list">
            {projects.length === 0 ? (
              <p className="no-projects">No submissions matching the filters.</p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-card-header">
                    <h3>{project.title}</h3>
                    <span className={`status-badge ${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="project-desc">{project.description}</p>
                  
                  <div className="project-details">
                    <div><strong>Student:</strong> {project.student_name}</div>
                    <div><strong>Supervisor:</strong> {project.supervisor_name}</div>
                    <div><strong>Category:</strong> {project.category}</div>
                    <div>
                      <strong>Date:</strong> {new Date(project.submitted_date).toLocaleDateString()}
                    </div>
                  </div>

                  {user.role === 'student' ? (
                    /* Read-Only Feedback & Edit controls for Students */
                    <>
                      {project.supervisor_feedback && (
                        <div className="feedback-section">
                          <strong>Supervisor Feedback:</strong>
                          <p>{project.supervisor_feedback}</p>
                        </div>
                      )}
                      {project.status === 'Revision Requested' && (
                        <button
                          type="button"
                          onClick={() => handleEditStart(project)}
                          className="edit-details-btn"
                        >
                          Edit Details
                        </button>
                      )}
                    </>
                  ) : (
                    /* Interactive Review Panel for Supervisors */
                    <div className="supervisor-review-panel">
                      <div className="form-group">
                        <label>Update Status</label>
                        <select
                          value={editingReviews[project.id]?.status || 'Pending'}
                          onChange={(e) => handleReviewChange(project.id, 'status', e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Revision Requested">Revision Requested</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Supervisor Feedback</label>
                        <textarea
                          rows="2"
                          value={editingReviews[project.id]?.supervisor_feedback || ''}
                          onChange={(e) => handleReviewChange(project.id, 'supervisor_feedback', e.target.value)}
                          placeholder="Provide feedback to student..."
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleSaveReview(project.id)}
                        className="save-review-btn"
                      >
                        Save Review
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
