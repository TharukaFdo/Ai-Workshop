const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

async function reset() {
  let connection;
  try {
    console.log('Connecting to MySQL host to drop database...');
    connection = await mysql.createConnection(dbConfig);
    const dbName = process.env.DB_NAME || 'c4p3';
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    console.log(`Database "${dbName}" dropped successfully.`);
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

reset();
