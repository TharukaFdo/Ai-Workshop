import React from 'react';

function RequesterDashboard({
  title,
  setTitle,
  description,
  setDescription,
  location,
  setLocation,
  priority,
  setPriority,
  formSuccess,
  formError,
  formLoading,
  handleRequestSubmit,
  requests,
  loadingRequests,
  requestsError,
  filterLocation,
  setFilterLocation,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  getStatusStyle,
  getPriorityColor
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
      
      {/* Form Container */}
      <div style={{ background: 'var(--panel-bg)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>Submit Maintenance Request</h2>
        <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Problem Title</label>
            <input
              type="text"
              required
              placeholder="e.g. AC leaking water"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detailed Description</label>
            <textarea
              required
              placeholder="Describe the issue in detail..."
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Room 302, Office Building"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {formError && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', backgroundColor: '#ef44441e', padding: '8px', borderRadius: '6px' }}>
              {formError}
            </div>
          )}

          {formSuccess && (
            <div style={{ color: 'var(--success)', fontSize: '0.85rem', backgroundColor: '#10b9811e', padding: '8px', borderRadius: '6px' }}>
              {formSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={formLoading}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            {formLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Request View Container */}
      <div>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>Your Submitted Requests</h2>
        
        {/* Filters Row */}
        <div style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filters:</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Location</label>
            <input
              type="text"
              placeholder="e.g. Room"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.8rem', width: '100px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
            >
              <option value="">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
            >
              <option value="">All</option>
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
                fontSize: '0.8rem',
                padding: 0
              }}
            >
              Clear
            </button>
          )}
        </div>

        {loadingRequests ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading requests...</div>
        ) : requestsError ? (
          <div style={{ color: 'var(--danger)' }}>{requestsError}</div>
        ) : requests.length === 0 ? (
          <div style={{ background: 'var(--panel-bg)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'center' }}>
            No matching requests found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {requests.map((req) => {
              const statusBadge = getStatusStyle(req.status);
              return (
                <div key={req.id} style={{ background: 'var(--panel-bg)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
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

    </div>
  );
}

export default RequesterDashboard;
