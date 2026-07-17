import React, { useState, useEffect } from 'react';

function App() {
  // Authentication & Session State
  const [token, setToken] = useState(localStorage.getItem('lib_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('lib_user')) || null);
  
  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Books Catalog & Filters State
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Backend connection status
  const [dbStatus, setDbStatus] = useState({ status: 'Testing...', database: 'Unknown' });

  // Notifications
  const [alert, setAlert] = useState(null);

  // Form State (Librarian Add/Edit)
  const [editingBookId, setEditingBookId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStatus, setFormStatus] = useState('available');

  // Trigger loading catalog whenever filters or session changes
  useEffect(() => {
    fetchHealth();
    if (token) {
      fetchBooks();
    }
  }, [token, searchTitle, filterCategory, filterStatus]);

  const fetchHealth = () => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(() => setDbStatus({ status: 'Offline', database: 'Disconnected' }));
  };

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchBooks = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTitle) params.append('title', searchTitle);
    if (filterCategory) params.append('category', filterCategory);
    if (filterStatus) params.append('availabilityStatus', filterStatus);

    fetch(`/api/books?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          throw new Error('Session expired or unauthorized.');
        }
        if (!res.ok) throw new Error('Failed to fetch books from backend catalog.');
        return res.json();
      })
      .then(data => {
        setBooks(data);
        setLoading(false);
      })
      .catch(err => {
        triggerAlert('error', err.message);
        setLoading(false);
      });
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      triggerAlert('error', 'Username and password are required.');
      return;
    }

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUsername, password: loginPassword })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed.');
        return data;
      })
      .then(data => {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('lib_token', data.token);
        localStorage.setItem('lib_user', JSON.stringify(data.user));
        triggerAlert('success', `Welcome back, ${data.user.username}!`);
      })
      .catch(err => triggerAlert('error', err.message));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('lib_token');
    localStorage.removeItem('lib_user');
  };

  const resetForm = () => {
    setEditingBookId(null);
    setFormTitle('');
    setFormAuthor('');
    setFormIsbn('');
    setFormCategory('');
    setFormStatus('available');
  };

  // Handlers for Librarian Operations
  const handleSaveBook = (e) => {
    e.preventDefault();

    if (!formTitle || !formAuthor || !formIsbn || !formCategory) {
      triggerAlert('error', 'All fields are required.');
      return;
    }

    const payload = {
      title: formTitle,
      author: formAuthor,
      isbn: formIsbn,
      category: formCategory,
      availabilityStatus: formStatus
    };

    const url = editingBookId ? `/api/books/${editingBookId}` : '/api/books';
    const method = editingBookId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save book.');
        return data;
      })
      .then(() => {
        triggerAlert('success', `Book successfully ${editingBookId ? 'updated' : 'added'}!`);
        resetForm();
        fetchBooks();
      })
      .catch(err => triggerAlert('error', err.message));
  };

  const handleEditInit = (book) => {
    setEditingBookId(book.id);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormIsbn(book.isbn);
    setFormCategory(book.category);
    setFormStatus(book.availabilityStatus);
  };

  const handleDeleteBook = (id) => {
    if (!window.confirm('Are you sure you want to delete this book record?')) return;

    fetch(`/api/books/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete book.');
        return data;
      })
      .then(() => {
        triggerAlert('success', 'Book record successfully removed.');
        fetchBooks();
      })
      .catch(err => triggerAlert('error', err.message));
  };

  // Handlers for Member Operations
  const handleBorrowBook = (bookId) => {
    fetch(`/api/books/${bookId}/borrow`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to borrow book.');
        return data;
      })
      .then(() => {
        triggerAlert('success', 'Book successfully checked out!');
        fetchBooks();
      })
      .catch(err => triggerAlert('error', err.message));
  };

  const handleReturnBook = (bookId) => {
    fetch(`/api/books/${bookId}/return`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to return book.');
        return data;
      })
      .then(() => {
        triggerAlert('success', 'Book successfully returned.');
        fetchBooks();
      })
      .catch(err => triggerAlert('error', err.message));
  };

  // Reservation Actions
  const handleReserveBook = (bookId) => {
    fetch(`/api/books/${bookId}/reserve`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to reserve book.');
        return data;
      })
      .then(() => {
        triggerAlert('success', 'Reservation placed successfully!');
        fetchBooks();
      })
      .catch(err => triggerAlert('error', err.message));
  };

  const handleFulfillReservation = (bookId) => {
    fetch(`/api/books/${bookId}/reservation/fulfill`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fulfill reservation.');
        return data;
      })
      .then(() => {
        triggerAlert('success', 'Reservation fulfilled. Book checked out to reserving member.');
        fetchBooks();
      })
      .catch(err => triggerAlert('error', err.message));
  };

  const handleCancelReservation = (bookId) => {
    fetch(`/api/books/${bookId}/reservation/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to cancel reservation.');
        return data;
      })
      .then(() => {
        triggerAlert('success', 'Reservation cancelled successfully.');
        fetchBooks();
      })
      .catch(err => triggerAlert('error', err.message));
  };

  const categories = [...new Set(books.map(b => b.category))].filter(Boolean);

  // If not logged in, render Login Panel
  if (!token) {
    return (
      <div className="container" style={{ maxWidth: '450px', marginTop: '10vh' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Library Lending System</h1>
          <p className="subtitle">Sign in to manage catalog or borrow books</p>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <span>{alert.message}</span>
            <button className="alert-close" onClick={() => setAlert(null)}>&times;</button>
          </div>
        )}

        <div className="card">
          <h2 className="card-title">Sign In</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. librarian1 or member1"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="e.g. password123"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Login
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>Demo Accounts (password: password123):</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
              <li>Librarian: <code>librarian1</code></li>
              <li>Member 1: <code>member1</code></li>
              <li>Member 2: <code>member2</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Top Navbar */}
      <header>
        <div>
          <h1>Library Lending System</h1>
          <div className="subtitle">Logged in as {user.username} ({user.role})</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: dbStatus.status === 'OK' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: dbStatus.status === 'OK' ? 'var(--accent-success)' : 'var(--accent-danger)',
            border: `1px solid ${dbStatus.status === 'OK' ? 'var(--accent-success)' : 'var(--accent-danger)'}`
          }}>
            DB: {dbStatus.database === 'Connected' ? 'Connected' : 'Offline'}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Success/Error Alerts */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span>{alert.message}</span>
          <button className="alert-close" onClick={() => setAlert(null)}>&times;</button>
        </div>
      )}

      {/* Dynamic Workflow Dashboard */}
      {user.role === 'Librarian' ? (
        /* LIBRARIAN VIEW */
        <div className="dashboard-grid librarian">
          {/* Add/Edit Form */}
          <div className="card">
            <h2 className="card-title">
              {editingBookId ? 'Edit Book Record' : 'Add New Book'}
            </h2>
            <form onSubmit={handleSaveBook}>
              <div className="form-group">
                <label>Book Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  className="form-control"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  className="form-control"
                  value={formIsbn}
                  onChange={(e) => setFormIsbn(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Availability Status</label>
                <select
                  className="form-control"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingBookId ? 'Save Changes' : 'Create Record'}
                </button>
                {editingBookId && (
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Catalog Management Table */}
          <div className="card">
            <h2 className="card-title">Library Inventory Management</h2>

            {/* List filters */}
            <div className="filter-bar">
              <input
                type="text"
                className="form-control filter-search"
                placeholder="Search inventory by title..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
              />
              <select
                className="form-control"
                style={{ width: '180px' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                className="form-control"
                style={{ width: '160px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="borrowed">Borrowed</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading inventory records...</div>
            ) : books.length === 0 ? (
              <div className="empty-state">No books found matching search filters.</div>
            ) : (
              <div className="books-table-wrapper">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>Book Details</th>
                      <th>ISBN</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Lending State</th>
                      <th>Reservations</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map(book => (
                      <tr key={book.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{book.title}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            by {book.author}
                          </div>
                        </td>
                        <td>{book.isbn}</td>
                        <td>{book.category}</td>
                        <td>
                          <span className={`badge badge-${book.availabilityStatus}`}>
                            {book.availabilityStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {book.availabilityStatus === 'borrowed' ? (
                            <div>
                              <div>Member ID: {book.borrowedMember}</div>
                              <div>Due: {new Date(book.returnDate).toLocaleDateString()}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {book.reservationStatus === 'pending' ? (
                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--accent-color)' }}>
                              <div style={{ fontWeight: 600, color: 'var(--accent-color)' }}>Reserved (Member {book.reservedMember})</div>
                              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.4rem' }}>
                                <button className="btn btn-primary btn-sm" style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} onClick={() => handleFulfillReservation(book.id)}>
                                  Fulfill
                                </button>
                                <button className="btn btn-danger btn-sm" style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} onClick={() => handleCancelReservation(book.id)}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEditInit(book)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteBook(book.id)}
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
          </div>
        </div>
      ) : (
        /* MEMBER VIEW */
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">Search Book Catalog</h2>
            <div className="filter-bar">
              <input
                type="text"
                className="form-control filter-search"
                placeholder="Search catalog by title..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
              />
              <select
                className="form-control"
                style={{ width: '200px' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                className="form-control"
                style={{ width: '200px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="borrowed">Borrowed</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner">Loading available catalog...</div>
          ) : books.length === 0 ? (
            <div className="empty-state">No matching books found in the library.</div>
          ) : (
            <div className="books-grid">
              {books.map(book => {
                const isBorrowedByMe = book.availabilityStatus === 'borrowed' && book.borrowedMember === user.id;
                const isReservedByMe = book.reservationStatus === 'pending' && book.reservedMember === user.id;

                return (
                  <div key={book.id} className="card book-card">
                    <span
                      className={`badge badge-${book.availabilityStatus}`}
                      style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}
                    >
                      {book.availabilityStatus}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{book.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      by {book.author}
                    </p>

                    <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <strong>ISBN:</strong> {book.isbn}
                    </div>
                    <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                      <strong>Category:</strong> {book.category}
                    </div>

                    {book.reservationStatus === 'pending' && (
                      <div style={{
                        fontSize: '0.8rem',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid var(--accent-color)',
                        color: 'var(--accent-color)',
                        fontWeight: 600,
                        marginBottom: '1rem',
                        textAlign: 'center'
                      }}>
                        {isReservedByMe ? 'You have reserved this book' : `Reserved by Member ${book.reservedMember}`}
                      </div>
                    )}

                    <div className="book-card-meta">
                      {book.availabilityStatus === 'available' && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%' }}
                          onClick={() => handleBorrowBook(book.id)}
                        >
                          Borrow Book
                        </button>
                      )}

                      {book.availabilityStatus === 'borrowed' && isBorrowedByMe && (
                        <button
                          className="btn btn-danger"
                          style={{ width: '100%' }}
                          onClick={() => handleReturnBook(book.id)}
                        >
                          Return Book
                        </button>
                      )}

                      {book.availabilityStatus === 'borrowed' && !isBorrowedByMe && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ width: '100%', cursor: 'not-allowed' }}
                            disabled
                          >
                            Borrowed by Member {book.borrowedMember}
                          </button>
                          
                          {/* Reservation button logic */}
                          {!book.reservationStatus && (
                            <button
                              className="btn btn-primary"
                              style={{ width: '100%', background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}
                              onClick={() => handleReserveBook(book.id)}
                            >
                              Reserve Book
                            </button>
                          )}
                        </div>
                      )}

                      {book.availabilityStatus === 'unavailable' && (
                        <button
                          className="btn btn-secondary"
                          style={{ width: '100%', cursor: 'not-allowed' }}
                          disabled
                        >
                          Not Available
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
