const db = require('../config/db');

const ticketService = {
  // Get all tickets with optional filtering
  async getAll(filters = {}) {
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.submittedUser) {
      query += ' AND submittedUser = ?';
      params.push(filters.submittedUser);
    }

    query += ' ORDER BY createdAt DESC';
    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get a single ticket by ID
  async getById(id) {
    const [rows] = await db.query('SELECT * FROM tickets WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Create a new ticket
  async create(ticketData) {
    const { title, description, category, submittedUser } = ticketData;
    const [result] = await db.query(
      'INSERT INTO tickets (title, description, category, submittedUser, status) VALUES (?, ?, ?, ?, ?)',
      [title, description, category, submittedUser, 'open']
    );
    return { id: result.insertId, title, description, category, submittedUser, status: 'open' };
  },

  // Update a ticket's status (setting closedAt if status is 'closed')
  async updateStatus(id, status) {
    const closedAt = status === 'closed' ? new Date() : null;
    await db.query(
      'UPDATE tickets SET status = ?, closedAt = ? WHERE id = ?',
      [status, closedAt, id]
    );
    return this.getById(id);
  },

  // Reopen a ticket (sets status back to open, clears closedAt, increments reopened count)
  async reopen(id) {
    await db.query(
      'UPDATE tickets SET status = ?, closedAt = NULL, reopened = reopened + 1 WHERE id = ?',
      ['open', id]
    );
    return this.getById(id);
  },

  // Add or edit agent response
  async addResponse(id, agentResponse) {
    await db.query(
      'UPDATE tickets SET agentResponse = ? WHERE id = ?',
      [agentResponse, id]
    );
    return this.getById(id);
  },

  // Prototype Auth helpers
  async getUserByUsername(username) {
    const [rows] = await db.query('SELECT * FROM app_users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  async getAllUsers() {
    const [rows] = await db.query('SELECT * FROM app_users');
    return rows;
  }
};

module.exports = ticketService;
