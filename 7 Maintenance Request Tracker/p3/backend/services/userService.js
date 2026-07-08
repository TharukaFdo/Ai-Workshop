const pool = require('../config/db');

const userService = {
  async getUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM app_users WHERE username = ?', [username]);
    return rows.length ? rows[0] : null;
  },

  async getUserById(id) {
    const [rows] = await pool.query('SELECT * FROM app_users WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  }
};

module.exports = userService;
