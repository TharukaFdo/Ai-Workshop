const db = require('../config/db');

/**
 * Fetch requests with dynamic filtering options.
 */
async function getRequests({ itemName, requesterName, requesterId, status } = {}) {
  let query = 'SELECT * FROM inventory_requests WHERE 1=1';
  const params = [];

  if (itemName) {
    query += ' AND item_name LIKE ?';
    params.push(`%${itemName}%`);
  }
  if (requesterName) {
    query += ' AND requester_name LIKE ?';
    params.push(`%${requesterName}%`);
  }
  if (requesterId) {
    query += ' AND requester_id = ?';
    params.push(requesterId);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const [rows] = await db.query(query, params);
  return rows;
}

/**
 * Fetch a single request by its ID.
 */
async function getRequestById(id) {
  const [rows] = await db.query('SELECT * FROM inventory_requests WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Create a new inventory request.
 */
async function createRequest({ itemName, quantity, reason, requestedDate, requesterId, requesterName }) {
  const [result] = await db.query(
    `INSERT INTO inventory_requests 
    (item_name, quantity, reason, requested_date, requester_id, requester_name, status) 
    VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [itemName, quantity, reason, requestedDate, requesterId, requesterName]
  );
  return getRequestById(result.insertId);
}

/**
 * Update request details (permitted only if status is pending).
 */
async function updateRequestDetails(id, requesterId, { itemName, quantity, reason, requestedDate }) {
  // Check existence and state first
  const request = await getRequestById(id);
  if (!request) {
    throw new Error('Request not found');
  }
  if (request.requester_id !== requesterId) {
    throw new Error('Permission Denied: You do not own this request.');
  }
  if (request.status !== 'pending') {
    throw new Error('Cannot edit requests that are not in pending status.');
  }

  await db.query(
    `UPDATE inventory_requests 
     SET item_name = ?, quantity = ?, reason = ?, requested_date = ? 
     WHERE id = ?`,
    [itemName, quantity, reason, requestedDate, id]
  );

  return getRequestById(id);
}

/**
 * Update request status (approve/reject).
 */
async function updateRequestStatus(id, { status, storekeeperNote }) {
  const request = await getRequestById(id);
  if (!request) {
    throw new Error('Request not found');
  }
  if (request.status !== 'pending') {
    throw new Error('Can only approve or reject requests that are pending.');
  }

  await db.query(
    `UPDATE inventory_requests 
     SET status = ?, storekeeper_note = ? 
     WHERE id = ?`,
    [status, storekeeperNote, id]
  );

  return getRequestById(id);
}

/**
 * Mark approved request as issued.
 */
async function issueRequest(id, { issuedQuantity }) {
  const request = await getRequestById(id);
  if (!request) {
    throw new Error('Request not found');
  }
  if (request.status !== 'approved') {
    throw new Error('Only approved requests can be marked as issued.');
  }
  if (issuedQuantity <= 0 || issuedQuantity > request.quantity) {
    throw new Error('Issued quantity must be positive and less than or equal to requested quantity.');
  }

  await db.query(
    `UPDATE inventory_requests 
     SET status = 'issued', issued_quantity = ?, issued_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [issuedQuantity, id]
  );

  return getRequestById(id);
}

module.exports = {
  getRequests,
  getRequestById,
  createRequest,
  updateRequestDetails,
  updateRequestStatus,
  issueRequest
};
