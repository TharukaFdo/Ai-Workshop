import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Strict CORS config: allow only authorized local origins
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Rate Limiting Config
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 150, // Limit each IP to 150 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // Limit each IP to 15 login attempts per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' }
});

app.use('/api/', generalLimiter);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Input validation schema constraints
const ALLOWED_CATEGORIES = [
  'Web Application',
  'Mobile Development',
  'AI & Machine Learning',
  'Cybersecurity',
  'Other'
];

const validateProjectInput = (req, res, next) => {
  const { title, description, category, supervisor_name } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
      return res.status(400).json({ error: 'Title must be between 3 and 100 characters long' });
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 1000) {
      return res.status(400).json({ error: 'Description must be between 10 and 1000 characters long' });
    }
  }

  if (category !== undefined) {
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category selection' });
    }
  }

  if (supervisor_name !== undefined) {
    if (typeof supervisor_name !== 'string' || supervisor_name.trim().length < 3 || supervisor_name.trim().length > 100) {
      return res.status(400).json({ error: 'Supervisor name must be between 3 and 100 characters long' });
    }
  }

  next();
};

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Login Endpoint (with rate limiter)
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all projects (Authenticated & Filtered)
app.get('/api/projects', authenticateToken, async (req, res) => {
  const { supervisor_name, category, status } = req.query;

  try {
    let query = 'SELECT * FROM projects';
    const conditions = [];
    const values = [];

    if (supervisor_name) {
      conditions.push('supervisor_name LIKE ?');
      values.push(`%${supervisor_name}%`);
    }
    if (category) {
      conditions.push('category = ?');
      values.push(category);
    }
    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY submitted_date DESC';

    const [rows] = await db.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create a new project submission (Student Only)
app.post('/api/projects', authenticateToken, validateProjectInput, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can submit projects' });
  }

  const { title, description, category, supervisor_name } = req.body;
  if (!title || !description || !category || !supervisor_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO projects (title, description, category, student_name, supervisor_name, status, student_id) 
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [title.trim(), description.trim(), category, req.user.username, supervisor_name.trim(), req.user.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Project submitted successfully' });
  } catch (error) {
    console.error('Error inserting project:', error);
    res.status(500).json({ error: 'Failed to submit project' });
  }
});

// Update project status/details (Authorized)
app.put('/api/projects/:id', authenticateToken, validateProjectInput, async (req, res) => {
  const { id } = req.params;
  const { title, description, category, supervisor_name, status, supervisor_feedback } = req.body;

  try {
    // 1. Fetch current project state
    const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = rows[0];

    const fields = [];
    const values = [];

    if (req.user.role === 'student') {
      // Students can only update their own project if it requires revision
      if (project.student_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own projects' });
      }
      if (project.status !== 'Revision Requested') {
        return res.status(403).json({ error: 'You can only edit and resubmit projects that require revisions' });
      }

      // Restrict fields to student details only, and reset status back to 'Pending' (resubmitted)
      if (title !== undefined) { fields.push('title = ?'); values.push(title.trim()); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description.trim()); }
      if (category !== undefined) { fields.push('category = ?'); values.push(category); }
      if (supervisor_name !== undefined) { fields.push('supervisor_name = ?'); values.push(supervisor_name.trim()); }
      
      fields.push("status = 'Pending'");

    } else if (req.user.role === 'supervisor') {
      // Supervisors can only update review status and feedback
      if (status !== undefined) {
        if (!['Pending', 'Approved', 'Rejected', 'Revision Requested'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status update value' });
        }
        fields.push('status = ?');
        values.push(status);
      }
      if (supervisor_feedback !== undefined) {
        if (supervisor_feedback && supervisor_feedback.trim().length > 1000) {
          return res.status(400).json({ error: 'Feedback cannot exceed 1000 characters' });
        }
        fields.push('supervisor_feedback = ?');
        values.push(supervisor_feedback ? supervisor_feedback.trim() : null);
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No authorized fields to update' });
    }

    values.push(id);

    await db.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
