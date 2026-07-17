import { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  const [usernameInput, setUsernameInput] = useState('');
  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Book Form State (for Create / Edit)
  const [editingBook, setEditingBook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStatus, setFormStatus] = useState('Available');

  const categories = ['Fiction', 'Classic', 'Dystopian', 'Science', 'History', 'Biography'];

  useEffect(() => {
    if (token) {
      fetchBooks();
      if (currentUser?.role === 'librarian') {
        fetchReservations();
      }
    }
  }, [token, search, categoryFilter, statusFilter, currentUser]);

  const showToast = (message, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      showToast('Please enter a username.', true);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast(`Welcome back, ${data.user.username}!`);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      // Ignore network errors on logout
    }

    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setBooks([]);
    setReservations([]);
  };

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (categoryFilter) queryParams.append('category', categoryFilter);
      if (statusFilter) queryParams.append('availabilityStatus', statusFilter);

      const res = await fetch(`http://localhost:5000/api/books?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch books catalog.');
      }
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reservations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (err) {
      console.error('Failed to fetch reservations', err);
    }
  };

  // Form handlers
  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormTitle('');
    setFormAuthor('');
    setFormIsbn('');
    setFormCategory(categories[0]);
    setFormStatus('Available');
    setShowForm(true);
  };

  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormIsbn(book.isbn);
    setFormCategory(book.category);
    setFormStatus(book.availabilityStatus);
    setShowForm(true);
  };

  const handleSubmitBook = async (e) => {
    e.preventDefault();
    if (!formTitle || !formAuthor || !formIsbn || !formCategory) {
      showToast('Please fill in all required fields.', true);
      return;
    }

    const payload = {
      title: formTitle,
      author: formAuthor,
      isbn: formIsbn,
      category: formCategory,
      availabilityStatus: formStatus
    };

    const url = editingBook 
      ? `http://localhost:5000/api/books/${editingBook.id}`
      : 'http://localhost:5000/api/books';
    const method = editingBook ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save book record.');
      }

      showToast(editingBook ? 'Book details updated successfully!' : 'Book added successfully!');
      setShowForm(false);
      fetchBooks();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book record?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/books/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete book.');
      }
      showToast('Book record removed successfully.');
      fetchBooks();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleBorrowBook = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/books/${id}/borrow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to borrow book.');
      }
      showToast(`Book borrowed successfully!`);
      fetchBooks();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleReturnBook = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/books/${id}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to return book.');
      }
      showToast('Book returned successfully.');
      fetchBooks();
      if (currentUser?.role === 'librarian') {
        fetchReservations();
      }
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleReserveBook = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/books/${id}/reserve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reserve book.');
      }
      showToast('Book reserved successfully.');
      fetchBooks();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleFulfillReservation = async (resId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reservations/${resId}/fulfill`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fulfill reservation.');
      }
      showToast('Reservation marked as fulfilled.');
      fetchReservations();
      fetchBooks();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleCancelReservation = async (resId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reservations/${resId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel reservation.');
      }
      showToast('Reservation marked as cancelled.');
      fetchReservations();
      fetchBooks();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Render Login view if not authenticated
  if (!token) {
    return (
      <div style={{ fontFamily: 'var(--sans)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--code-bg)' }}>
        <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: 'var(--shadow)', width: '100%', maxWidth: '400px', border: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 0.5rem 0', textAlign: 'center' }}>Library Lending</h1>
          <p style={{ color: 'var(--text)', textAlign: 'center', marginBottom: '2rem', fontSize: '15px' }}>Sign in to access book lending</p>
          
          {error && (
            <div style={{ padding: '0.8rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1.2rem', fontSize: '14px', border: '1px solid #fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.4rem', fontSize: '14px', color: 'var(--text-h)' }}>Username</label>
              <input 
                type="text" 
                placeholder="e.g. member1"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '15px' }}
                required
              />
            </div>
            <button 
              type="submit" 
              style={{ padding: '0.75rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
            >
              Sign In
            </button>
          </form>

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.2rem' }}>
            <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--text-h)' }}>Seeded Workshop Accounts:</p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['librarian1', 'member1', 'member2'].map(name => (
                <button 
                  key={name}
                  onClick={() => setUsernameInput(name)}
                  style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--code-bg)', fontSize: '12px', cursor: 'pointer' }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard if authenticated
  return (
    <div style={{ fontFamily: 'var(--sans)', padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #fca5a5' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #86efac' }}>
          {success}
        </div>
      )}

      {/* Header with Active User & Logout */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px' }}>Library Lending System</h1>
          <p style={{ color: 'var(--text)', fontSize: '15px' }}>Signed in as: <strong>{currentUser?.username}</strong> ({currentUser?.role?.toUpperCase()})</p>
        </div>

        <button 
          onClick={handleLogout}
          style={{ padding: '0.5rem 1rem', border: '1px solid #b91c1c', color: '#b91c1c', background: 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Sign Out
        </button>
      </header>

      {/* Main Section */}
      <div style={{ display: 'grid', gridTemplateColumns: (showForm && currentUser?.role === 'librarian') ? '2fr 1fr' : '1fr', gap: '2rem' }}>
        
        {/* Books Listing */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>Book Catalog</h2>
            {currentUser?.role === 'librarian' && (
              <button 
                onClick={handleOpenAdd} 
                style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
              >
                + Add Book Record
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'var(--code-bg)', padding: '1rem', borderRadius: '8px' }}>
            <input 
              type="text" 
              placeholder="Search by Title, Author, or ISBN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
            
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', minWidth: '130px' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', minWidth: '130px' }}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Borrowed">Borrowed</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          {/* Book Catalog Table */}
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text)' }}>Loading books...</p>
          ) : books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text)', margin: 0 }}>No books matching the selected filters found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--code-bg)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem' }}>Title</th>
                    <th style={{ padding: '1rem' }}>Author</th>
                    <th style={{ padding: '1rem' }}>ISBN</th>
                    <th style={{ padding: '1rem' }}>Category</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(book => {
                    const isBorrowedByMe = book.borrowedMemberId === currentUser?.id;
                    const isReservedByMe = book.resMemberId === currentUser?.id;
                    return (
                      <tr key={book.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-h)' }}>{book.title}</td>
                        <td style={{ padding: '1rem' }}>{book.author}</td>
                        <td style={{ padding: '1rem', fontFamily: 'var(--mono)', fontSize: '14px' }}>{book.isbn}</td>
                        <td style={{ padding: '1rem' }}>{book.category}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '12px', 
                            fontSize: '13px', 
                            fontWeight: 'bold',
                            backgroundColor: book.availabilityStatus === 'Available' ? '#dcfce7' : book.availabilityStatus === 'Borrowed' ? '#fef3c7' : '#fee2e2',
                            color: book.availabilityStatus === 'Available' ? '#15803d' : book.availabilityStatus === 'Borrowed' ? '#b45309' : '#b91c1c'
                          }}>
                            {book.availabilityStatus}
                          </span>
                          {book.availabilityStatus === 'Borrowed' && (
                            <div style={{ fontSize: '11px', marginTop: '0.4rem', color: 'var(--text)' }}>
                              Borrowed by: <strong>{book.borrowedMemberName || `User #${book.borrowedMemberId}`}</strong><br/>
                              Due: <strong>{new Date(book.returnDate).toLocaleDateString()}</strong>
                            </div>
                          )}
                          {book.resMemberName && (
                            <div style={{ fontSize: '11px', marginTop: '0.2rem', color: 'var(--accent)' }}>
                              ★ Reserved by: <strong>{book.resMemberName}</strong>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {currentUser?.role === 'librarian' ? (
                              <>
                                <button 
                                  onClick={() => handleOpenEdit(book)}
                                  style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteBook(book.id)}
                                  disabled={book.availabilityStatus === 'Borrowed'}
                                  style={{ 
                                    padding: '0.4rem 0.8rem', 
                                    backgroundColor: '#fee2e2', 
                                    color: '#b91c1c', 
                                    border: '1px solid #fca5a5', 
                                    borderRadius: '4px', 
                                    cursor: book.availabilityStatus === 'Borrowed' ? 'not-allowed' : 'pointer',
                                    opacity: book.availabilityStatus === 'Borrowed' ? 0.6 : 1
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <>
                                {book.availabilityStatus === 'Available' && (
                                  <button 
                                    onClick={() => handleBorrowBook(book.id)}
                                    style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    Borrow
                                  </button>
                                )}
                                {book.availabilityStatus === 'Borrowed' && isBorrowedByMe && (
                                  <button 
                                    onClick={() => handleReturnBook(book.id)}
                                    style={{ padding: '0.4rem 0.8rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    Return
                                  </button>
                                )}
                                {book.availabilityStatus === 'Borrowed' && !isBorrowedByMe && !book.resMemberId && (
                                  <button 
                                    onClick={() => handleReserveBook(book.id)}
                                    style={{ padding: '0.4rem 0.8rem', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    Reserve
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Librarian Reservations Management Panel */}
          {currentUser?.role === 'librarian' && (
            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <h2>Active Reservations Queue</h2>
              {reservations.length === 0 ? (
                <p style={{ color: 'var(--text)' }}>No reservations currently placed.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--code-bg)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem' }}>Book Title</th>
                        <th style={{ padding: '1rem' }}>ISBN</th>
                        <th style={{ padding: '1rem' }}>Member</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map(res => (
                        <tr key={res.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem', fontWeight: '500' }}>{res.bookTitle}</td>
                          <td style={{ padding: '1rem', fontFamily: 'var(--mono)', fontSize: '14px' }}>{res.bookIsbn}</td>
                          <td style={{ padding: '1rem' }}>{res.memberName}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ 
                              padding: '0.25rem 0.6rem', 
                              borderRadius: '12px', 
                              fontSize: '13px', 
                              fontWeight: 'bold',
                              backgroundColor: res.status === 'Pending' ? '#fef3c7' : res.status === 'Fulfilled' ? '#dcfce7' : '#fee2e2',
                              color: res.status === 'Pending' ? '#b45309' : res.status === 'Fulfilled' ? '#15803d' : '#b91c1c'
                            }}>
                              {res.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {res.status === 'Pending' && (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => handleFulfillReservation(res.id)}
                                  style={{ padding: '0.4rem 0.8rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Fulfill
                                </button>
                                <button 
                                  onClick={() => handleCancelReservation(res.id)}
                                  style={{ padding: '0.4rem 0.8rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
            </div>
          )}
        </div>

        {/* Create / Edit Form Sidebar */}
        {showForm && currentUser?.role === 'librarian' && (
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', background: 'var(--code-bg)', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0 }}>{editingBook ? 'Edit Book Record' : 'Add Book Record'}</h3>
              <button 
                onClick={() => setShowForm(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmitBook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.3rem', fontSize: '14px' }}>Book Title *</label>
                <input 
                  type="text" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid var(--border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.3rem', fontSize: '14px' }}>Author *</label>
                <input 
                  type="text" 
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid var(--border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.3rem', fontSize: '14px' }}>ISBN *</label>
                <input 
                  type="text" 
                  value={formIsbn}
                  onChange={(e) => setFormIsbn(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid var(--border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.3rem', fontSize: '14px' }}>Category *</label>
                <select 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                  required
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {editingBook && (
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.3rem', fontSize: '14px' }}>Availability Status *</label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                    required
                  >
                    <option value="Available">Available</option>
                    <option value="Borrowed">Borrowed</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                style={{ padding: '0.6rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', marginTop: '0.5rem' }}
              >
                {editingBook ? 'Update Book' : 'Add Book'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
