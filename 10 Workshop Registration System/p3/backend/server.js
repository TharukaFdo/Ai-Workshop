const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const authRouter = require('./routes/auth');
const registrationRouter = require('./routes/registrations');
app.use('/api/auth', authRouter);
app.use('/api/registrations', registrationRouter);

// Health Check and DB connection verification route
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      database: 'Connected successfully',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Connection failed',
      message: error.message
    });
  }
});

// Basic check when server starts
pool.query('SELECT 1')
  .then(() => console.log('Successfully connected to the MySQL Database.'))
  .catch((err) => {
    console.error('CRITICAL: Failed to connect to MySQL database.');
    console.error(err.message);
  });

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
