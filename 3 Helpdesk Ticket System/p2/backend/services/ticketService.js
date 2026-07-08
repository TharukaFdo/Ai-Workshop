const db = require('../config/db');

const ticketService = {
  // Fetch tickets with filters
  async getAll({ status, category, submittedUserId, isAgent }) {
    let sql = `
      SELECT t.*, u.name as submittedUser
      FROM \`tickets\` t
      JOIN \`users\` u ON t.submittedUserId = u.id
    `;
    const params = [];
    const conditions = [];

    // Access control: Users see only their own tickets
    if (!isAgent) {
      conditions.push('t.submittedUserId = ?');
      params.push(submittedUserId);
    } else if (submittedUserId) {
      // Agents can filter by specific user
      conditions.push('t.submittedUserId = ?');
      params.push(submittedUserId);
    }

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY t.createdAt DESC';

    const [rows] = await db.query(sql, params);
    return rows;
  },

  // Get ticket by ID
  async getById(id) {
    const [rows] = await db.query(`
      SELECT t.*, u.name as submittedUser, u.email as submittedUserEmail
      FROM \`tickets\` t
      JOIN \`users\` u ON t.submittedUserId = u.id
      WHERE t.id = ?;
    `, [id]);
    return rows[0] || null;
  },

  // Create a new ticket
  async create({ title, description, category, submittedUserId }) {
    const [result] = await db.query(
      'INSERT INTO \`tickets\` (\`title\`, \`description\`, \`category\`, \`submittedUserId\`, \`status\`) VALUES (?, ?, ?, ?, \'open\');',
      [title, description, category, submittedUserId]
    );
    return result.insertId;
  },

  // Update agent response
  async updateResponse(id, agentResponse) {
    const [result] = await db.query(
      'UPDATE \`tickets\` SET \`agentResponse\` = ? WHERE \`id\` = ?;',
      [agentResponse, id]
    );
    return result.affectedRows > 0;
  },

  // Update ticket status
  async updateStatus(id, status) {
    const closedAt = status === 'closed' ? new Date() : null;
    const [result] = await db.query(
      'UPDATE \`tickets\` SET \`status\` = ?, \`closedAt\` = ? WHERE \`id\` = ?;',
      [status, closedAt, id]
    );
    return result.affectedRows > 0;
  },

  // Reopen a ticket (User-only transition: open status, clears closedAt, increments reopened count)
  async reopen(id) {
    const [result] = await db.query(
      'UPDATE \`tickets\` SET \`status\` = \'open\', \`closedAt\` = NULL, \`reopened\` = \`reopened\` + 1 WHERE \`id\` = ?;',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = ticketService;
