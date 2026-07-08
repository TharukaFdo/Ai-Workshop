const { pool } = require('../config/db');

/**
 * Get bookings with dynamic filtering
 * @param {object} filters - Contains requestedUser, equipmentName, bookingDate, status
 */
async function getBookings(filters = {}) {
  const { requestedUser, equipmentName, bookingDate, status } = filters;
  
  let sql = 'SELECT * FROM bookings WHERE 1=1';
  const params = [];

  if (requestedUser) {
    sql += ' AND requestedUser = ?';
    params.push(requestedUser);
  }

  if (equipmentName) {
    sql += ' AND equipmentName LIKE ?';
    params.push(`%${equipmentName}%`);
  }

  if (bookingDate) {
    sql += ' AND bookingDate = ?';
    params.push(bookingDate);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY createdAt DESC';

  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Get a specific booking by its ID
 * @param {number} id - The booking ID
 */
async function getBookingById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM bookings WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Create a new booking request
 * @param {object} bookingData - Contains equipmentName, requestedUser, requestedUserId, bookingDate, startTime, endTime, purpose
 */
async function createBooking(bookingData) {
  const {
    equipmentName,
    requestedUser,
    requestedUserId,
    bookingDate,
    startTime,
    endTime,
    purpose
  } = bookingData;

  const [result] = await pool.query(
    `INSERT INTO bookings (equipmentName, requestedUser, requestedUserId, bookingDate, startTime, endTime, purpose, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [equipmentName, requestedUser, requestedUserId || null, bookingDate, startTime, endTime, purpose]
  );

  return { id: result.insertId, ...bookingData, status: 'pending' };
}

/**
 * Update the details of a pending booking request (for Staff edits)
 * @param {number} id - Booking ID
 * @param {object} bookingData - Contains equipmentName, bookingDate, startTime, endTime, purpose
 */
async function updateBooking(id, bookingData) {
  const {
    equipmentName,
    bookingDate,
    startTime,
    endTime,
    purpose
  } = bookingData;

  await pool.query(
    `UPDATE bookings 
     SET equipmentName = ?, bookingDate = ?, startTime = ?, endTime = ?, purpose = ?
     WHERE id = ? AND status = 'pending'`,
    [equipmentName, bookingDate, startTime, endTime, purpose, id]
  );

  return getBookingById(id);
}

/**
 * Approve or reject a booking request (for Lab Assistant review)
 * @param {number} id - Booking ID
 * @param {string} status - 'approved' or 'rejected'
 * @param {string} assistantComment - Short comment explaining decision
 */
async function updateBookingStatus(id, status, assistantComment) {
  await pool.query(
    `UPDATE bookings 
     SET status = ?, assistantComment = ?
     WHERE id = ?`,
    [status, assistantComment || null, id]
  );

  return getBookingById(id);
}

/**
 * Delete a booking record (primarily used for test cleanup)
 * @param {number} id - Booking ID
 */
async function deleteBooking(id) {
  const [result] = await pool.query(
    'DELETE FROM bookings WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking
};
