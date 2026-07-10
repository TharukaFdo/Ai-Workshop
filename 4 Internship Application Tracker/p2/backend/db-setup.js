const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
  console.log('Starting database setup...');

  // Connect to MySQL server first (without database to ensure we can create it)
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Required to execute multiple statements in schema.sql
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Executing schema file: ${schemaPath}`);
    await connection.query(sqlSchema);
    console.log('Database and tables initialized and seeded successfully.');
  } catch (error) {
    console.error('Error setting up the database:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

setupDatabase();
