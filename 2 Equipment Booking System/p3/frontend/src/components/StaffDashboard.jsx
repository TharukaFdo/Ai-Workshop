import React from 'react';

export default function StaffDashboard({
  bookings,
  onCreateClick,
  onEditClick,
  loading,
  filterEquipment,
  setFilterEquipment,
  filterDate,
  setFilterDate,
  filterStatus,
  setFilterStatus
}) {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>My Booking Requests</h2>
        <button className="btn btn-primary" onClick={onCreateClick}>
          + Request Equipment
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar card">
        <div className="filter-group">
          <label htmlFor="filter-eq">Filter Equipment</label>
          <input
            type="text"
            id="filter-eq"
            placeholder="e.g. Microscope"
            value={filterEquipment}
            onChange={(e) => setFilterEquipment(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="filter-date">Date</label>
          <input
            type="date"
            id="filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="collected">Collected</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state card">
          <p>No bookings found.</p>
        </div>
      ) : (
        <div className="booking-table-wrapper">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="font-semibold">{booking.equipmentName}</td>
                  <td>{booking.bookingDate.split('T')[0]}</td>
                  <td>
                    {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
                  </td>
                  <td className="purpose-cell">{booking.purpose}</td>
                  <td>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="comment-cell">{booking.assistantComment || '-'}</td>
                  <td>
                    {booking.status === 'pending' ? (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onEditClick(booking)}
                      >
                        Edit
                      </button>
                    ) : (
                      <span className="text-disabled">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
