const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const dbName = process.env.DB_NAME || 'c9p2';

  console.log(`Resetting database "${dbName}" at ${host}:${port}...`);

  let connection;
  try {
    connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" dropped successfully.`);
  } catch (error) {
    console.error('Failed to drop database:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }

  // Now trigger db-setup to recreate and reseed
  console.log('Running db-setup to rebuild database...');
  require('./db-setup.js');
}

resetDatabase();
