const pool = require('../config/db');

// Helper to map DB row to API response (snake_case to camelCase)
function mapBookingRow(row) {
  if (!row) return null;

  let formattedDate = row.booking_date;
  if (formattedDate instanceof Date) {
    const year = formattedDate.getFullYear();
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getDate()).padStart(2, '0');
    formattedDate = `${year}-${month}-${day}`;
  }

  return {
    id: row.id,
    roomName: row.room_name,
    bookingDate: formattedDate,
    startTime: row.start_time,
    endTime: row.end_time,
    purpose: row.purpose,
    requesterId: row.requester_id,
    requesterName: row.requester_name || null,
    status: row.status,
    coordinatorNote: row.coordinator_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const dbService = {
  // Get all users (prototype logins)
  async getUsers() {
    const [rows] = await pool.query('SELECT * FROM app_users');
    return rows;
  },

  // Get user by username
  async getUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM app_users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  // Get user by ID
  async getUserById(id) {
    const [rows] = await pool.query('SELECT * FROM app_users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Get all room bookings with filters
  async getAllBookings(filters = {}) {
    let query = `
      SELECT b.*, u.username as requester_name 
      FROM room_bookings b
      JOIN app_users u ON b.requester_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.roomName) {
      query += ' AND b.room_name LIKE ?';
      params.push(`%${filters.roomName}%`);
    }
    if (filters.bookingDate) {
      query += ' AND b.booking_date = ?';
      params.push(filters.bookingDate);
    }
    if (filters.status) {
      query += ' AND b.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY b.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows.map(mapBookingRow);
  },

  // Get room bookings for a specific staff member
  async getBookingsByRequester(requesterId, filters = {}) {
    let query = `
      SELECT b.*, u.username as requester_name 
      FROM room_bookings b
      JOIN app_users u ON b.requester_id = u.id
      WHERE b.requester_id = ?
    `;
    const params = [requesterId];

    if (filters.roomName) {
      query += ' AND b.room_name LIKE ?';
      params.push(`%${filters.roomName}%`);
    }
    if (filters.bookingDate) {
      query += ' AND b.booking_date = ?';
      params.push(filters.bookingDate);
    }
    if (filters.status) {
      query += ' AND b.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY b.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows.map(mapBookingRow);
  },

  // Get single booking by ID
  async getBookingById(id) {
    const query = `
      SELECT b.*, u.username as requester_name 
      FROM room_bookings b
      JOIN app_users u ON b.requester_id = u.id
      WHERE b.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return mapBookingRow(rows[0]) || null;
  },

  // Create room booking request
  async createBooking(bookingData) {
    const { roomName, bookingDate, startTime, endTime, purpose, requesterId } = bookingData;
    const query = `
      INSERT INTO room_bookings (room_name, booking_date, start_time, end_time, purpose, requester_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await pool.query(query, [roomName, bookingDate, startTime, endTime, purpose, requesterId]);
    return result.insertId;
  },

  // Update booking details (Allowed only for owner while pending)
  async updateBookingDetails(id, bookingData) {
    const { roomName, bookingDate, startTime, endTime, purpose } = bookingData;
    const query = `
      UPDATE room_bookings 
      SET room_name = ?, booking_date = ?, start_time = ?, end_time = ?, purpose = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [roomName, bookingDate, startTime, endTime, purpose, id]);
    return result.affectedRows > 0;
  },

  // Update booking status and note (Allowed only for coordinator)
  async updateBookingStatus(id, status, coordinatorNote) {
    const query = `
      UPDATE room_bookings 
      SET status = ?, coordinator_note = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [status, coordinatorNote || null, id]);
    return result.affectedRows > 0;
  },

  // Check for approved booking conflicts
  async checkConflict(roomName, bookingDate, startTime, endTime, excludeBookingId = null) {
    let query = `
      SELECT * FROM room_bookings
      WHERE room_name = ? 
        AND booking_date = ? 
        AND status = 'approved'
        AND (
          (start_time < ? AND end_time > ?)
        )
    `;
    const params = [roomName, bookingDate, endTime, startTime];

    if (excludeBookingId) {
      query += ' AND id != ?';
      params.push(excludeBookingId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }
};

module.exports = dbService;
