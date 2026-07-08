const db = require('../config/db');

/**
 * Find a user by username.
 */
async function getUserByUsername(username) {
  const [rows] = await db.query('SELECT * FROM app_users WHERE username = ?', [username]);
  return rows[0] || null;
}

/**
 * Get all users by role.
 */
async function getUsersByRole(role) {
  const [rows] = await db.query('SELECT * FROM app_users WHERE role = ?', [role]);
  return rows;
}

module.exports = {
  getUserByUsername,
  getUsersByRole
};
