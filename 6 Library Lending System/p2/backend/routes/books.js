const express = require('express');
const db = require('../db');
const { requireAuth, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

// Retrieve books with search & filter parameters
router.get('/books', async (req, res) => {
  try {
    let query = `
      SELECT b.*, u.username AS borrowedMemberName,
             r.id AS reservationId, r.memberId AS resMemberId, ru.username AS resMemberName
      FROM books b 
      LEFT JOIN users u ON b.borrowedMemberId = u.id
      LEFT JOIN reservations r ON r.bookId = b.id AND r.status = 'Pending'
      LEFT JOIN users ru ON r.memberId = ru.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.search) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
      const searchVal = `%${req.query.search}%`;
      params.push(searchVal, searchVal, searchVal);
    }
    if (req.query.category) {
      query += ` AND b.category = ?`;
      params.push(req.query.category);
    }
    if (req.query.availabilityStatus) {
      query += ` AND b.availabilityStatus = ?`;
      params.push(req.query.availabilityStatus);
    }

    query += ' ORDER BY b.id DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new book (Protected: Librarian only)
router.post('/books', requireAuth, requireLibrarian, async (req, res) => {
  const { title, author, isbn, category } = req.body;
  if (!title || !author || !isbn || !category) {
    return res.status(400).json({ error: 'Title, author, isbn, and category are required.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A book with this ISBN already exists.' });
    }

    const [result] = await db.query(
      'INSERT INTO books (title, author, isbn, category, availabilityStatus) VALUES (?, ?, ?, ?, "Available")',
      [title, author, isbn, category]
    );
    res.status(201).json({ id: result.insertId, title, author, isbn, category, availabilityStatus: 'Available' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit existing book details (Protected: Librarian only)
router.put('/books/:id', requireAuth, requireLibrarian, async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, category, availabilityStatus } = req.body;

  if (!title || !author || !isbn || !category) {
    return res.status(400).json({ error: 'Title, author, isbn, and category are required.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM books WHERE isbn = ? AND id != ?', [isbn, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Another book already uses this ISBN.' });
    }

    await db.query(
      'UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, availabilityStatus = ? WHERE id = ?',
      [title, author, isbn, category, availabilityStatus || 'Available', id]
    );
    res.json({ id, title, author, isbn, category, availabilityStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete book record (Protected: Librarian only)
router.delete('/books/:id', requireAuth, requireLibrarian, async (req, res) => {
  const { id } = req.params;

  try {
    const [book] = await db.query('SELECT availabilityStatus FROM books WHERE id = ?', [id]);
    if (book.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book[0].availabilityStatus === 'Borrowed') {
      return res.status(400).json({ error: 'Cannot delete a book that is currently borrowed.' });
    }

    await db.query('DELETE FROM books WHERE id = ?', [id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrow a book (Protected: Member only)
router.post('/books/:id/borrow', requireAuth, async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (user.role !== 'member') {
    return res.status(403).json({ error: 'Only members can borrow books.' });
  }

  try {
    const [book] = await db.query('SELECT availabilityStatus FROM books WHERE id = ?', [id]);
    if (book.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book[0].availabilityStatus !== 'Available') {
      return res.status(400).json({ error: 'Book is not available for borrowing.' });
    }

    const borrowedDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(borrowedDate.getDate() + 14);

    await db.query(
      'UPDATE books SET availabilityStatus = "Borrowed", borrowedMemberId = ?, borrowedDate = ?, returnDate = ? WHERE id = ?',
      [user.id, borrowedDate, returnDate, id]
    );

    res.json({ message: 'Book borrowed successfully', returnDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return a book (Protected: Librarian or borrowing Member only)
router.post('/books/:id/return', requireAuth, async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const [book] = await db.query('SELECT borrowedMemberId, availabilityStatus FROM books WHERE id = ?', [id]);
    if (book.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book[0].availabilityStatus !== 'Borrowed') {
      return res.status(400).json({ error: 'Book is not currently borrowed.' });
    }

    // Verify ownership or check if Librarian
    if (user.role !== 'librarian' && book[0].borrowedMemberId !== user.id) {
      return res.status(403).json({ error: 'Access denied. You can only return books you borrowed.' });
    }

    await db.query(
      'UPDATE books SET availabilityStatus = "Available", borrowedMemberId = NULL, borrowedDate = NULL, returnDate = NULL WHERE id = ?',
      [id]
    );

    res.json({ message: 'Book returned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reserve a book (Protected: Member only)
router.post('/books/:id/reserve', requireAuth, async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (user.role !== 'member') {
    return res.status(403).json({ error: 'Only members can reserve books.' });
  }

  try {
    const [book] = await db.query('SELECT availabilityStatus FROM books WHERE id = ?', [id]);
    if (book.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Reservation is allowed only for currently borrowed books
    if (book[0].availabilityStatus !== 'Borrowed') {
      return res.status(400).json({ error: 'Reservations are only allowed on currently borrowed books.' });
    }

    // Check if there is already a pending reservation by this user on this book
    const [existing] = await db.query(
      'SELECT id FROM reservations WHERE bookId = ? AND memberId = ? AND status = "Pending"',
      [id, user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reserved this book.' });
    }

    await db.query(
      'INSERT INTO reservations (bookId, memberId, status) VALUES (?, ?, "Pending")',
      [id, user.id]
    );

    res.json({ message: 'Book reserved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List reservations (Protected: Librarian only)
router.get('/reservations', requireAuth, requireLibrarian, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, b.title AS bookTitle, b.isbn AS bookIsbn, u.username AS memberName
      FROM reservations r
      JOIN books b ON r.bookId = b.id
      JOIN users u ON r.memberId = u.id
      ORDER BY r.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fulfill a reservation (Protected: Librarian only)
router.post('/reservations/:id/fulfill', requireAuth, requireLibrarian, async (req, res) => {
  const { id } = req.params;

  try {
    const [reservation] = await db.query('SELECT status, bookId FROM reservations WHERE id = ?', [id]);
    if (reservation.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    if (reservation[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending reservations can be fulfilled.' });
    }

    // Fulfilling updates reservation status to 'Fulfilled'
    await db.query('UPDATE reservations SET status = "Fulfilled" WHERE id = ?', [id]);
    res.json({ message: 'Reservation marked as fulfilled successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel a reservation (Protected: Librarian only)
router.post('/reservations/:id/cancel', requireAuth, requireLibrarian, async (req, res) => {
  const { id } = req.params;

  try {
    const [reservation] = await db.query('SELECT status FROM reservations WHERE id = ?', [id]);
    if (reservation.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    if (reservation[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending reservations can be cancelled.' });
    }

    await db.query('UPDATE reservations SET status = "Cancelled" WHERE id = ?', [id]);
    res.json({ message: 'Reservation marked as cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
