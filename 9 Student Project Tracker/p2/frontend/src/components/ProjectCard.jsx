import React from 'react';

function ProjectCard({ 
  project, 
  currentUser, 
  openEditModal, 
  openReviewModal, 
  formatDate 
}) {
  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem' }}>{project.title}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Category: <strong>{project.category}</strong> | Submitted on: {formatDate(project.submitted_date)}
          </p>
        </div>
        <div>
          <span className={`badge badge-${project.status.toLowerCase()}`}>
            {project.status === 'underReview' 
              ? 'Under Review' 
              : project.status === 'revisionRequested' 
                ? 'Revision Requested' 
                : project.status}
          </span>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)' }}>{project.description}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.9rem' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Student Name:</span><br/>
          <strong>{project.student_name}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Assigned Supervisor:</span><br/>
          <strong>{project.supervisor_name}</strong>
        </div>
      </div>

      {project.feedback && (
        <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '1rem', margin: '0.5rem 0' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>Supervisor Feedback:</span>
          <p style={{ fontSize: '0.95rem', fontStyle: 'italic', marginTop: '0.2rem' }}>"{project.feedback}"</p>
        </div>
      )}

      {/* Actions Panel inside Card */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        {currentUser.role === 'student' && currentUser.id === project.student_id && project.status === 'revisionRequested' && (
          <button className="btn btn-secondary" onClick={() => openEditModal(project)}>
            Edit Details
          </button>
        )}
        {currentUser.role === 'supervisor' && currentUser.id === project.supervisor_id && (
          <button className="btn btn-primary" onClick={() => openReviewModal(project)}>
            Review & Update Status
          </button>
        )}
      </div>
    </article>
  );
}

export default ProjectCard;
