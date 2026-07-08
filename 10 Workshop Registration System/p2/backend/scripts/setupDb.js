const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setupDatabase() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  console.log('Connecting to MySQL server at', connectionConfig.host);
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
  } catch (err) {
    console.error('Failed to connect to MySQL server. Please make sure MySQL is running.');
    console.error(err.message);
    process.exit(1);
  }

  try {
    const dbName = process.env.DB_NAME || 'c10p2';
    console.log(`Ensuring database "${dbName}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    // Read and run schema.sql
    const schemaPath = path.join(__dirname, '../schema.sql');
    console.log('Reading schema file from', schemaPath);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Strip SQL comments and split by semicolons
    const cleanSql = schemaSql.replace(/--.*$/gm, '');
    const statements = cleanSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      console.log(`Executing SQL: ${statement.substring(0, 60).replace(/\s+/g, ' ')}...`);
      await connection.query(statement);
    }

    console.log('Database tables created successfully.');

    // Seed default users (organizer and participant)
    // Check if organizer user already exists
    const [existingOrganizers] = await connection.query('SELECT * FROM users WHERE username = ?', ['organizer']);
    let organizerId;
    if (existingOrganizers.length === 0) {
      console.log('Seeding default organizer account...');
      const [result] = await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['organizer', 'password123', 'organizer']
      );
      organizerId = result.insertId;
    } else {
      organizerId = existingOrganizers[0].id;
    }

    const [existingParticipants] = await connection.query('SELECT * FROM users WHERE username = ?', ['participant']);
    let participantId;
    if (existingParticipants.length === 0) {
      console.log('Seeding default participant account...');
      const [result] = await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['participant', 'password123', 'participant']
      );
      participantId = result.insertId;
    } else {
      participantId = existingParticipants[0].id;
    }

    // Seed default registrations
    const [existingRegistrations] = await connection.query('SELECT * FROM registrations');
    if (existingRegistrations.length === 0) {
      console.log('Seeding demo registrations...');
      const demoData = [
        {
          participantName: 'Alice Johnson',
          email: 'alice@example.com',
          workshopTitle: 'Introduction to React & State Management',
          registrationDetails: 'I am a beginner and want to learn React hooks.',
          status: 'confirmed',
          attendanceStatus: 'present',
          organizerNote: 'Completed onboarding questionnaire.',
          userId: participantId
        },
        {
          participantName: 'Bob Smith',
          email: 'bob@example.com',
          workshopTitle: 'Building REST APIs with Express & MySQL',
          registrationDetails: 'Interested in database optimization.',
          status: 'pending',
          attendanceStatus: 'notMarked',
          organizerNote: 'Needs review on prerequisite check.',
          userId: null
        },
        {
          participantName: 'Charlie Brown',
          email: 'charlie@example.com',
          workshopTitle: 'Introduction to React & State Management',
          registrationDetails: 'Looking forward to the workshop.',
          status: 'cancelled',
          attendanceStatus: 'absent',
          organizerNote: 'Cancelled due to schedule conflict.',
          userId: null
        }
      ];

      for (const reg of demoData) {
        await connection.query(
          `INSERT INTO registrations 
          (participantName, email, workshopTitle, registrationDetails, status, attendanceStatus, organizerNote, userId) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reg.participantName,
            reg.email,
            reg.workshopTitle,
            reg.registrationDetails,
            reg.status,
            reg.attendanceStatus,
            reg.organizerNote,
            reg.userId
          ]
        );
      }
      console.log('Demo registrations seeded.');
    }

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error during database setup:', error);
  } finally {
    await connection.end();
  }
}

setupDatabase();
