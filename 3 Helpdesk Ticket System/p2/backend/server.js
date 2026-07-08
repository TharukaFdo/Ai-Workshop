const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRouter = require('./routes/authRoutes');
const ticketRouter = require('./routes/ticketRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Verify Database Connection
db.getConnection()
  .then(connection => {
    console.log('Successfully connected to MySQL database.');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err.message);
  });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Helpdesk API is running.' });
});

// Mounted Routes
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/users', userRouter);

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
