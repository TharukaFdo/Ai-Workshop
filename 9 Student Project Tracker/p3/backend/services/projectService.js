const db = require('../config/db');

/**
 * Get all project submissions, with optional filters for supervisor, category, and status.
 */
async function getAllProjects(filters = {}) {
  let query = 'SELECT * FROM project_submissions WHERE 1=1';
  const queryParams = [];

  if (filters.supervisorName) {
    query += ' AND supervisorName = ?';
    queryParams.push(filters.supervisorName);
  }

  if (filters.category) {
    query += ' AND category = ?';
    queryParams.push(filters.category);
  }

  if (filters.status) {
    query += ' AND status = ?';
    queryParams.push(filters.status);
  }

  query += ' ORDER BY createdAt DESC';

  const [rows] = await db.query(query, queryParams);
  return rows;
}

/**
 * Get projects belonging to a specific student, with optional filters.
 */
async function getProjectsByStudent(studentId, filters = {}) {
  let query = 'SELECT * FROM project_submissions WHERE student_id = ?';
  const queryParams = [studentId];

  if (filters.supervisorName) {
    query += ' AND supervisorName = ?';
    queryParams.push(filters.supervisorName);
  }

  if (filters.category) {
    query += ' AND category = ?';
    queryParams.push(filters.category);
  }

  if (filters.status) {
    query += ' AND status = ?';
    queryParams.push(filters.status);
  }

  query += ' ORDER BY createdAt DESC';

  const [rows] = await db.query(query, queryParams);
  return rows;
}

/**
 * Get a specific project submission by ID.
 */
async function getProjectById(id) {
  const [rows] = await db.query('SELECT * FROM project_submissions WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Create a new project submission.
 */
async function createProject(projectData) {
  const { title, description, category, studentName, supervisorName, submittedDate, studentId } = projectData;

  const [result] = await db.query(
    `INSERT INTO project_submissions 
    (title, description, category, studentName, supervisorName, submittedDate, status, student_id) 
    VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?)`,
    [title, description, category, studentName, supervisorName, submittedDate, studentId]
  );

  return result.insertId;
}

/**
 * Update student-editable fields of a project submission.
 */
async function updateProjectFields(id, projectData) {
  const { title, description, category, studentName, supervisorName, submittedDate } = projectData;

  const [result] = await db.query(
    `UPDATE project_submissions 
     SET title = ?, description = ?, category = ?, studentName = ?, supervisorName = ?, submittedDate = ?, status = 'submitted'
     WHERE id = ?`,
    [title, description, category, studentName, supervisorName, submittedDate, id]
  );

  return result.affectedRows > 0;
}

/**
 * Update supervisor-only feedback and status fields.
 */
async function updateProjectStatusAndFeedback(id, status, feedback) {
  const [result] = await db.query(
    `UPDATE project_submissions 
     SET status = ?, feedback = ? 
     WHERE id = ?`,
    [status, feedback, id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  getAllProjects,
  getProjectsByStudent,
  getProjectById,
  createProject,
  updateProjectFields,
  updateProjectStatusAndFeedback
};
