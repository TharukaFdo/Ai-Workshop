const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');
const booksRouter = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Register API routers
app.use('/api/auth', authRouter);
app.use('/api', booksRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Library Lending backend server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
