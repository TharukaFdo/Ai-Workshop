const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

// Authentication endpoints
app.use('/api/auth', require('./routes/auth'));

// Books route
app.use('/api/books', require('./routes/books'));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
