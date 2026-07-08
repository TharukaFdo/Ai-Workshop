const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setupDatabase() {
  console.log('Starting Room Booking System Database Setup...');

  // Config without DB_NAME initially to create the DB if needed
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL server successfully.');

    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    // Split SQL by semicolons, filtering out empty queries
    const queries = schemaSql
      .split(/;\r?\n/)
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (const query of queries) {
      // Execute each query block
      await connection.query(query);
    }

    console.log('Database schema and seed data loaded successfully!');
  } catch (error) {
    console.error('Error during database setup:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
