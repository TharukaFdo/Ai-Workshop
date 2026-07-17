const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection pool
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected successfully.');
    connection.release();
  }
});

module.exports = pool.promise();
