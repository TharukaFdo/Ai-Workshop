import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Authentication State
  const [user, setUser] = useState(null); // stores { id, username, role }
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data State
  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Librarian Book Form State (Add / Edit)
  const [editingBookId, setEditingBookId] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Helper for requests
  const getAuthHeaders = () => {
    if (!user) return {};
    return {
      'x-user-id': user.id.toString(),
      'x-user-role': user.role
    };
  };

  // Fetch books from backend
  const fetchBooks = () => {
    if (!user) return;
    setLoading(true);
    fetch('http://localhost:5001/api/books', {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load books');
        return res.json();
      })
      .then(data => {
        setBooks(data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError('Connection failed. Verify that backend is running.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Fetch reservations
  const fetchReservations = () => {
    if (!user) return;
    fetch('http://localhost:5001/api/reservations', {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load reservations');
        return res.json();
      })
      .then(data => {
        setReservations(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchReservations();
    }
  }, [user]);

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanUsername = usernameInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError('Username and password are required.');
      return;
    }

    fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
        return res.json();
      })
      .then(userData => {
        setUser(userData);
        setUsernameInput('');
        setPasswordInput('');
      })
      .catch(err => {
        setLoginError(err.message || 'Login failed.');
      });
  };

  const handleLogout = () => {
    setUser(null);
    setBooks([]);
    setReservations([]);
    resetForm();
  };

  // Add / Edit Book
  const handleSaveBook = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    const cleanIsbn = isbn.trim();
    const cleanCategory = category.trim();

    if (!cleanTitle || !cleanAuthor || !cleanIsbn || !cleanCategory) {
      setFormError('All fields are required.');
      return;
    }

    const isbnCleaned = cleanIsbn.replace(/[\s-]/g, '');
    const isNumeric = /^\d+$/.test(isbnCleaned);
    if (!isNumeric || cleanIsbn.length < 10 || cleanIsbn.length > 17) {
      setFormError('Invalid ISBN format. Must be numeric digits only, between 10 and 17 characters.');
      return;
    }

    const url = editingBookId 
      ? `http://localhost:5001/api/books/${editingBookId}` 
      : 'http://localhost:5001/api/books';
    const method = editingBookId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        title: cleanTitle,
        author: cleanAuthor,
        isbn: cleanIsbn,
        category: cleanCategory
      })
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
        return res.json();
      })
      .then(savedBook => {
        if (editingBookId) {
          setBooks(prev => prev.map(b => b.id === editingBookId ? { ...b, ...savedBook } : b));
          setFormSuccess('Book updated successfully!');
        } else {
          setBooks(prev => [...prev, savedBook]);
          setFormSuccess('New book added successfully!');
        }
        resetForm();
        setTimeout(() => setFormSuccess(''), 3000);
      })
      .catch(err => {
        setFormError(err.message || 'Error occurred while saving.');
      });
  };

  const handleEditClick = (book) => {
    setEditingBookId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setCategory(book.category);
    setFormError('');
    setFormSuccess('');
  };

  const handleDeleteBook = (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    fetch(`http://localhost:5001/api/books/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
        setBooks(prev => prev.filter(b => b.id !== id));
        fetchReservations(); // Refresh reservations in case matching book is deleted
        if (editingBookId === id) resetForm();
      })
      .catch(err => {
        alert(err.message);
      });
  };

  const resetForm = () => {
    setEditingBookId(null);
    setTitle('');
    setAuthor('');
    setIsbn('');
    setCategory('');
  };

  // Member Action: Borrow
  const handleBorrow = (id) => {
    fetch(`http://localhost:5001/api/books/${id}/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ memberName: user.username })
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
        return res.json();
      })
      .then(updatedBook => {
        setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updatedBook } : b));
      })
      .catch(err => {
        alert(err.message);
      });
  };

  // Member Action: Return
  const handleReturn = (id) => {
    fetch(`http://localhost:5001/api/books/${id}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ memberName: user.username })
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
        return res.json();
      })
      .then(updatedBook => {
        setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updatedBook } : b));
      })
      .catch(err => {
        alert(err.message);
      });
  };

  // Member Action: Reserve Book
  const handleReserve = (id) => {
    fetch(`http://localhost:5001/api/books/${id}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ memberName: user.username })
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
        return res.json();
      })
      .then(() => {
        alert('Reservation placed successfully!');
        fetchReservations();
      })
      .catch(err => {
        alert(err.message);
      });
  };

  // Librarian Action: Fulfill Reservation
  const handleFulfillReservation = (id) => {
    fetch(`http://localhost:5001/api/reservations/${id}/fulfill`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
        return res.json();
      })
      .then(() => {
        alert('Reservation marked as fulfilled.');
        fetchBooks();
        fetchReservations();
      })
      .catch(err => {
        alert(err.message);
      });
  };

  // Librarian Action: Cancel Reservation
  const handleCancelReservation = (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    fetch(`http://localhost:5001/api/reservations/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
        return res.json();
      })
      .then(() => {
        alert('Reservation marked as cancelled.');
        fetchReservations();
      })
      .catch(err => {
        alert(err.message);
      });
  };

  // Filter & Search
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery);

    const matchesCategory = selectedCategory === '' || book.category === selectedCategory;

    const matchesAvailability = 
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && book.status === 'Available') ||
      (availabilityFilter === 'borrowed' && book.status === 'Borrowed');

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const categories = [...new Set(books.map(b => b.category))].filter(Boolean);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // 1. Render Login Form
  if (!user) {
    return (
      <div style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#f8fafc',
        backgroundColor: '#0f172a',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid #334155'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '3rem' }}>📚</span>
            <h1 id="app-title" style={{ fontSize: '1.8rem', fontWeight: 800, margin: '1rem 0 0.5rem 0', color: '#f8fafc' }}>
              LendFlow Portal
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              Library Lending Credentials Gateway
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="username-input" style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>Username</label>
              <input
                id="username-input"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username"
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#f8fafc',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="password-input" style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>Password</label>
              <input
                id="password-input"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#f8fafc',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            {loginError && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>{loginError}</p>
            )}

            <button
              id="login-btn"
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.8rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                marginTop: '0.5rem'
              }}
            >
              Sign In
            </button>
          </form>

          {/* Test credentials helper */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #334155',
            fontSize: '0.8rem',
            color: '#94a3b8'
          }}>
            <p style={{ fontWeight: 600, color: '#cbd5e1', marginTop: 0, marginBottom: '0.5rem' }}>Demo Accounts (MySQL Backed):</p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Librarian: <strong>librarian1</strong> / <code>lib123</code></li>
              <li>Member A: <strong>alice</strong> / <code>alice123</code></li>
              <li>Member B: <strong>bob</strong> / <code>bob123</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Main Application (Authenticated)
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#f8fafc',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Navbar Dashboard */}
      <nav style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📖</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            LendFlow Portal
          </span>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>{user.username}</div>
            <div style={{
              fontSize: '0.75rem',
              color: user.role === 'librarian' ? '#f59e0b' : '#3b82f6',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {user.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem max(1rem, calc((100vw - 1200px) / 2))' }}>
        
        {/* Global Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error} <button onClick={fetchBooks} style={{ marginLeft: '1rem', background: 'none', border: 'underline', color: '#60a5fa', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* ================= MEMBER VIEW ================= */}
        {user.role === 'member' && (
          <div>
            {/* Search and Filters */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              <input
                id="search-filter-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                style={{
                  flex: 1,
                  minWidth: '250px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#f8fafc',
                  outline: 'none'
                }}
              />
              
              <select
                id="category-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#f8fafc',
                  outline: 'none'
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                id="availability-filter-select"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#f8fafc',
                  outline: 'none'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available Only</option>
                <option value="borrowed">Borrowed Only</option>
              </select>
            </div>

            {/* Catalog Grid */}
            {loading ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading library catalog...</p>
            ) : filteredBooks.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No books match your criteria.</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredBooks.map(book => {
                  const isBorrowedByMe = book.status === 'Borrowed' && book.borrowed_member === user.username;
                  const isReservedByMe = reservations.some(r => r.book_id === book.id && r.status === 'Pending');

                  return (
                    <div key={book.id} style={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #334155',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <span style={{
                          backgroundColor: '#3b82f620',
                          color: '#60a5fa',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-block',
                          marginBottom: '0.75rem'
                        }}>
                          {book.category}
                        </span>

                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700 }}>
                          {book.title}
                        </h3>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1', fontSize: '0.9rem' }}>
                          by {book.author}
                        </p>
                        <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          ISBN: {book.isbn}
                        </p>
                      </div>

                      <div style={{
                        marginTop: '1rem',
                        borderTop: '1px solid #334155',
                        paddingTop: '1rem'
                      }}>
                        {book.status === 'Available' ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>🟢 Available</span>
                            <button
                              onClick={() => handleBorrow(book.id)}
                              style={{
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Borrow
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>🔴 Borrowed</span>
                              {isBorrowedByMe ? (
                                <button
                                  onClick={() => handleReturn(book.id)}
                                  style={{
                                    backgroundColor: '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Return
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReserve(book.id)}
                                  disabled={isReservedByMe}
                                  style={{
                                    backgroundColor: isReservedByMe ? '#475569' : '#d97706',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: isReservedByMe ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {isReservedByMe ? 'Reserved' : 'Reserve'}
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              <p style={{ margin: '0.25rem 0' }}>Borrowed by: <strong>{book.borrowed_member}</strong></p>
                              <p style={{ margin: '0.25rem 0' }}>Due Date: <strong>{formatDate(book.return_date)}</strong></p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* My Reservations Queue */}
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #334155',
              marginTop: '3rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem', color: '#f1f5f9' }}>
                My Reservations
              </h2>
              {reservations.length === 0 ? (
                <p style={{ color: '#94a3b8', margin: 0 }}>You have no reservations active.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.875rem' }}>
                        <th style={{ padding: '0.75rem' }}>Book Title</th>
                        <th style={{ padding: '0.75rem' }}>Author</th>
                        <th style={{ padding: '0.75rem' }}>Reserved Date</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map(resv => (
                        <tr key={resv.id} style={{ borderBottom: '1px solid #334155', fontSize: '0.9rem' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 500, color: '#f8fafc' }}>{resv.title}</td>
                          <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{resv.author}</td>
                          <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{formatDate(resv.reserved_date)}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              color: resv.status === 'Pending' ? '#fbbf24' : resv.status === 'Fulfilled' ? '#34d399' : '#f87171',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}>
                              {resv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= LIBRARIAN VIEW ================= */}
        {user.role === 'librarian' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Top Grid: Add Book & Inventory */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '2rem',
              alignItems: 'start',
              flexWrap: 'wrap'
            }}>
              {/* Left: Manage Form */}
              <section style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #334155'
              }}>
                <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem', color: '#f1f5f9' }}>
                  {editingBookId ? '📝 Edit Book Details' : '➕ Add Book to Inventory'}
                </h2>
                
                <form onSubmit={handleSaveBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="lib-title-input" style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Title</label>
                    <input
                      id="lib-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Book Title"
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        color: '#f8fafc',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="lib-author-input" style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Author</label>
                    <input
                      id="lib-author-input"
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Author Name"
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        color: '#f8fafc',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="lib-isbn-input" style={{ fontSize: '0.875rem', color: '#94a3b8' }}>ISBN</label>
                    <input
                      id="lib-isbn-input"
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="ISBN Identifier"
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        color: '#f8fafc',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="lib-category-select" style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Category</label>
                    <select
                      id="lib-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        color: '#f8fafc',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select Category</option>
                      <option value="Fiction">Fiction</option>
                      <option value="Science">Science</option>
                      <option value="Technology">Technology</option>
                      <option value="Biography">Biography</option>
                    </select>
                  </div>

                  {formError && (
                    <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{formError}</p>
                  )}

                  {formSuccess && (
                    <p style={{ color: '#34d399', fontSize: '0.875rem', margin: 0 }}>{formSuccess}</p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      id="lib-save-btn"
                      type="submit"
                      style={{
                        flex: 1,
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {editingBookId ? 'Update Book' : 'Add Book'}
                    </button>
                    {editingBookId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #475569',
                          color: '#cbd5e1',
                          borderRadius: '6px',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </section>

              {/* Right: Inventory Management Table */}
              <section style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #334155'
              }}>
                <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem', color: '#f1f5f9' }}>
                  Inventory Management
                </h2>

                {loading ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading books...</p>
                ) : books.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center' }}>No books in database.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.875rem' }}>
                          <th style={{ padding: '0.75rem' }}>Title/Author</th>
                          <th style={{ padding: '0.75rem' }}>ISBN</th>
                          <th style={{ padding: '0.75rem' }}>Category</th>
                          <th style={{ padding: '0.75rem' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map(book => (
                          <tr key={book.id} style={{ borderBottom: '1px solid #334155', fontSize: '0.95rem' }}>
                            <td style={{ padding: '1rem 0.75rem' }}>
                              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{book.title}</div>
                              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>by {book.author}</div>
                            </td>
                            <td style={{ padding: '1rem 0.75rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
                              {book.isbn}
                            </td>
                            <td style={{ padding: '1rem 0.75rem' }}>
                              <span style={{
                                backgroundColor: '#0f172a',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                color: '#38bdf8'
                              }}>
                                {book.category}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 0.75rem' }}>
                              <span style={{
                                color: book.status === 'Available' ? '#34d399' : '#fca5a5',
                                fontSize: '0.85rem',
                                fontWeight: 600
                              }}>
                                {book.status}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleEditClick(book)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #fbbf24',
                                    color: '#fbbf24',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteBook(book.id)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #ef4444',
                                    color: '#ef4444',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            {/* Bottom Section: Reservations Queue Management */}
            <section style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #334155'
            }}>
              <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem', color: '#f1f5f9' }}>
                Reservations Management Queue
              </h2>
              {reservations.length === 0 ? (
                <p style={{ color: '#94a3b8', margin: 0 }}>No reservations have been placed yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.875rem' }}>
                        <th style={{ padding: '0.75rem' }}>Book Title</th>
                        <th style={{ padding: '0.75rem' }}>Reserving Member</th>
                        <th style={{ padding: '0.75rem' }}>Reserved Date</th>
                        <th style={{ padding: '0.75rem' }}>Current Book Status</th>
                        <th style={{ padding: '0.75rem' }}>Reservation Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map(resv => (
                        <tr key={resv.id} style={{ borderBottom: '1px solid #334155', fontSize: '0.9rem' }}>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{resv.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ISBN: {resv.isbn}</div>
                          </td>
                          <td style={{ padding: '1rem 0.75rem', color: '#cbd5e1' }}>{resv.member_username}</td>
                          <td style={{ padding: '1rem 0.75rem', color: '#94a3b8' }}>{formatDate(resv.reserved_date)}</td>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{
                              color: resv.book_status === 'Available' ? '#34d399' : '#fca5a5',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}>
                              {resv.book_status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{
                              color: resv.status === 'Pending' ? '#fbbf24' : resv.status === 'Fulfilled' ? '#34d399' : '#f87171',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}>
                              {resv.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                            {resv.status === 'Pending' && (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleFulfillReservation(resv.id)}
                                  style={{
                                    backgroundColor: '#065f46',
                                    border: 'none',
                                    color: '#34d399',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Fulfill
                                </button>
                                <button
                                  onClick={() => handleCancelReservation(resv.id)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #ef4444',
                                    color: '#fca5a5',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        )}

      </main>
    </div>
  )
}

export default App
