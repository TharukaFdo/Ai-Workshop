import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PlusCircle, Filter, RefreshCw, AlertCircle, Calendar } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api';

const Dashboard = ({ user }) => {
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Coordinator review overlay state
  const [reviewApp, setReviewApp] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Student edit resubmit overlay state
  const [editApp, setEditApp] = useState(null);
  const [editCompany, setEditCompany] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  if (!user) return <Navigate to="/login" />;

  const isCoordinator = user.role === 'coordinator';

  // Fetch applications with current filters
  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (filterCompany) queryParams.append('companyName', filterCompany);
      if (filterStatus) queryParams.append('status', filterStatus);

      const response = await fetch(`${API_BASE_URL}/applications?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterCompany, filterStatus]);

  const openReviewModal = (app) => {
    setReviewApp(app);
    setReviewStatus(app.status);
    setReviewComment(app.coordinatorComment || '');
    setReviewError('');
  };

  const closeReviewModal = () => {
    setReviewApp(null);
    setReviewStatus('');
    setReviewComment('');
    setReviewError('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');

    try {
      const response = await fetch(`${API_BASE_URL}/applications/${reviewApp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          coordinatorComment: reviewComment
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update application');
      }

      // Update local state list to avoid full refresh
      setApplications(prev => prev.map(app => app.id === reviewApp.id ? data : app));
      closeReviewModal();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const openEditModal = (app) => {
    setEditApp(app);
    setEditCompany(app.companyName);
    setEditPosition(app.positionTitle);
    // Format dates to YYYY-MM-DD for date input
    setEditStart(app.startDate ? app.startDate.split('T')[0] : '');
    setEditEnd(app.endDate ? app.endDate.split('T')[0] : '');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditApp(null);
    setEditCompany('');
    setEditPosition('');
    setEditStart('');
    setEditEnd('');
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    if (new Date(editStart) >= new Date(editEnd)) {
      setEditError('Start Date must be strictly before End Date.');
      setEditLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/applications/${editApp.id}/resubmit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          companyName: editCompany,
          positionTitle: editPosition,
          startDate: editStart,
          endDate: editEnd
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resubmit application.');
      }

      setApplications(prev => prev.map(app => app.id === editApp.id ? data : app));
      closeEditModal();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Helper to format date strings cleanly
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Display status badges helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="badge badge-submitted">Submitted</span>;
      case 'underReview':
        return <span className="badge badge-review">Under Review</span>;
      case 'approved':
        return <span className="badge badge-approved">Approved</span>;
      case 'rejected':
        return <span className="badge badge-rejected">Rejected</span>;
      case 'changesRequested':
        return <span className="badge badge-review" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>Changes Requested</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Applications Directory</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {isCoordinator ? 'Viewing all submitted applications.' : 'Viewing your submitted applications.'}
          </p>
        </div>
        {!isCoordinator && (
          <Link to="/submit" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Submit Application</span>
          </Link>
        )}
      </div>

      {/* Filters Form */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 500 }}>Filters:</span>
          </div>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <input 
              type="text" 
              placeholder="Search by company name..." 
              className="form-control"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
            />
          </div>
          <div style={{ width: '220px' }}>
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
              <option value="changesRequested">Changes Requested</option>
            </select>
          </div>
          <button onClick={fetchApplications} className="btn btn-secondary" title="Refresh list">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', background: 'var(--danger-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
            <AlertCircle size={24} />
            <div>
              <h4 style={{ margin: 0 }}>Connection Error</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table view */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', gap: '1rem' }}>
            <RefreshCw className="spinner" size={32} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Loading application details...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Dates (Timeline)</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Comments</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 500 }}>{app.studentName}</td>
                      <td>{app.companyName}</td>
                      <td>{app.positionTitle}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                          <span>{formatDate(app.startDate)} - {formatDate(app.endDate)}</span>
                        </div>
                      </td>
                      <td>{formatDate(app.submittedDate)}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td style={{ color: app.coordinatorComment ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {app.coordinatorComment || 'No comments'}
                      </td>
                      <td>
                        {isCoordinator ? (
                          <button 
                            onClick={() => openReviewModal(app)}
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                          >
                            Review
                          </button>
                        ) : (
                          app.status === 'changesRequested' && (
                            <button 
                              onClick={() => openEditModal(app)}
                              className="btn btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            >
                              Edit & Resubmit
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog Card Overlay (Simulated Modal) */}
      {reviewApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: 0 }}>
            <h3 style={{ marginBottom: '1rem' }}>Review Application</h3>
            
            <div style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <p><strong>Student:</strong> {reviewApp.studentName}</p>
              <p><strong>Company:</strong> {reviewApp.companyName}</p>
              <p><strong>Position:</strong> {reviewApp.positionTitle}</p>
            </div>

            {reviewError && (
              <div style={{ 
                background: 'var(--danger-bg)', 
                color: 'var(--danger)', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-sm)', 
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {reviewError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Application Status</label>
                <select 
                  className="form-control"
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
                <label className="form-label">Coordinator Review Comment</label>
                <textarea 
                  className="form-control" 
                  rows="4"
                  placeholder="Provide comments regarding decisions or requirements..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
                  {reviewLoading ? 'Saving...' : 'Save Decision'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeReviewModal} disabled={reviewLoading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Edit Resubmit Overlay Dialog */}
      {editApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', margin: 0 }}>
            <h3 style={{ marginBottom: '1rem' }}>Edit & Resubmit Application</h3>
            
            {editError && (
              <div style={{ 
                background: 'var(--danger-bg)', 
                color: 'var(--danger)', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-sm)', 
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Position Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Resubmitting...' : 'Resubmit Application'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeEditModal} disabled={editLoading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
