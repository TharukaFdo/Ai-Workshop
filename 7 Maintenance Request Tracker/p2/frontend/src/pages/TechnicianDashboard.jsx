import React from 'react';

function TechnicianDashboard({
  requests,
  loadingRequests,
  requestsError,
  filterLocation,
  setFilterLocation,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  editingRequest,
  setEditingRequest,
  selectRequestForEdit,
  updateStatus,
  setUpdateStatus,
  updateNote,
  setUpdateNote,
  updateError,
  updateLoading,
  handleUpdateRequest,
  getStatusStyle,
  getPriorityColor
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Filters Row */}
      <div style={{ background: 'var(--panel-bg)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Filters:</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location</label>
          <input
            type="text"
            placeholder="Filter by location"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="inProgress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {(filterLocation || filterPriority || filterStatus) && (
          <button
            onClick={() => {
              setFilterLocation('');
              setFilterPriority('');
              setFilterStatus('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Body Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: editingRequest ? '1.5fr 1fr' : '1fr', gap: '30px' }}>
        
        {/* Requests list */}
        <div>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>Submitted Requests</h2>
          {loadingRequests ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
          ) : requestsError ? (
            <div style={{ color: 'var(--danger)' }}>{requestsError}</div>
          ) : requests.length === 0 ? (
            <div style={{ background: 'var(--panel-bg)', padding: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'center' }}>
              No maintenance requests found matching criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {requests.map((req) => {
                const statusBadge = getStatusStyle(req.status);
                const isSelected = editingRequest && editingRequest.id === req.id;
                return (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--panel-bg)',
                      padding: '20px',
                      borderRadius: 'var(--radius)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onClick={() => selectRequestForEdit(req)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                        {req.priority === 'High' && <span style={{ color: 'var(--danger)', marginRight: '8px', fontSize: '0.8rem', background: '#ef44441e', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ef444433' }}>🚨 URGENT</span>}
                        {req.title}
                      </h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', backgroundColor: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.color}33` }}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{req.description}</p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                      <div>📍 <strong>Location:</strong> {req.location}</div>
                      <div>🚨 <strong>Priority:</strong> <span style={{ color: getPriorityColor(req.priority), fontWeight: 600 }}>{req.priority}</span></div>
                      <div>👤 <strong>Requester:</strong> {req.requester_name}</div>
                    </div>

                    {req.technician_note && (
                      <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-color)', borderRadius: '6px', borderLeft: '3px solid var(--primary)', fontSize: '0.85rem' }}>
                        <strong>Technician Note:</strong> {req.technician_note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Technician Edit/Update Panel */}
        {editingRequest && (
          <div style={{ background: 'var(--panel-bg)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', alignSelf: 'start', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Update Request #{editingRequest.id}</h2>
              <button
                onClick={() => setEditingRequest(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '15px', fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '5px' }}><strong>Title:</strong> {editingRequest.title}</div>
              <div style={{ marginBottom: '5px' }}><strong>Requester:</strong> {editingRequest.requester_name}</div>
            </div>

            <form onSubmit={handleUpdateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                >
                  <option value="submitted">Submitted</option>
                  <option value="inProgress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Technician Note</label>
                <textarea
                  placeholder="Add progress/resolution notes..."
                  rows="4"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {updateError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', backgroundColor: '#ef44441e', padding: '8px', borderRadius: '6px' }}>
                  {updateError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}

export default TechnicianDashboard;
