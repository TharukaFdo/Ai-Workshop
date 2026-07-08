import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'c2p1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Simple connectivity check helper
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to local MySQL Database successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL Database:', error.message);
    return false;
  }
}

export default pool;
