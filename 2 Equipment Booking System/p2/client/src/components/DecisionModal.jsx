import React from 'react';

function DecisionModal({
  activeModal,
  commentText,
  setCommentText,
  submittingAction,
  handleStatusSubmit,
  onClose
}) {
  if (!activeModal) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          Confirm Decision: {activeModal.actionType}
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Please provide a comment for this decision. {activeModal.actionType === 'Rejected' && <strong style={{ color: 'var(--status-rejected)' }}>(Required for rejection)</strong>}
        </p>

        <form onSubmit={handleStatusSubmit}>
          <div className="form-group">
            <label htmlFor="modal-comment">Comments</label>
            <textarea
              id="modal-comment"
              placeholder="Enter decision rationale here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required={activeModal.actionType === 'Rejected'}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submittingAction}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: activeModal.actionType === 'Approved' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: 'none'
              }}
              disabled={submittingAction}
            >
              {submittingAction ? 'Processing...' : `Confirm ${activeModal.actionType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DecisionModal;
