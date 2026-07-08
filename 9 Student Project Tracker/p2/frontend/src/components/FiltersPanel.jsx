import React from 'react';

function FiltersPanel({
  currentUser,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  filterSupervisor,
  setFilterSupervisor,
  supervisors
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
      <div>
        <label>Filter by Status</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="underReview">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="revisionRequested">Revision Requested</option>
        </select>
      </div>
      <div>
        <label>Filter by Category</label>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Artificial Intelligence">Artificial Intelligence</option>
          <option value="Cybersecurity">Cybersecurity</option>
          <option value="Web Development">Web Development</option>
          <option value="Cloud Computing">Cloud Computing</option>
        </select>
      </div>
      <div>
        <label>Filter by Supervisor</label>
        <select value={filterSupervisor} onChange={(e) => setFilterSupervisor(e.target.value)}>
          <option value="">All Supervisors</option>
          {supervisors.map(s => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default FiltersPanel;
