const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSetup() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Enable multiple statements execution
  };

  console.log('Connecting to MySQL host at:', connectionConfig.host);
  let connection;

  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL server.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema.sql scripts...');
    await connection.query(schemaSql);

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error during database setup:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSetup();
