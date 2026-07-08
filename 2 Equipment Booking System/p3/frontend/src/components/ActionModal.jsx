import React, { useState } from 'react';

export default function ActionModal({ booking, actionType, onSubmit, onClose }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('A comment explaining the decision is required.');
      return;
    }
    onSubmit(booking.id, actionType, comment.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <h3>{actionType === 'approved' ? 'Approve Booking' : 'Reject Booking'}</h3>
        <p className="modal-info">
          Confirming review for <strong>{booking.equipmentName}</strong> requested by <strong>{booking.requestedUser}</strong>.
        </p>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="assistant-comment">Assistant Comment / Decision Reason</label>
            <textarea
              id="assistant-comment"
              required
              rows="3"
              maxLength="255"
              placeholder="Provide a brief explanation..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${actionType === 'approved' ? 'btn-success' : 'btn-danger'}`}
            >
              Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
