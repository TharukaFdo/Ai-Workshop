const db = require('../config/db');

const userService = {
  // Find user by email
  async getUserByEmail(email) {
    const [rows] = await db.query('SELECT * FROM `users` WHERE `email` = ?;', [email]);
    return rows[0] || null;
  },

  // Get user details by ID
  async getUserById(id) {
    const [rows] = await db.query('SELECT `id`, `name`, `email`, `role` FROM `users` WHERE `id` = ?;', [id]);
    return rows[0] || null;
  },

  // Get all users (non-agents)
  async getAllUsers() {
    const [rows] = await db.query('SELECT `id`, `name`, `email` FROM `users` WHERE `role` = \'user\';');
    return rows;
  }
};

module.exports = userService;
