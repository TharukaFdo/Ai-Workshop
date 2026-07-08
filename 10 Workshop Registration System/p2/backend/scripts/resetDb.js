const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function resetDatabase() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  console.log('RESETTING DATABASE: Connecting to MySQL server...');
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    const dbName = process.env.DB_NAME || 'c10p2';
    
    console.log(`RESETTING DATABASE: Dropping database "${dbName}"...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    console.log('RESETTING DATABASE: Database dropped. Re-running setup...');
  } catch (err) {
    console.error('Error during database reset:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  // Run the setupDb script
  require('./setupDb');
}

resetDatabase();
