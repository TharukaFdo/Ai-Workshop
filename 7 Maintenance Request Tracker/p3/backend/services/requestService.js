const pool = require('../config/db');

/**
 * Service handling maintenance requests database operations
 */
const requestService = {
  /**
   * Create a new maintenance request
   */
  async createRequest({ title, description, location, priority, requesterName, requesterId }) {
    const query = `
      INSERT INTO requests (title, description, location, priority, requester_name, requester_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted')
    `;
    const [result] = await pool.query(query, [title, description, location, priority, requesterName, requesterId]);
    return { id: result.insertId, title, description, location, priority, requesterName, requesterId, status: 'submitted' };
  },

  /**
   * Find a specific request by ID
   */
  async getRequestById(id) {
    const [rows] = await pool.query('SELECT * FROM requests WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  /**
   * Retrieve all requests with optional filters for Technicians
   */
  async getAllRequests({ location, priority, status } = {}) {
    let query = 'SELECT * FROM requests';
    const params = [];
    const conditions = [];

    if (location) {
      conditions.push('location = ?');
      params.push(location);
    }
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Retrieve requests created by a specific requester with optional filters
   */
  async getRequestsByRequesterId(requesterId, { location, priority, status } = {}) {
    let query = 'SELECT * FROM requests WHERE requester_id = ?';
    const params = [requesterId];

    if (location) {
      query += ' AND location = ?';
      params.push(location);
    }
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Update request details (Requester action - allowed only when status is 'submitted')
   */
  async updateRequestDetails(id, { title, description, location, priority }) {
    const query = `
      UPDATE requests 
      SET title = ?, description = ?, location = ?, priority = ?
      WHERE id = ? AND status = 'submitted'
    `;
    const [result] = await pool.query(query, [title, description, location, priority, id]);
    return result.affectedRows > 0;
  },

  /**
   * Update progress status and technician notes (Technician action)
   */
  async updateRequestStatusAndNotes(id, { status, technicianNote }) {
    // Verify high priority note constraint at the service layer
    if (status === 'closed') {
      const [rows] = await pool.query('SELECT priority, technician_note FROM requests WHERE id = ?', [id]);
      if (rows.length && rows[0].priority === 'High') {
        const pendingNote = technicianNote ? technicianNote.trim() : '';
        const existingNote = rows[0].technician_note ? rows[0].technician_note.trim() : '';
        if (!pendingNote && !existingNote) {
          throw new Error('High priority requests cannot be closed without a technician note.');
        }
      }
    }

    let query = 'UPDATE requests SET status = ?, technician_note = ?';
    const params = [status, technicianNote];

    // If status is transitioning to closed, set closed_at
    if (status === 'closed') {
      query += ', closed_at = NOW()';
    } else {
      query += ', closed_at = NULL';
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  },

  /**
   * Clean up helper for testing (deletes requests by ID or clears all test requests)
   */
  async deleteRequestForTest(id) {
    await pool.query('DELETE FROM requests WHERE id = ?', [id]);
  }
};

module.exports = requestService;
