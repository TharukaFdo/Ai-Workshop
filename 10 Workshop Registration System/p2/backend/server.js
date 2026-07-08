const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());

// Health check and connection check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      database: 'Connected',
      message: 'Workshop Registration Backend API is healthy and connected to DB.'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      message: 'Failed to connect to database.',
      error: error.message
    });
  }
});

// Mount modular routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/registrations', require('./routes/registrations'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
