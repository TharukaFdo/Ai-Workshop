const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('Starting database setup...');

  // Configuration to connect to MySQL server initially without specifying a database
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL server.');

    const sqlFilePath = path.join(__dirname, 'schema.sql');
    const sqlQueries = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing schema.sql...');
    await connection.query(sqlQueries);

    console.log('Database and tables initialized successfully.');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
