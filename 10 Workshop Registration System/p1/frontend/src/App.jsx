import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Server, Database, RefreshCw, UserPlus, BookOpen, 
  Clock, CheckCircle, XCircle, FileText, Users, 
  Filter, Check, Edit2, AlertCircle, LogIn, LogOut, Lock, User
} from 'lucide-react';

/**
 * Main Workshop Registrations Application component.
 * Manages dual-role workflows for participants and organizers.
 * Automatically synchronizes view elements and permissions with the database state.
 */
function App() {
  // Current logged in user object: { id, username, role }
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Global application states
  const [registrations, setRegistrations] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  // Sign In interface states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Participant Registration Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [workshopTitle, setWorkshopTitle] = useState('React Basics for Beginners');
  const [details, setDetails] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters State (Organizer)
  const [filterWorkshop, setFilterWorkshop] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAttendance, setFilterAttendance] = useState('all');

  // Inline Note Edit State (Organizer)
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNoteText, setTempNoteText] = useState('');

  const workshops = [
    'React Basics for Beginners',
    'Building APIs with Express & Node.js',
    'Advanced Database Design with MySQL'
  ];

  const fetchRegistrations = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const healthRes = await fetch('/api/health');
      const healthData = await healthRes.json();
      setHealth(healthData);

      const regRes = await fetch('/api/registrations', {
        headers: {
          'x-user-id': currentUser.id.toString()
        }
      });
      
      if (regRes.status === 401 || regRes.status === 403) {
        handleLogout();
        throw new Error('Session expired or unauthorized');
      }
      
      if (!regRes.ok) throw new Error('Failed to fetch registrations');
      const regData = await regRes.json();
      setRegistrations(regData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Connection failure. Check backend server and database status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRegistrations();
    }
  }, [currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setRegistrations([]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmitLoading(true);
    setSuccessMsg('');
    setError(null);

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          name,
          email,
          workshop_title: workshopTitle,
          registration_details: details
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit registration');
      }

      setSuccessMsg('Successfully registered! Status is currently Pending.');
      setName('');
      setEmail('');
      setDetails('');
      await fetchRegistrations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to modify registrations.');
      }
      if (!response.ok) throw new Error('Failed to update status');
      
      setRegistrations(prev => prev.map(reg => reg.id === id ? { ...reg, status: newStatus } : reg));
    } catch (err) {
      alert(err.message);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateAttendance = async (id, newAttendance) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({ attendance: newAttendance })
      });

      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to modify registrations.');
      }
      if (!response.ok) throw new Error('Failed to update attendance');
      
      setRegistrations(prev => prev.map(reg => reg.id === id ? { ...reg, attendance: newAttendance } : reg));
    } catch (err) {
      alert(err.message);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNote = async (id) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({ organizer_notes: tempNoteText })
      });

      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to modify registrations.');
      }
      if (!response.ok) throw new Error('Failed to update organizer notes');
      
      setRegistrations(prev => prev.map(reg => reg.id === id ? { ...reg, organizer_notes: tempNoteText } : reg));
      setEditingNoteId(null);
    } catch (err) {
      alert(err.message);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter Logic (Organizer View Only)
  const filteredRegistrations = registrations.filter(reg => {
    const matchesWorkshop = filterWorkshop === 'all' || reg.workshop_title === filterWorkshop;
    const matchesStatus = filterStatus === 'all' || reg.status === filterStatus;
    const matchesAttendance = filterAttendance === 'all' || reg.attendance === filterAttendance;
    return matchesWorkshop && matchesStatus && matchesAttendance;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="status-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle size={12} style={{ marginRight: '4px' }} /> Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <XCircle size={12} style={{ marginRight: '4px' }} /> Cancelled
          </span>
        );
      case 'waitlisted':
        return (
          <span className="status-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Clock size={12} style={{ marginRight: '4px' }} /> Waitlisted
          </span>
        );
      default:
        return (
          <span className="status-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Clock size={12} style={{ marginRight: '4px' }} /> Pending
          </span>
        );
    }
  };

  const getAttendanceBadge = (attendance) => {
    switch (attendance) {
      case 'present':
        return (
          <span className="status-badge" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
            Present
          </span>
        );
      case 'absent':
        return (
          <span className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
            Absent
          </span>
        );
      default:
        return (
          <span className="status-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            Unmarked
          </span>
        );
    }
  };

  // ==================== RENDERING LOGIN SCREEN ====================
  if (!currentUser) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', marginBottom: '1rem' }}>
              <Sparkles size={32} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.75rem', color: '#fff', marginBottom: '0.5rem' }}>Sign In</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Workshop Registration System</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: '#fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '13px' }} />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="org or part"
                  required
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '13px' }} />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  required
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loginLoading} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <LogIn size={16} />
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px dashed var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Demo accounts:</p>
            <p>• Organizer: <strong>org</strong> / password: <strong>org</strong></p>
            <p style={{ marginTop: '0.15rem' }}>• Participant: <strong>part</strong> / password: <strong>part</strong></p>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDERING MAIN APP ====================
  return (
    <div className="app-container">
      <header>
        <div className="logo">
          <Sparkles size={28} color="#6366f1" />
          <span>Workshop Registrations</span>
        </div>
        
        {/* Logged in User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{currentUser.username}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {currentUser.role}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn" 
            style={{ 
              padding: '0.35rem 0.6rem', 
              fontSize: '0.8rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--error)', 
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '4px'
            }}
          >
            <LogOut size={12} style={{ marginRight: '4px' }} /> Sign Out
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {health?.database === 'connected' ? (
            <span className="status-badge status-connected">
              <Database size={14} /> Connected
            </span>
          ) : (
            <span className="status-badge status-disconnected">
              <Database size={14} /> Offline
            </span>
          )}
          <button onClick={fetchRegistrations} className="btn" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: '#a7f3d0', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ==================== ROLE 1: PARTICIPANT VIEW ==================== */}
      {currentUser.role === 'participant' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {/* Registration form */}
          <section className="card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <UserPlus size={22} color="var(--primary)" />
              Workshop Registration Form
            </h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alice Smith"
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@example.com"
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Workshop *
                </label>
                <select
                  value={workshopTitle}
                  onChange={(e) => setWorkshopTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  {workshops.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Registration Details
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Why do you want to join this workshop?"
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? 'Registering...' : 'Register Now'}
              </button>
            </form>
          </section>

          {/* Registrations List (Read-Only) */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <BookOpen size={22} color="var(--accent)" />
              My Registration Statuses
            </h2>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><RefreshCw size={24} className="animate-spin" /></div>
            ) : registrations.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No registrations recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '550px' }}>
                {registrations.map(reg => (
                  <div key={reg.id} style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h4 style={{ color: '#fff', margin: 0 }}>{reg.name}</h4>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {getStatusBadge(reg.status)}
                        {getAttendanceBadge(reg.attendance)}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Workshop:</strong> {reg.workshop_title}</p>
                    {reg.registration_details && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>&ldquo;{reg.registration_details}&rdquo;</p>}
                    
                    {reg.organizer_notes && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(251, 146, 60, 0.05)', border: '1px dashed rgba(251, 146, 60, 0.2)', borderRadius: '4px', fontSize: '0.8rem', color: '#fed7aa' }}>
                        <strong>Organizer Note:</strong> {reg.organizer_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ==================== ROLE 2: ORGANIZER PORTAL ==================== */}
      {currentUser.role === 'organizer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Filters Bar */}
          <section className="card" style={{ padding: '1.25rem 2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Filter size={16} /> Filter Registrations
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Workshop Title</label>
                <select 
                  value={filterWorkshop} 
                  onChange={(e) => setFilterWorkshop(e.target.value)} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="all">All Workshops</option>
                  {workshops.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Registration Status</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Attendance</label>
                <select 
                  value={filterAttendance} 
                  onChange={(e) => setFilterAttendance(e.target.value)} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="all">All Attendance</option>
                  <option value="unmarked">Unmarked</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
          </section>

          {/* Registrations List (Editable Actions) */}
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', margin: 0 }}>
                <Users size={22} color="var(--primary)" />
                Management Dashboard
              </h2>
              <span style={{ fontSize: '0.875rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.6rem', borderRadius: '999px', color: 'var(--text-secondary)' }}>
                Showing {filteredRegistrations.length} of {registrations.length} total
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><RefreshCw size={24} className="animate-spin" /></div>
            ) : filteredRegistrations.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>
                <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>No registration records matched your active filters.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredRegistrations.map(reg => (
                  <div 
                    key={reg.id} 
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.01)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      opacity: updatingId === reg.id ? 0.7 : 1,
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    
                    {/* Header Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>{reg.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{reg.email}</p>
                        <p style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>
                          Workshop: {reg.workshop_title}
                        </p>
                        {reg.registration_details && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border-color)', fontStyle: 'italic' }}>
                            &ldquo;{reg.registration_details}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Control Panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '220px' }}>
                        
                        {/* Status Editor */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                            REGISTRATION STATUS
                          </label>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {['pending', 'confirmed', 'cancelled', 'waitlisted'].map(st => (
                              <button
                                key={st}
                                onClick={() => handleUpdateStatus(reg.id, st)}
                                className="btn"
                                style={{
                                  flex: 1,
                                  padding: '0.35rem 0.5rem',
                                  fontSize: '0.75rem',
                                  borderRadius: '4px',
                                  backgroundColor: reg.status === st 
                                    ? (st === 'confirmed' ? 'var(--success)' : st === 'cancelled' ? 'var(--error)' : st === 'waitlisted' ? 'var(--primary)' : 'var(--warning)')
                                    : 'rgba(255,255,255,0.03)',
                                  border: '1px solid ' + (reg.status === st ? 'transparent' : 'var(--border-color)'),
                                  color: reg.status === st ? '#fff' : 'var(--text-secondary)',
                                  cursor: 'pointer'
                                }}
                              >
                                {st === 'waitlisted' ? 'Waitlist' : st.charAt(0).toUpperCase() + st.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Attendance Editor */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                            ATTENDANCE
                          </label>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {['unmarked', 'present', 'absent'].map(att => (
                              <button
                                key={att}
                                onClick={() => handleUpdateAttendance(reg.id, att)}
                                className="btn"
                                style={{
                                  flex: 1,
                                  padding: '0.35rem 0.5rem',
                                  fontSize: '0.75rem',
                                  borderRadius: '4px',
                                  backgroundColor: reg.attendance === att 
                                    ? (att === 'present' ? 'var(--accent)' : att === 'absent' ? '#ef4444' : 'var(--bg-primary)')
                                    : 'rgba(255,255,255,0.03)',
                                  border: '1px solid ' + (reg.attendance === att ? 'transparent' : 'var(--border-color)'),
                                  color: reg.attendance === att ? '#fff' : 'var(--text-secondary)',
                                  cursor: 'pointer'
                                }}
                              >
                                {att.charAt(0).toUpperCase() + att.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Organizer Notes Section */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ORGANIZER NOTES</span>
                        {editingNoteId !== reg.id && (
                          <button 
                            onClick={() => {
                              setEditingNoteId(reg.id);
                              setTempNoteText(reg.organizer_notes || '');
                            }}
                            className="btn"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', color: 'var(--primary)', border: 'none' }}
                          >
                            <Edit2 size={12} /> Edit Note
                          </button>
                        )}
                      </div>

                      {editingNoteId === reg.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            value={tempNoteText}
                            onChange={(e) => setTempNoteText(e.target.value)}
                            placeholder="Add organizer-only notes..."
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                          />
                          <button onClick={() => handleSaveNote(reg.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '4px' }}>
                            Save
                          </button>
                          <button onClick={() => setEditingNoteId(null)} className="btn" style={{ padding: '0.5rem', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p style={{ 
                          fontSize: '0.85rem', 
                          color: reg.organizer_notes ? '#fed7aa' : 'var(--text-muted)', 
                          backgroundColor: reg.organizer_notes ? 'rgba(251, 146, 60, 0.03)' : 'transparent',
                          border: reg.organizer_notes ? '1px dashed rgba(251, 146, 60, 0.15)' : 'none',
                          padding: reg.organizer_notes ? '0.5rem 0.75rem' : '0',
                          borderRadius: '4px',
                          margin: 0
                        }}>
                          {reg.organizer_notes || 'No organizer notes recorded.'}
                        </p>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
