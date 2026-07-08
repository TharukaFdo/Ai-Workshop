const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setupDatabase() {
  console.log('Starting database setup...');
  
  // Connect initially without a database name to ensure the database itself exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Executing schema from ${schemaPath}...`);
    await connection.query(sql);

    // Update placeholders with real SHA256 hashes using the configured secret
    const authUtils = require('../utils/auth');
    const realHash = authUtils.hashPassword('password123');
    await connection.query('UPDATE app_users SET password_hash = ? WHERE password_hash = "placeholder_hash"', [realHash]);

    console.log('Database and tables setup completed successfully.');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupDatabase();
