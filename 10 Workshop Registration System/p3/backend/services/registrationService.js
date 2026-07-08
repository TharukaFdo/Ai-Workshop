const pool = require('../config/db');

/**
 * Service/Data Access Layer for Registration Entity
 */
const RegistrationService = {
  /**
   * Create a new registration record.
   * Default status: 'pending', default attendanceStatus: 'notMarked'.
   */
  async createRegistration({ participantName, email, workshopTitle, registrationDetails }) {
    const query = `
      INSERT INTO registrations (participantName, email, workshopTitle, registrationDetails, status, attendanceStatus)
      VALUES (?, ?, ?, ?, 'pending', 'notMarked')
    `;
    const [result] = await pool.query(query, [participantName, email, workshopTitle, registrationDetails]);
    return { id: result.insertId, participantName, email, workshopTitle, registrationDetails, status: 'pending', attendanceStatus: 'notMarked' };
  },

  /**
   * Get registrations matching a specific participant's email.
   */
  async getRegistrationsByEmail(email) {
    const query = 'SELECT * FROM registrations WHERE email = ? ORDER BY createdAt DESC';
    const [rows] = await pool.query(query, [email]);
    return rows;
  },

  /**
   * Update registration details. Can only be done if status is 'pending'.
   */
  async updateRegistrationDetails(id, email, { registrationDetails }) {
    // Verify first if it exists and is pending
    const checkQuery = 'SELECT status FROM registrations WHERE id = ? AND email = ?';
    const [rows] = await pool.query(checkQuery, [id, email]);
    
    if (rows.length === 0) {
      throw new Error('Registration not found or unauthorized.');
    }
    if (rows[0].status !== 'pending') {
      throw new Error('Cannot edit registration details once status is confirmed or cancelled.');
    }

    const updateQuery = 'UPDATE registrations SET registrationDetails = ? WHERE id = ? AND email = ?';
    await pool.query(updateQuery, [registrationDetails, id, email]);
    return { id, email, registrationDetails };
  },

  /**
   * Retrieve all registrations (Organizer dashboard).
   * Supports optional filters.
   */
  async getAllRegistrations({ workshopTitle, status, attendanceStatus } = {}) {
    let query = 'SELECT * FROM registrations WHERE 1=1';
    const params = [];

    if (workshopTitle) {
      query += ' AND workshopTitle = ?';
      params.push(workshopTitle);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (attendanceStatus) {
      query += ' AND attendanceStatus = ?';
      params.push(attendanceStatus);
    }

    query += ' ORDER BY createdAt DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Update registration status (Organizer only).
   */
  async updateRegistrationStatus(id, status) {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'waitlisted'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid registration status.');
    }

    const query = 'UPDATE registrations SET status = ? WHERE id = ?';
    const [result] = await pool.query(query, [status, id]);
    if (result.affectedRows === 0) {
      throw new Error('Registration record not found.');
    }
    return { id, status };
  },

  /**
   * Update organizer note (Organizer only).
   */
  async updateOrganizerNote(id, organizerNote) {
    const query = 'UPDATE registrations SET organizerNote = ? WHERE id = ?';
    const [result] = await pool.query(query, [organizerNote, id]);
    if (result.affectedRows === 0) {
      throw new Error('Registration record not found.');
    }
    return { id, organizerNote };
  },

  /**
   * Update attendance status (Organizer only).
   */
  async updateAttendanceStatus(id, attendanceStatus) {
    const validAttendances = ['notMarked', 'present', 'absent'];
    if (!validAttendances.includes(attendanceStatus)) {
      throw new Error('Invalid attendance status.');
    }

    const query = 'UPDATE registrations SET attendanceStatus = ? WHERE id = ?';
    const [result] = await pool.query(query, [attendanceStatus, id]);
    if (result.affectedRows === 0) {
      throw new Error('Registration record not found.');
    }
    return { id, attendanceStatus };
  },

  /**
   * Clean up test records (used for test environment teardowns).
   */
  async deleteRegistrationsByEmail(email) {
    const query = 'DELETE FROM registrations WHERE email = ?';
    const [result] = await pool.query(query, [email]);
    return result.affectedRows;
  }
};

module.exports = RegistrationService;
