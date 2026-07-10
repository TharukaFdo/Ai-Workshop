const db = require('../config/db');

/**
 * Creates a new internship application for a student.
 */
async function createApplication(studentId, appData) {
  const { studentName, companyName, positionTitle, startDate, endDate, submittedDate } = appData;
  const [result] = await db.query(
    `INSERT INTO applications (student_id, student_name, company_name, position_title, start_date, end_date, submitted_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')`,
    [studentId, studentName, companyName, positionTitle, startDate, endDate, submittedDate]
  );
  return result.insertId;
}

/**
 * Retrieves applications based on filtering criteria.
 */
async function getApplications(filters = {}) {
  let query = 'SELECT * FROM applications WHERE 1=1';
  const params = [];

  if (filters.studentId) {
    query += ' AND student_id = ?';
    params.push(filters.studentId);
  }
  if (filters.companyName) {
    query += ' AND company_name LIKE ?';
    params.push(`%${filters.companyName}%`);
  }
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  query += ' ORDER BY created_at DESC';
  const [rows] = await db.query(query, params);
  return rows;
}

/**
 * Retrieves a single application by its ID.
 */
async function getApplicationById(id) {
  const [rows] = await db.query('SELECT * FROM applications WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Updates application details for a student (only allowed if status is 'changesRequested', resets to 'submitted').
 */
async function updateStudentApplication(id, studentId, appData) {
  const { studentName, companyName, positionTitle, startDate, endDate } = appData;
  const [result] = await db.query(
    `UPDATE applications
     SET student_name = ?, company_name = ?, position_title = ?, start_date = ?, end_date = ?, status = 'submitted'
     WHERE id = ? AND student_id = ? AND status = 'changesRequested'`,
    [studentName, companyName, positionTitle, startDate, endDate, id, studentId]
  );
  return result.affectedRows > 0;
}

/**
 * Updates application status and coordinator comments.
 */
async function updateCoordinatorDecision(id, status, comment) {
  const [result] = await db.query(
    `UPDATE applications
     SET status = ?, coordinator_comment = ?
     WHERE id = ?`,
    [status, comment, id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateStudentApplication,
  updateCoordinatorDecision
};
