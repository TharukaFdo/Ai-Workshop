const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  console.log('Connected to MySQL server.');

  try {
    // Create the database if it doesn't exist
    const dbName = process.env.DB_NAME || 'c7p2';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" ensured.`);

    // Use the database
    await connection.query(`USE \`${dbName}\``);

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL commands by semicolon and run them
    // Simple parsing: split by ';' but filter out comments and empty statements
    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (const query of queries) {
      await connection.query(query);
    }

    // Safely add session_token column if it doesn't exist (avoiding table drop)
    try {
      await connection.query('ALTER TABLE users ADD COLUMN session_token VARCHAR(255) NULL UNIQUE');
      console.log('Added session_token column to users table.');
    } catch (alterError) {
      // 1060 is ER_DUP_FIELDNAME (column already exists), which we can safely ignore
      if (alterError.errno !== 1060) {
        throw alterError;
      }
    }

    console.log('Database schema and seed data loaded successfully.');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupDatabase();
