const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'internship_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Simple helper to verify connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully to ' + (process.env.DB_NAME || 'internship_tracker'));
    connection.release();
  } catch (error) {
    console.warn('Database connection failed. Please ensure MySQL is running and configured correctly.', error.message);
  }
}

testConnection();

module.exports = pool;
