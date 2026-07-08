const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('Starting database setup...');
  
  // Connection without database selected to ensure we can create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : ''
  });

  try {
    const dbName = process.env.DB_NAME || 'c3p3';
    console.log(`Creating database "${dbName}" if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading SQL schema from ${schemaPath}...`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split queries by semicolon (excluding any semicolons inside text quotes if simple)
    // Note: Since our schema.sql has simple queries, splitting by ';' is safe
    const queries = sql
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (let query of queries) {
      // Skip USE command since we already handle it
      if (query.toUpperCase().startsWith('USE ')) continue;
      console.log(`Executing: ${query.substring(0, 50)}...`);
      await connection.query(query);
    }

    console.log('Database schema and seed data loaded successfully!');
  } catch (error) {
    console.error('Error setting up the database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupDatabase();
