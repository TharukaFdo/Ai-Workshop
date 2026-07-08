import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import FiltersPanel from './components/FiltersPanel';
import ProjectCard from './components/ProjectCard';
import { SubmitProjectModal, EditProjectModal, ReviewProjectModal } from './components/Modals';

const API_BASE = 'http://localhost:5000/api/projects';
const AUTH_BASE = 'http://localhost:5000/api/auth';

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [usersList, setUsersList] = useState([]); // Helper list of users for dropdown and select fields
  
  // Login Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Projects & UI States
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters State
  const [filterSupervisor, setFilterSupervisor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form Modal States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Project Form States
  const [editingProject, setEditingProject] = useState(null);
  const [reviewingProject, setReviewingProject] = useState(null);
  
  // Form Inputs
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSupervisorId, setFormSupervisorId] = useState('');
  const [formSubmittedDate, setFormSubmittedDate] = useState('');
  
  // Review Inputs
  const [reviewStatus, setReviewStatus] = useState('submitted');
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Load user database profiles for forms setup when token is available
  useEffect(() => {
    if (token) {
      fetchUsersList();
    }
  }, [token]);

  // Sync projects list when credentials or filters change
  useEffect(() => {
    if (token && currentUser) {
      fetchProjects();
    }
  }, [token, currentUser, filterSupervisor, filterStatus, filterCategory]);

  const fetchUsersList = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to load user definitions', err);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (filterStatus) queryParams.append('status', filterStatus);
      if (filterCategory) queryParams.append('category', filterCategory);
      if (filterSupervisor) queryParams.append('supervisor_id', filterSupervisor);
      
      const res = await fetch(`${API_BASE}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        handleLogout();
        throw new Error('Session expired or invalid. Please login again.');
      }
      if (!res.ok) throw new Error('Failed to fetch projects');
      
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch(`${AUTH_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUsernameInput('');
      setPasswordInput('');
      setSuccess('Logged in successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setProjects([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSuccess('Logged out successfully.');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          supervisor_id: formSupervisorId,
          submitted_date: formSubmittedDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit project');

      setSuccess('Project submitted successfully!');
      setShowSubmitModal(false);
      resetForm();
      fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch(`${API_BASE}/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          supervisor_id: formSupervisorId,
          submitted_date: formSubmittedDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update project');

      setSuccess('Project updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProject = async (e) => {
    e.preventDefault();
    if (!reviewingProject) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch(`${API_BASE}/${reviewingProject.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: reviewFeedback
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setSuccess('Review status and feedback updated successfully!');
      setShowReviewModal(false);
      setReviewingProject(null);
      setReviewFeedback('');
      fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = () => {
    resetForm();
    setShowSubmitModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormTitle(project.title);
    setFormDescription(project.description);
    setFormCategory(project.category);
    setFormSupervisorId(project.supervisor_id);
    
    const d = new Date(project.submitted_date);
    const formattedDate = d.toISOString().split('T')[0];
    setFormSubmittedDate(formattedDate);
    
    setShowEditModal(true);
  };

  const openReviewModal = (project) => {
    setReviewingProject(project);
    setReviewStatus(project.status);
    setReviewFeedback(project.feedback || '');
    setShowReviewModal(true);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('');
    setFormSupervisorId('');
    setFormSubmittedDate('');
    setEditingProject(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const supervisors = usersList.filter(u => u.role === 'supervisor');

  // 1. RENDER LOGIN SCREEN IF NO SESSION TOKEN
  if (!token || !currentUser) {
    return (
      <LoginScreen
        usernameInput={usernameInput}
        setUsernameInput={setUsernameInput}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        handleLogin={handleLogin}
        loading={loading}
        error={error}
      />
    );
  }

  // 2. RENDER AUTHENTICATED WORKSPACE
  return (
    <div className="app-container">
      <header>
        <div>
          <h1>Student Project Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Secure Workshop Review & Feedback Dashboard
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Signed in as: <strong style={{ color: 'var(--text-primary)' }}>{currentUser.full_name}</strong>
          </span>
          <button id="logout-button" className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            Log Out
          </button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--error)' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--success)' }}>
          {success}
        </div>
      )}

      <main>
        {/* Profile Card and Filters */}
        <section className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2>Hello, {currentUser.full_name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Role: <span className="badge badge-pending" style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-glow)' }}>{currentUser.role}</span>
              </p>
            </div>
            {currentUser.role === 'student' && (
              <button id="submit-project-button" className="btn btn-primary" onClick={openSubmitModal}>
                Submit New Project
              </button>
            )}
          </div>

          <FiltersPanel
            currentUser={currentUser}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterSupervisor={filterSupervisor}
            setFilterSupervisor={setFilterSupervisor}
            supervisors={supervisors}
          />
        </section>

        {/* Project Submissions List */}
        <section>
          <h2 style={{ marginBottom: '1rem' }}>Project Submissions</h2>
          
          {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading projects...</p>}
          
          {!loading && projects.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No project submissions found matching your filters.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                openEditModal={openEditModal}
                openReviewModal={openReviewModal}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      </main>

      {/* --- SUBMIT MODAL --- */}
      {showSubmitModal && (
        <SubmitProjectModal
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          formDescription={formDescription}
          setFormDescription={setFormDescription}
          formCategory={formCategory}
          setFormCategory={setFormCategory}
          formSupervisorId={formSupervisorId}
          setFormSupervisorId={setFormSupervisorId}
          formSubmittedDate={formSubmittedDate}
          setFormSubmittedDate={setFormSubmittedDate}
          supervisors={supervisors}
          handleCreateProject={handleCreateProject}
          setShowSubmitModal={setShowSubmitModal}
        />
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <EditProjectModal
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          formDescription={formDescription}
          setFormDescription={setFormDescription}
          formCategory={formCategory}
          setFormCategory={setFormCategory}
          formSupervisorId={formSupervisorId}
          setFormSupervisorId={setFormSupervisorId}
          formSubmittedDate={formSubmittedDate}
          setFormSubmittedDate={setFormSubmittedDate}
          supervisors={supervisors}
          handleUpdateProject={handleUpdateProject}
          setShowEditModal={setShowEditModal}
        />
      )}

      {/* --- REVIEW MODAL --- */}
      {showReviewModal && (
        <ReviewProjectModal
          reviewingProject={reviewingProject}
          reviewStatus={reviewStatus}
          setReviewStatus={setReviewStatus}
          reviewFeedback={reviewFeedback}
          setReviewFeedback={setReviewFeedback}
          handleReviewProject={handleReviewProject}
          setShowReviewModal={setShowReviewModal}
          setReviewingProject={setReviewingProject}
        />
      )}
    </div>
  );
}

export default App;
