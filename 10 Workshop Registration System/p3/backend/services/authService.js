const crypto = require('crypto');
const pool = require('../config/db');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const AuthService = {
  /**
   * Validate credentials and return user object if valid.
   */
  async login(email, password) {
    const hashedPassword = hashPassword(password);
    const query = 'SELECT id, email, role FROM app_users WHERE email = ? AND password = ?';
    const [rows] = await pool.query(query, [email, hashedPassword]);
    
    if (rows.length === 0) {
      throw new Error('Invalid email or password.');
    }
    return rows[0];
  },

  /**
   * Find a user by their email address (used for session/token verification on backend).
   */
  async findUserByEmail(email) {
    const query = 'SELECT id, email, role FROM app_users WHERE email = ?';
    const [rows] = await pool.query(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  }
};

module.exports = AuthService;
