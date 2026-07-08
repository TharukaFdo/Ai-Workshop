import React from 'react';

export function SubmitProjectModal({
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  formCategory,
  setFormCategory,
  formSupervisorId,
  setFormSupervisorId,
  formSubmittedDate,
  setFormSubmittedDate,
  supervisors,
  handleCreateProject,
  setShowSubmitModal
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>Submit New Project</h2>
        <form onSubmit={handleCreateProject} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label>Project Title</label>
            <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Smart Agriculture System" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea required rows="4" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Provide detailed project objectives..." />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select required value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
              <option value="">Select Category</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Web Development">Web Development</option>
              <option value="Cloud Computing">Cloud Computing</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assign Supervisor</label>
            <select required value={formSupervisorId} onChange={(e) => setFormSupervisorId(e.target.value)}>
              <option value="">Select Supervisor</option>
              {supervisors.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Submission Date</label>
            <input type="date" required value={formSubmittedDate} onChange={(e) => setFormSubmittedDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary">Submit Project</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditProjectModal({
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  formCategory,
  setFormCategory,
  formSupervisorId,
  setFormSupervisorId,
  formSubmittedDate,
  setFormSubmittedDate,
  supervisors,
  handleUpdateProject,
  setShowEditModal
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>Edit Project Details</h2>
        <form onSubmit={handleUpdateProject} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label>Project Title</label>
            <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea required rows="4" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select required value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
              <option value="">Select Category</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Web Development">Web Development</option>
              <option value="Cloud Computing">Cloud Computing</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assign Supervisor</label>
            <select required value={formSupervisorId} onChange={(e) => setFormSupervisorId(e.target.value)}>
              <option value="">Select Supervisor</option>
              {supervisors.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Submission Date</label>
            <input type="date" required value={formSubmittedDate} onChange={(e) => setFormSubmittedDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReviewProjectModal({
  reviewingProject,
  reviewStatus,
  setReviewStatus,
  reviewFeedback,
  setReviewFeedback,
  handleReviewProject,
  setShowReviewModal,
  setReviewingProject
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>Review Project Submission</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Project: <strong>{reviewingProject?.title}</strong></p>
        <form onSubmit={handleReviewProject} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label>Update Status</label>
            <select required value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
              <option value="submitted">Submitted</option>
              <option value="underReview">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="revisionRequested">Revision Requested</option>
            </select>
          </div>
          <div className="form-group">
            <label>Feedback</label>
            <textarea rows="4" value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} placeholder="Provide evaluation comments or suggestions..." />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary">Submit Review</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowReviewModal(false); setReviewingProject(null); }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
