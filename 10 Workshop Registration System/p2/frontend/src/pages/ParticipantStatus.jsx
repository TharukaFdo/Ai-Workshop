import React, { useState, useEffect } from 'react';

const WORKSHOPS = [
  'Introduction to React & State Management',
  'Building REST APIs with Express & MySQL',
  'Advanced Frontend Systems & Deployment'
];

export default function ParticipantStatus() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters state
  const [filterWorkshop, setFilterWorkshop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAttendance, setFilterAttendance] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('sessionToken');
    if (!token) {
      setError('Session expired. Please log in.');
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (filterWorkshop) queryParams.append('workshopTitle', filterWorkshop);
      if (filterStatus) queryParams.append('status', filterStatus);
      if (filterAttendance) queryParams.append('attendanceStatus', filterAttendance);

      const response = await fetch(`/api/registrations/status?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch registration status');
      }

      setRegistrations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [filterWorkshop, filterStatus, filterAttendance]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return { background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80' };
      case 'cancelled':
        return { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171' };
      case 'waitlisted':
        return { background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.4)', color: '#f97316' };
      default:
        return { background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#facc15' };
    }
  };

  const getAttendanceStyle = (attendance) => {
    switch (attendance) {
      case 'present':
        return { background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa' };
      case 'absent':
        return { background: 'rgba(156, 163, 175, 0.15)', border: '1px solid rgba(156, 163, 175, 0.4)', color: '#9ca3af' };
      default:
        return { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#d1d5db' };
    }
  };

  return (
    <div className="card" style={{ maxWidth: '750px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#fff' }}>My Registrations</h2>
      
      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Workshop</label>
          <select value={filterWorkshop} onChange={(e) => setFilterWorkshop(e.target.value)} style={{ margin: '0.25rem 0 0', padding: '0.5rem' }}>
            <option value="">All Workshops</option>
            {WORKSHOPS.map(w => (
              <option key={w} value={w} style={{ background: '#1e1b29' }}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ margin: '0.25rem 0 0', padding: '0.5rem' }}>
            <option value="">All Statuses</option>
            <option value="pending" style={{ background: '#1e1b29' }}>Pending</option>
            <option value="confirmed" style={{ background: '#1e1b29' }}>Confirmed</option>
            <option value="cancelled" style={{ background: '#1e1b29' }}>Cancelled</option>
            <option value="waitlisted" style={{ background: '#1e1b29' }}>Waitlisted</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Attendance</label>
          <select value={filterAttendance} onChange={(e) => setFilterAttendance(e.target.value)} style={{ margin: '0.25rem 0 0', padding: '0.5rem' }}>
            <option value="">All Attendance</option>
            <option value="notMarked" style={{ background: '#1e1b29' }}>Not Marked</option>
            <option value="present" style={{ background: '#1e1b29' }}>Present</option>
            <option value="absent" style={{ background: '#1e1b29' }}>Absent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading registrations...</p>
      ) : registrations.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', margin: '2rem 0' }}>No registrations match the selected filters.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {registrations.map((reg) => (
            <div key={reg.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{reg.workshopTitle}</h4>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '50px', 
                  fontSize: '0.8rem', 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  ...getStatusStyle(reg.status)
                }}>
                  {reg.status}
                </span>
              </div>
              
              {reg.registrationDetails && (
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem', fontStyle: 'italic' }}>
                  "{reg.registrationDetails}"
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>
                  Registered on: {new Date(reg.createdAt).toLocaleDateString()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Attendance:</span>
                  <span style={{ 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    ...getAttendanceStyle(reg.attendanceStatus)
                  }}>
                    {reg.attendanceStatus === 'notMarked' ? 'Not Marked' : reg.attendanceStatus === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
