const db = require('../config/db');

/**
 * Service handling database access and lending business logic for Books.
 */
class BookService {
  /**
   * Retrieves all books filtered by title, category, or availability status.
   */
  static async getAllBooks(filters = {}) {
    let sql = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (filters.title) {
      sql += ' AND title LIKE ?';
      params.push(`%${filters.title}%`);
    }

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.availabilityStatus) {
      sql += ' AND availabilityStatus = ?';
      params.push(filters.availabilityStatus);
    }

    sql += ' ORDER BY title ASC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  /**
   * Retrieves a single book by ID.
   */
  static async getBookById(id) {
    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Creates a new book record.
   */
  static async createBook(bookData) {
    const { title, author, isbn, category, availabilityStatus } = bookData;

    // Validation checks
    if (!title || !author || !isbn || !category) {
      throw new Error('Title, Author, ISBN, and Category are required.');
    }

    const status = availabilityStatus || 'available';
    if (!['available', 'borrowed', 'unavailable'].includes(status)) {
      throw new Error('Invalid availability status value.');
    }

    const [result] = await db.query(
      `INSERT INTO books (title, author, isbn, category, availabilityStatus)
       VALUES (?, ?, ?, ?, ?)`,
      [title, author, isbn, category, status]
    );

    return { id: result.insertId, ...bookData, availabilityStatus: status };
  }

  /**
   * Updates an existing book record.
   */
  static async updateBook(id, bookData) {
    const { title, author, isbn, category, availabilityStatus } = bookData;

    const book = await this.getBookById(id);
    if (!book) throw new Error('Book not found.');

    if (availabilityStatus && !['available', 'borrowed', 'unavailable'].includes(availabilityStatus)) {
      throw new Error('Invalid availability status value.');
    }

    const updatedTitle = title !== undefined ? title : book.title;
    const updatedAuthor = author !== undefined ? author : book.author;
    const updatedIsbn = isbn !== undefined ? isbn : book.isbn;
    const updatedCategory = category !== undefined ? category : book.category;
    const updatedStatus = availabilityStatus !== undefined ? availabilityStatus : book.availabilityStatus;

    if (!updatedTitle || !updatedAuthor || !updatedIsbn || !updatedCategory) {
      throw new Error('Title, Author, ISBN, and Category cannot be empty.');
    }

    if (updatedStatus === 'borrowed' && book.availabilityStatus !== 'borrowed') {
      throw new Error('Transitioning a book to borrowed status must be performed via the checkout workflow.');
    }

    let query = `
      UPDATE books 
      SET title = ?, author = ?, isbn = ?, category = ?, availabilityStatus = ?
    `;
    const queryParams = [updatedTitle, updatedAuthor, updatedIsbn, updatedCategory, updatedStatus];

    if (updatedStatus === 'available' || updatedStatus === 'unavailable') {
      query += `, borrowedMember = NULL, borrowedDate = NULL, returnDate = NULL`;
    }

    query += ` WHERE id = ?`;
    queryParams.push(id);

    await db.query(query, queryParams);

    return this.getBookById(id);
  }

  /**
   * Deletes a book record.
   */
  static async deleteBook(id) {
    const book = await this.getBookById(id);
    if (!book) throw new Error('Book not found.');

    if (book.availabilityStatus === 'borrowed') {
      throw new Error('Cannot delete a book that is currently borrowed.');
    }

    await db.query('DELETE FROM books WHERE id = ?', [id]);
    return { id, message: 'Book deleted successfully.' };
  }

  /**
   * Core lending action: Member borrows a book.
   */
  static async borrowBook(bookId, memberId) {
    // Implement transaction to prevent race conditions
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [books] = await conn.query(
        'SELECT * FROM books WHERE id = ? FOR UPDATE',
        [bookId]
      );
      const book = books[0];

      if (!book) throw new Error('Book not found.');
      if (book.availabilityStatus !== 'available') {
        throw new Error(`Book is not available for borrowing (Current status: ${book.availabilityStatus}).`);
      }

      const borrowedDate = new Date();
      const returnDate = new Date();
      returnDate.setDate(borrowedDate.getDate() + 14); // 14-day standard checkout period

      await conn.query(
        `UPDATE books 
         SET availabilityStatus = 'borrowed', borrowedMember = ?, borrowedDate = ?, returnDate = ?
         WHERE id = ?`,
        [memberId, borrowedDate, returnDate, bookId]
      );

      await conn.commit();
      return { bookId, memberId, borrowedDate, returnDate, status: 'borrowed' };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Core lending action: Member returns a book.
   */
  static async returnBook(bookId, memberId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [books] = await conn.query(
        'SELECT * FROM books WHERE id = ? FOR UPDATE',
        [bookId]
      );
      const book = books[0];

      if (!book) throw new Error('Book not found.');
      if (book.availabilityStatus !== 'borrowed') {
        throw new Error('Book is not currently borrowed.');
      }
      if (book.borrowedMember !== Number(memberId)) {
        throw new Error('You cannot return a book borrowed by another member.');
      }

      await conn.query(
        `UPDATE books 
         SET availabilityStatus = 'available', borrowedMember = NULL, borrowedDate = NULL, returnDate = NULL
         WHERE id = ?`,
        [bookId]
      );

      await conn.commit();
      return { bookId, status: 'available' };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Action: Member reserves a borrowed book.
   */
  static async reserveBook(bookId, memberId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [books] = await conn.query('SELECT * FROM books WHERE id = ? FOR UPDATE', [bookId]);
      const book = books[0];

      if (!book) throw new Error('Book not found.');
      if (book.availabilityStatus !== 'borrowed') {
        throw new Error('Only borrowed books can be reserved.');
      }
      if (book.reservedMember !== null && book.reservationStatus === 'pending') {
        throw new Error('This book already has a pending reservation.');
      }
      if (book.borrowedMember === Number(memberId)) {
        throw new Error('You cannot reserve a book that you have currently borrowed.');
      }

      await conn.query(
        `UPDATE books 
         SET reservedMember = ?, reservationStatus = 'pending'
         WHERE id = ?`,
        [memberId, bookId]
      );
      await conn.commit();
      return { bookId, reservedMember: memberId, reservationStatus: 'pending' };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Action: Librarian fulfills a reservation.
   */
  static async fulfillReservation(bookId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [books] = await conn.query('SELECT * FROM books WHERE id = ? FOR UPDATE', [bookId]);
      const book = books[0];

      if (!book) throw new Error('Book not found.');
      if (book.reservationStatus !== 'pending' || !book.reservedMember) {
        throw new Error('No pending reservation exists for this book.');
      }

      const borrowedDate = new Date();
      const returnDate = new Date();
      returnDate.setDate(borrowedDate.getDate() + 14);

      await conn.query(
        `UPDATE books 
         SET availabilityStatus = 'borrowed', borrowedMember = ?, borrowedDate = ?, returnDate = ?, 
             reservedMember = NULL, reservationStatus = NULL
         WHERE id = ?`,
        [book.reservedMember, borrowedDate, returnDate, bookId]
      );

      await conn.commit();
      return { bookId, status: 'borrowed', borrowedMember: book.reservedMember };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Action: Librarian cancels a reservation.
   */
  static async cancelReservation(bookId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [books] = await conn.query('SELECT * FROM books WHERE id = ? FOR UPDATE', [bookId]);
      const book = books[0];

      if (!book) throw new Error('Book not found.');
      if (book.reservationStatus !== 'pending') {
        throw new Error('No pending reservation exists for this book.');
      }

      await conn.query(
        `UPDATE books 
         SET reservedMember = NULL, reservationStatus = NULL
         WHERE id = ?`,
        [bookId]
      );

      await conn.commit();
      return { bookId, reservationStatus: null };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = BookService;
