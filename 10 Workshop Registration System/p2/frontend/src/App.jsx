import { useState, useEffect } from 'react';
import ParticipantRegistration from './pages/ParticipantRegistration';
import ParticipantStatus from './pages/ParticipantStatus';
import OrganizerLogin from './pages/OrganizerLogin';
import OrganizerDashboardPage from './pages/OrganizerDashboard';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('sessionToken') || '');
  const [role, setRole] = useState(localStorage.getItem('userRole') || '');
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    if (token) {
      if (role === 'organizer') {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('status');
      }
    } else {
      setCurrentPage('login');
    }
  }, [token, role]);

  const handleLoginSuccess = (userToken, userRole) => {
    localStorage.setItem('sessionToken', userToken);
    localStorage.setItem('userRole', userRole);
    setToken(userToken);
    setRole(userRole);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Failed to invalidate session on logout:', err.message);
    }
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userRole');
    setToken('');
    setRole('');
    setCurrentPage('login');
  };

  const renderPage = () => {
    if (!token) {
      return <OrganizerLogin onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentPage) {
      case 'register':
        return role === 'participant' ? <ParticipantRegistration /> : <OrganizerDashboardPage onLogout={handleLogout} />;
      case 'status':
        return role === 'participant' ? <ParticipantStatus /> : <OrganizerDashboardPage onLogout={handleLogout} />;
      case 'dashboard':
        return role === 'organizer' ? <OrganizerDashboardPage onLogout={handleLogout} /> : <ParticipantStatus />;
      default:
        return role === 'organizer' ? <OrganizerDashboardPage onLogout={handleLogout} /> : <ParticipantStatus />;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-text">Workshop Registration System</span>
        </div>
        <nav className="app-nav">
          {!token ? (
            <button 
              className={`nav-btn ${currentPage === 'login' ? 'active' : ''}`}
              onClick={() => setCurrentPage('login')}
            >
              Login Portal
            </button>
          ) : role === 'participant' ? (
            <>
              <button 
                className={`nav-btn ${currentPage === 'status' ? 'active' : ''}`}
                onClick={() => setCurrentPage('status')}
              >
                My Registrations
              </button>
              <button 
                className={`nav-btn ${currentPage === 'register' ? 'active' : ''}`}
                onClick={() => setCurrentPage('register')}
              >
                Register Workshop
              </button>
              <button className="nav-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button 
                className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                Organizer Dashboard
              </button>
              <button className="nav-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
