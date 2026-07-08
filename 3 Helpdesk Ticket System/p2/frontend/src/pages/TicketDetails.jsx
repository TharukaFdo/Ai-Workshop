import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Shield, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Agent Action States
  const [newResponse, setNewResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updatingResponse, setUpdatingResponse] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('helpdesk_user') || 'null');
  const token = localStorage.getItem('helpdesk_token');

  const fetchTicketDetails = async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load ticket details');
      }

      setTicket(data);
      setNewStatus(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const handleAddResponse = async (e) => {
    e.preventDefault();
    if (!newResponse.trim()) return;

    setUpdatingResponse(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${id}/response`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agentResponse: newResponse })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response');
      }

      setNewResponse('');
      fetchTicketDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingResponse(false);
    }
  };

  const handleStatusChange = async (statusVal) => {
    setUpdatingStatus(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusVal })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      fetchTicketDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2>Access Restricted</h2>
        <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '1.5rem' }}>Go to Login</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--accent-primary)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem auto'
        }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading ticket details...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const isAgent = currentUser.role === 'agent';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Link */}
      <button 
        onClick={() => navigate('/')} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-secondary)', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          cursor: 'pointer',
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: isAgent ? '3fr 2fr' : '1fr', gap: '2rem' }}>
        {/* Left Column: Ticket details and responses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>TICKET #{ticket.id}</span>
                  <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                    {ticket.status === 'inProgress' ? 'In Progress' : ticket.status}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25 }}>{ticket.title}</h1>
              </div>
            </div>

            {/* Meta details */}
            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <strong>Submitted By:</strong> {ticket.submittedUser} ({ticket.submittedUserEmail})
              </div>
              <div>
                <strong>Category:</strong> {ticket.category}
              </div>
              <div>
                <strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Description */}
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {ticket.description}
            </div>

            {ticket.closedAt && (
              <div style={{
                marginTop: '2rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(100, 116, 139, 0.1)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                Closed on {new Date(ticket.closedAt).toLocaleString()}
              </div>
            )}

            {!isAgent && ticket.status === 'closed' && (ticket.reopened === undefined || ticket.reopened === 0) && (
              <button
                onClick={() => handleStatusChange('open')}
                className="btn btn-primary"
                style={{ marginTop: '1.5rem', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                disabled={updatingStatus}
              >
                Reopen Ticket (Once)
              </button>
            )}
          </div>

          {/* Response History Card */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.15rem' }}>
              <MessageSquare size={18} />
              Agent Responses
            </h3>

            {ticket.agentResponse ? (
              <div style={{
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={14} color="var(--accent-primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>Support Staff</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Last Updated: {new Date(ticket.updatedAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {ticket.agentResponse}
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                No response has been added to this ticket yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Support Agent Actions Panel */}
        {isAgent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ position: 'sticky', top: '90px' }}>
              <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Agent Actions</h3>

              {/* Status Update Dropdown */}
              <div className="form-group">
                <label className="form-label">Update Ticket Status</label>
                <select 
                  className="form-input"
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value);
                    handleStatusChange(e.target.value);
                  }}
                  disabled={updatingStatus}
                >
                  <option value="open">Open</option>
                  <option value="inProgress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Quick Close Button */}
              {ticket.status !== 'closed' && (
                <button 
                  onClick={() => handleStatusChange('closed')} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginBottom: '2rem', gap: '0.5rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  disabled={updatingStatus}
                >
                  <CheckCircle size={16} />
                  Close Ticket
                </button>
              )}

              {/* Response Input Form */}
              <form onSubmit={handleAddResponse} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">{ticket.agentResponse ? 'Update Response' : 'Write Response'}</label>
                  <textarea 
                    className="form-input" 
                    rows="5"
                    placeholder="Type official reply to the user..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    required
                    disabled={updatingResponse}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={updatingResponse || !newResponse.trim()}
                >
                  {updatingResponse ? 'Submitting...' : ticket.agentResponse ? 'Update Reply' : 'Send Reply'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
