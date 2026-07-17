const db = require('../config/db');

/**
 * Get all users for mockup login/role switching.
 */
async function getAllUsers() {
  const [rows] = await db.query('SELECT id, username, role, full_name FROM users ORDER BY id ASC');
  return rows;
}

/**
 * Get user by ID.
 */
async function getUserById(id) {
  const [rows] = await db.query('SELECT id, username, role, full_name FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Get user by username.
 */
async function getUserByUsername(username) {
  const [rows] = await db.query('SELECT id, username, role, full_name FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByUsername
};
