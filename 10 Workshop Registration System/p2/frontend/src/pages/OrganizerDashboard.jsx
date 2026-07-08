import React, { useState, useEffect } from 'react';

const WORKSHOPS = [
  'Introduction to React & State Management',
  'Building REST APIs with Express & MySQL',
  'Advanced Frontend Systems & Deployment'
];

export default function OrganizerDashboard({ onLogout }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [filterWorkshop, setFilterWorkshop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAttendance, setFilterAttendance] = useState('');

  // Editable note states
  const [editingNotes, setEditingNotes] = useState({});

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    
    const token = localStorage.getItem('sessionToken');
    if (!token) {
      setError('Session expired. Please log in again.');
      if (onLogout) onLogout();
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (filterWorkshop) queryParams.append('workshopTitle', filterWorkshop);
      if (filterStatus) queryParams.append('status', filterStatus);
      if (filterAttendance) queryParams.append('attendanceStatus', filterAttendance);

      const response = await fetch(`/api/registrations?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('sessionToken');
        if (onLogout) onLogout();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch registrations');
      }

      setRegistrations(data);
      
      // Initialize notes state
      const notesState = {};
      data.forEach(reg => {
        notesState[reg.id] = reg.organizerNote || '';
      });
      setEditingNotes(notesState);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filterWorkshop, filterStatus, filterAttendance]);

  const handleUpdate = async (id, updatedFields) => {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
      setError('Unauthorized. Please log in.');
      return;
    }

    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update registration');
      }

      // Refresh data locally or refetch
      setRegistrations(prev => prev.map(reg => reg.id === id ? { ...reg, ...updatedFields } : reg));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleNoteChange = (id, val) => {
    setEditingNotes(prev => ({
      ...prev,
      [id]: val
    }));
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'confirmed': return { color: '#4ade80', background: 'rgba(34,197,94,0.1)' };
      case 'cancelled': return { color: '#f87171', background: 'rgba(239,68,68,0.1)' };
      case 'waitlisted': return { color: '#f97316', background: 'rgba(249,115,22,0.1)' };
      default: return { color: '#facc15', background: 'rgba(234,179,8,0.1)' };
    }
  };

  const getAttendanceBadgeStyle = (att) => {
    switch (att) {
      case 'present': return { color: '#60a5fa', background: 'rgba(59,130,246,0.1)' };
      case 'absent': return { color: '#9ca3af', background: 'rgba(156,163,175,0.1)' };
      default: return { color: '#d1d5db', background: 'rgba(255,255,255,0.05)' };
    }
  };

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff' }}>Organizer Dashboard</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Manage participant registrations and attendance.</p>
        </div>
        <button onClick={onLogout} style={{ width: 'auto', padding: '0.5rem 1.25rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontWeight: '500' }}>
          Logout
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Filter Workshop</label>
          <select value={filterWorkshop} onChange={(e) => setFilterWorkshop(e.target.value)} style={{ margin: '0.25rem 0 0', padding: '0.5rem' }}>
            <option value="">All Workshops</option>
            {WORKSHOPS.map(w => (
              <option key={w} value={w} style={{ background: '#1e1b29' }}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Filter Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ margin: '0.25rem 0 0', padding: '0.5rem' }}>
            <option value="">All Statuses</option>
            <option value="pending" style={{ background: '#1e1b29' }}>Pending</option>
            <option value="confirmed" style={{ background: '#1e1b29' }}>Confirmed</option>
            <option value="cancelled" style={{ background: '#1e1b29' }}>Cancelled</option>
            <option value="waitlisted" style={{ background: '#1e1b29' }}>Waitlisted</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Filter Attendance</label>
          <select value={filterAttendance} onChange={(e) => setFilterAttendance(e.target.value)} style={{ margin: '0.25rem 0 0', padding: '0.5rem' }}>
            <option value="">All Attendance</option>
            <option value="notMarked" style={{ background: '#1e1b29' }}>Not Marked</option>
            <option value="present" style={{ background: '#1e1b29' }}>Present</option>
            <option value="absent" style={{ background: '#1e1b29' }}>Absent</option>
          </select>
        </div>
      </div>

      {/* Registrations List Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading registrations...</div>
      ) : registrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No registrations match the selected filters.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.9rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Participant</th>
                <th style={{ padding: '0.75rem 1rem' }}>Workshop</th>
                <th style={{ padding: '0.75rem 1rem' }}>Registration Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Attendance Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Organizer Note</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{reg.participantName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{reg.email}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#e2e8f0', fontSize: '0.9rem', maxWidth: '250px' }}>
                    {reg.workshopTitle}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      value={reg.status}
                      onChange={(e) => handleUpdate(reg.id, { status: e.target.value })}
                      style={{ 
                        margin: 0, 
                        padding: '0.35rem 0.5rem', 
                        borderRadius: '6px', 
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        ...getStatusBadgeStyle(reg.status)
                      }}
                    >
                      <option value="pending" style={{ background: '#1e1b29', color: '#fff' }}>Pending</option>
                      <option value="confirmed" style={{ background: '#1e1b29', color: '#fff' }}>Confirmed</option>
                      <option value="cancelled" style={{ background: '#1e1b29', color: '#fff' }}>Cancelled</option>
                      <option value="waitlisted" style={{ background: '#1e1b29', color: '#fff' }}>Waitlisted</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      value={reg.attendanceStatus}
                      onChange={(e) => handleUpdate(reg.id, { attendanceStatus: e.target.value })}
                      style={{ 
                        margin: 0, 
                        padding: '0.35rem 0.5rem', 
                        borderRadius: '6px', 
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        ...getAttendanceBadgeStyle(reg.attendanceStatus)
                      }}
                    >
                      <option value="notMarked" style={{ background: '#1e1b29', color: '#fff' }}>Not Marked</option>
                      <option value="present" style={{ background: '#1e1b29', color: '#fff' }}>Present</option>
                      <option value="absent" style={{ background: '#1e1b29', color: '#fff' }}>Absent</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editingNotes[reg.id] || ''}
                        onChange={(e) => handleNoteChange(reg.id, e.target.value)}
                        placeholder="Add notes..."
                        style={{ margin: 0, padding: '0.4rem 0.6rem', fontSize: '0.85rem', minWidth: '150px' }}
                      />
                      <button
                        onClick={() => handleUpdate(reg.id, { organizerNote: editingNotes[reg.id] })}
                        style={{
                          width: 'auto',
                          margin: 0,
                          padding: '0.4rem 0.75rem',
                          background: 'rgba(170, 59, 255, 0.15)',
                          border: '1px solid rgba(170, 59, 255, 0.3)',
                          borderRadius: '6px',
                          color: '#c084fc',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
