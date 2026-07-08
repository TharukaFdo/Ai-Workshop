const db = require('../config/db');

/**
 * Get all appointments with optional filters (doctorName, appointmentDate, status)
 */
async function getAllAppointments(filters = {}) {
  let query = 'SELECT * FROM appointments WHERE 1=1';
  const queryParams = [];

  if (filters.doctorName) {
    query += ' AND doctorName = ?';
    queryParams.push(filters.doctorName);
  }

  if (filters.appointmentDate) {
    query += ' AND appointmentDate = ?';
    queryParams.push(filters.appointmentDate);
  }

  if (filters.status) {
    query += ' AND status = ?';
    queryParams.push(filters.status);
  }

  // Sort chronologically
  query += ' ORDER BY appointmentDate ASC, appointmentTime ASC';

  const [rows] = await db.query(query, queryParams);
  return rows;
}

/**
 * Get a single appointment by ID
 */
async function getAppointmentById(id) {
  const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Create a new appointment
 */
async function createAppointment(data) {
  const { patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason } = data;
  
  const query = `
    INSERT INTO appointments (patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;
  const [result] = await db.query(query, [
    patientName,
    patientPhone || null,
    doctorName,
    appointmentDate,
    appointmentTime,
    reason
  ]);

  return { id: result.insertId, ...data, status: 'pending' };
}

/**
 * Update core booking details (date, time, doctor, reason, patient details)
 * Allowed if status is pending or accepted
 */
async function updateAppointmentBooking(id, data) {
  const { patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason } = data;
  
  const query = `
    UPDATE appointments 
    SET patientName = ?, patientPhone = ?, doctorName = ?, appointmentDate = ?, appointmentTime = ?, reason = ?
    WHERE id = ? AND status IN ('pending', 'accepted')
  `;
  const [result] = await db.query(query, [
    patientName,
    patientPhone || null,
    doctorName,
    appointmentDate,
    appointmentTime,
    reason,
    id
  ]);

  return result.affectedRows > 0;
}

/**
 * Update visit notes and status (Doctor action)
 * Only allowed for 'accepted' appointments (only accepted are confirmed!)
 */
async function updateAppointmentNotes(id, visitNote, status) {
  const query = `
    UPDATE appointments 
    SET visitNote = ?, status = ?
    WHERE id = ? AND status = 'accepted'
  `;
  const [result] = await db.query(query, [visitNote, status, id]);
  return result.affectedRows > 0;
}

/**
 * Cancel an appointment
 * Allowed if status is pending or accepted
 */
async function cancelAppointment(id) {
  const query = `
    UPDATE appointments 
    SET status = 'cancelled'
    WHERE id = ? AND status IN ('pending', 'accepted')
  `;
  const [result] = await db.query(query, [id]);
  return result.affectedRows > 0;
}

/**
 * Accept a pending appointment (Doctor action)
 */
async function acceptAppointment(id) {
  const query = `
    UPDATE appointments 
    SET status = 'accepted'
    WHERE id = ? AND status = 'pending'
  `;
  const [result] = await db.query(query, [id]);
  return result.affectedRows > 0;
}

/**
 * Reject a pending appointment (Doctor action)
 */
async function rejectAppointment(id) {
  const query = `
    UPDATE appointments 
    SET status = 'rejected'
    WHERE id = ? AND status = 'pending'
  `;
  const [result] = await db.query(query, [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentBooking,
  updateAppointmentNotes,
  cancelAppointment,
  acceptAppointment,
  rejectAppointment
};
