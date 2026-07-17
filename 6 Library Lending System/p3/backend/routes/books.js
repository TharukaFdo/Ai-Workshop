const express = require('express');
const router = express.Router();
const BookService = require('../services/bookService');
const { authenticate, requireLibrarian, requireMember } = require('../middleware/auth');

/**
 * GET /api/books
 * Retrieves catalog books, optionally filtered. (Allowed for any authenticated user)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { title, category, availabilityStatus } = req.query;
    const books = await BookService.getAllBooks({ title, category, availabilityStatus });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/books/:id
 * Retrieves a single book by ID.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const book = await BookService.getBookById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/books
 * Create a new book (Librarian only).
 */
router.post('/', authenticate, requireLibrarian, async (req, res) => {
  try {
    const book = await BookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PUT /api/books/:id
 * Update an existing book (Librarian only).
 */
router.put('/:id', authenticate, requireLibrarian, async (req, res) => {
  try {
    const book = await BookService.updateBook(req.params.id, req.body);
    res.json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE /api/books/:id
 * Remove a book from catalog (Librarian only).
 */
router.delete('/:id', authenticate, requireLibrarian, async (req, res) => {
  try {
    const result = await BookService.deleteBook(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * POST /api/books/:id/borrow
 * Borrow a book (Member only).
 */
router.post('/:id/borrow', authenticate, requireMember, async (req, res) => {
  try {
    // Crucial: Use req.user.id loaded securely from the DB-backed token
    const memberId = req.user.id;
    const result = await BookService.borrowBook(req.params.id, memberId);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not available')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * POST /api/books/:id/return
 * Return a book (Member only).
 */
router.post('/:id/return', authenticate, requireMember, async (req, res) => {
  try {
    // Crucial: Use req.user.id loaded securely from the DB-backed token
    const memberId = req.user.id;
    const result = await BookService.returnBook(req.params.id, memberId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * POST /api/books/:id/reserve
 * Reserve a borrowed book (Member only).
 */
router.post('/:id/reserve', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.id;
    const result = await BookService.reserveBook(req.params.id, memberId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * POST /api/books/:id/reservation/fulfill
 * Fulfill a reservation (Librarian only).
 */
router.post('/:id/reservation/fulfill', authenticate, requireLibrarian, async (req, res) => {
  try {
    const result = await BookService.fulfillReservation(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * POST /api/books/:id/reservation/cancel
 * Cancel a reservation (Librarian only).
 */
router.post('/:id/reservation/cancel', authenticate, requireLibrarian, async (req, res) => {
  try {
    const result = await BookService.cancelReservation(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
