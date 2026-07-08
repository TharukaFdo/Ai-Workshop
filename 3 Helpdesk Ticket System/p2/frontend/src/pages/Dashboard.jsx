import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Filter, Eye, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('helpdesk_user') || 'null');
  const token = localStorage.getItem('helpdesk_token');

  const fetchTickets = async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);
      if (categoryFilter) queryParams.append('category', categoryFilter);
      if (userFilter) queryParams.append('submittedUserId', userFilter);

      const response = await fetch(`${API_BASE_URL}/tickets?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets');
      }

      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token || currentUser?.role !== 'agent') return;
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch users list for filter', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, userFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!currentUser) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please log in to view and manage tickets.</p>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Support Tickets</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {currentUser.name} ({currentUser.role})</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchTickets} className="btn btn-secondary" style={{ padding: '0.625rem' }} title="Refresh">
            <RefreshCw size={18} />
          </button>
          {currentUser.role === 'user' && (
            <Link to="/create" className="btn btn-primary">
              <PlusCircle size={18} />
              Submit Ticket
            </Link>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
            <Filter size={16} />
            <span>Filter By:</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
            {/* Status Filter */}
            <div style={{ minWidth: '150px' }}>
              <select 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="inProgress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div style={{ minWidth: '150px' }}>
              <select 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="General">General Inquiry</option>
                <option value="Technical">Technical Issue</option>
                <option value="Billing">Billing & Account</option>
                <option value="Hardware">Hardware Problem</option>
              </select>
            </div>

            {/* User Filter (Agent only) */}
            {currentUser.role === 'agent' && (
              <div style={{ minWidth: '180px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  <option value="">All Submitted Users</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{
            border: '3px solid var(--border-color)',
            borderTop: '3px solid var(--accent-primary)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No tickets found matching the selected filters.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.4)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>TICKET ID</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>TITLE</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>CATEGORY</th>
                {currentUser.role === 'agent' && (
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>SUBMITTED BY</th>
                )}
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>CREATED AT</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }} className="table-row">
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>#{ticket.id}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{ticket.title}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ fontSize: '0.85rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      {ticket.category}
                    </span>
                  </td>
                  {currentUser.role === 'agent' && (
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{ticket.submittedUser}</td>
                  )}
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                      {ticket.status === 'inProgress' ? 'In Progress' : ticket.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(ticket.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <Link to={`/ticket/${ticket.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                      <Eye size={14} />
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Spin Animation Definition */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .table-row:hover {
          background-color: rgba(51, 65, 85, 0.2);
        }
      `}</style>
    </div>
  );
}
