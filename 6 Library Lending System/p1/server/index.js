const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Library Lending API is running' });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to authenticate user and resolve their role from MySQL
const authenticate = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId || !userRole) {
    return res.status(401).json({ error: 'Access denied: Authentication headers missing' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND role = ?', [userId, userRole]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Access denied: Invalid session or role configuration' });
    }
    req.user = rows[0]; // Set user info on request
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal server authorization error' });
  }
};

// Helper: validate and sanitize book details
const validateBookDetails = (title, author, isbn, category) => {
  const sanitizedTitle = (title || '').trim();
  const sanitizedAuthor = (author || '').trim();
  const sanitizedIsbn = (isbn || '').trim();
  const sanitizedCategory = (category || '').trim();

  if (!sanitizedTitle || !sanitizedAuthor || !sanitizedIsbn || !sanitizedCategory) {
    return { error: 'Title, author, isbn, and category cannot be empty or only spaces.' };
  }

  if (sanitizedTitle.length > 255 || sanitizedAuthor.length > 255 || sanitizedIsbn.length > 50 || sanitizedCategory.length > 100) {
    return { error: 'Input exceeds maximum allowed length limits.' };
  }

  const isbnCleaned = sanitizedIsbn.replace(/[\s-]/g, '');
  const isNumericOnly = /^\d+$/.test(isbnCleaned);
  if (!isNumericOnly || sanitizedIsbn.length < 10 || sanitizedIsbn.length > 17) {
    return { error: 'Invalid ISBN format. Must be numeric characters only (spaces/hyphens allowed), between 10 and 17 characters.' };
  }

  return {
    sanitized: {
      title: sanitizedTitle,
      author: sanitizedAuthor,
      isbn: sanitizedIsbn,
      category: sanitizedCategory
    }
  };
};

// GET all books (accessible by anyone logged in)
app.get('/api/books', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM books');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// POST new book (Librarian only)
app.post('/api/books', authenticate, async (req, res) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({ error: 'Forbidden: Only librarians can add books' });
  }

  const { title, author, isbn, category } = req.body;
  const validation = validateBookDetails(title, author, isbn, category);
  
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { title: sTitle, author: sAuthor, isbn: sIsbn, category: sCategory } = validation.sanitized;

  try {
    const [existing] = await db.query('SELECT id FROM books WHERE isbn = ?', [sIsbn]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A book with this ISBN already exists in the catalog.' });
    }

    const [result] = await db.query(
      'INSERT INTO books (title, author, isbn, category, status) VALUES (?, ?, ?, ?, "Available")',
      [sTitle, sAuthor, sIsbn, sCategory]
    );
    res.status(201).json({
      id: result.insertId,
      title: sTitle,
      author: sAuthor,
      isbn: sIsbn,
      category: sCategory,
      status: 'Available',
      borrowed_member: null,
      borrowed_date: null,
      return_date: null
    });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// PUT update book (Librarian only)
app.put('/api/books/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({ error: 'Forbidden: Only librarians can edit books' });
  }

  const { id } = req.params;
  const { title, author, isbn, category } = req.body;

  const validation = validateBookDetails(title, author, isbn, category);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { title: sTitle, author: sAuthor, isbn: sIsbn, category: sCategory } = validation.sanitized;

  try {
    const [existing] = await db.query('SELECT id FROM books WHERE isbn = ? AND id != ?', [sIsbn, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A book with this ISBN already exists in the catalog.' });
    }

    const [result] = await db.query(
      'UPDATE books SET title = ?, author = ?, isbn = ?, category = ? WHERE id = ?',
      [sTitle, sAuthor, sIsbn, sCategory, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ id: parseInt(id), title: sTitle, author: sAuthor, isbn: sIsbn, category: sCategory });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE book (Librarian only)
app.delete('/api/books/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({ error: 'Forbidden: Only librarians can delete books' });
  }

  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM books WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// POST borrow book (Member only)
app.post('/api/books/:id/borrow', authenticate, async (req, res) => {
  if (req.user.role !== 'member') {
    return res.status(403).json({ error: 'Forbidden: Only library members can borrow books' });
  }

  const { id } = req.params;
  const { memberName } = req.body;

  if (!memberName) {
    return res.status(400).json({ error: 'Member name is required to borrow a book' });
  }

  if (req.user.username !== memberName) {
    return res.status(403).json({ error: 'Forbidden: You cannot borrow books on behalf of other members' });
  }

  try {
    const [books] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = books[0];
    if (book.status !== 'Available') {
      return res.status(400).json({ error: 'Book is already borrowed' });
    }

    const borrowedDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(borrowedDate.getDate() + 14);

    const borrowedDateStr = borrowedDate.toISOString().split('T')[0];
    const returnDateStr = returnDate.toISOString().split('T')[0];

    await db.query(
      'UPDATE books SET status = "Borrowed", borrowed_member = ?, borrowed_date = ?, return_date = ? WHERE id = ?',
      [memberName, borrowedDateStr, returnDateStr, id]
    );

    res.json({
      id: book.id,
      status: 'Borrowed',
      borrowed_member: memberName,
      borrowed_date: borrowedDateStr,
      return_date: returnDateStr
    });
  } catch (error) {
    console.error('Error borrowing book:', error);
    res.status(500).json({ error: 'Failed to borrow book' });
  }
});

// POST return book (Member only)
app.post('/api/books/:id/return', authenticate, async (req, res) => {
  if (req.user.role !== 'member') {
    return res.status(403).json({ error: 'Forbidden: Only library members can return books' });
  }

  const { id } = req.params;
  const { memberName } = req.body;

  if (!memberName) {
    return res.status(400).json({ error: 'Member name is required to return a book' });
  }

  if (req.user.username !== memberName) {
    return res.status(403).json({ error: 'Forbidden: You cannot return books on behalf of other members' });
  }

  try {
    const [books] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = books[0];
    if (book.status !== 'Borrowed') {
      return res.status(400).json({ error: 'Book is already available' });
    }

    if (book.borrowed_member !== memberName) {
      return res.status(403).json({ error: 'Forbidden: You cannot return a book borrowed by another member' });
    }

    await db.query(
      'UPDATE books SET status = "Available", borrowed_member = NULL, borrowed_date = NULL, return_date = NULL WHERE id = ?',
      [id]
    );

    res.json({
      id: book.id,
      status: 'Available',
      borrowed_member: null,
      borrowed_date: null,
      return_date: null
    });
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ error: 'Failed to return book' });
  }
});

// ================= BOOK RESERVATIONS =================

// GET /api/reservations (accessible by logged-in users)
app.get('/api/reservations', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT r.*, b.title, b.author, b.isbn, b.status AS book_status 
      FROM reservations r 
      JOIN books b ON r.book_id = b.id
    `;
    let params = [];

    // Members should only see their own reservations, librarians see all
    if (req.user.role === 'member') {
      query += ' WHERE r.member_username = ?';
      params.push(req.user.username);
    }

    query += ' ORDER BY r.reserved_date DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// POST /api/books/:id/reserve (Member only)
app.post('/api/books/:id/reserve', authenticate, async (req, res) => {
  if (req.user.role !== 'member') {
    return res.status(403).json({ error: 'Forbidden: Only library members can reserve books' });
  }

  const { id } = req.params;
  const { memberName } = req.body;

  if (!memberName) {
    return res.status(400).json({ error: 'Member name is required to reserve a book' });
  }

  if (req.user.username !== memberName) {
    return res.status(403).json({ error: 'Forbidden: You cannot reserve books on behalf of other members' });
  }

  try {
    const [books] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = books[0];
    // Members can only reserve currently borrowed books
    if (book.status !== 'Borrowed') {
      return res.status(400).json({ error: 'Only borrowed books can be reserved. Please borrow it directly if available.' });
    }

    // A member cannot reserve a book they themselves have borrowed
    if (book.borrowed_member === memberName) {
      return res.status(400).json({ error: 'You already have this book borrowed.' });
    }

    // Check if user already has an active pending reservation for this book
    const [existing] = await db.query(
      'SELECT id FROM reservations WHERE book_id = ? AND member_username = ? AND status = "Pending"',
      [id, memberName]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have a pending reservation for this book.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [result] = await db.query(
      'INSERT INTO reservations (book_id, member_username, reserved_date, status) VALUES (?, ?, ?, "Pending")',
      [id, memberName, todayStr]
    );

    res.status(201).json({
      id: result.insertId,
      book_id: parseInt(id),
      member_username: memberName,
      reserved_date: todayStr,
      status: 'Pending',
      title: book.title,
      author: book.author
    });
  } catch (error) {
    console.error('Error placing reservation:', error);
    res.status(500).json({ error: 'Failed to reserve book' });
  }
});

// POST /api/reservations/:id/fulfill (Librarian only)
app.post('/api/reservations/:id/fulfill', authenticate, async (req, res) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({ error: 'Forbidden: Only librarians can fulfill reservations' });
  }

  const { id } = req.params;

  try {
    const [reservations] = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const resv = reservations[0];
    if (resv.status !== 'Pending') {
      return res.status(400).json({ error: `This reservation is already ${resv.status.toLowerCase()}` });
    }

    const borrowedDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(borrowedDate.getDate() + 14);

    const borrowedDateStr = borrowedDate.toISOString().split('T')[0];
    const returnDateStr = returnDate.toISOString().split('T')[0];

    // Fulfill: Update book checkout status to the reserver & mark reservation as Fulfilled
    await db.query(
      'UPDATE books SET status = "Borrowed", borrowed_member = ?, borrowed_date = ?, return_date = ? WHERE id = ?',
      [resv.member_username, borrowedDateStr, returnDateStr, resv.book_id]
    );

    await db.query('UPDATE reservations SET status = "Fulfilled" WHERE id = ?', [id]);

    res.json({
      id: parseInt(id),
      book_id: resv.book_id,
      member_username: resv.member_username,
      status: 'Fulfilled'
    });
  } catch (error) {
    console.error('Error fulfilling reservation:', error);
    res.status(500).json({ error: 'Failed to fulfill reservation' });
  }
});

// POST /api/reservations/:id/cancel (Librarian only)
app.post('/api/reservations/:id/cancel', authenticate, async (req, res) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({ error: 'Forbidden: Only librarians can cancel reservations' });
  }

  const { id } = req.params;

  try {
    const [reservations] = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const resv = reservations[0];
    if (resv.status !== 'Pending') {
      return res.status(400).json({ error: `This reservation is already ${resv.status.toLowerCase()}` });
    }

    await db.query('UPDATE reservations SET status = "Cancelled" WHERE id = ?', [id]);

    res.json({
      id: parseInt(id),
      book_id: resv.book_id,
      member_username: resv.member_username,
      status: 'Cancelled'
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
