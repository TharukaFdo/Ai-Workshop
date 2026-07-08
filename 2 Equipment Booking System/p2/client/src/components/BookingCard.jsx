import React from 'react';

function BookingCard({
  booking,
  userRole,
  onOpenModal
}) {
  return (
    <div className="booking-card">
      {/* Card Header */}
      <div className="booking-header">
        <div>
          <div className="equipment-title">{booking.equipmentName}</div>
          {userRole === 'Assistant' && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Requested by: <strong>{booking.requestedUser}</strong>
            </span>
          )}
        </div>
        <span className={`badge badge-${booking.status.toLowerCase()}`}>
          {booking.status}
        </span>
      </div>

      {/* Card Metadata */}
      <div className="booking-meta">
        <div className="meta-item">
          <span>📅</span>
          <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
        </div>
        <div className="meta-item">
          <span>🕒</span>
          <span>{booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}</span>
        </div>
      </div>

      {/* Booking Purpose */}
      <div className="purpose-text">{booking.purpose}</div>

      {/* Assistant Comment (if exists) */}
      {booking.assistantComment && (
        <div className="comment-box">
          <div className="comment-box-title">Assistant Comment:</div>
          <div style={{ color: 'var(--text-secondary)' }}>{booking.assistantComment}</div>
        </div>
      )}

      {/* Assistant Actions Controls */}
      {userRole === 'Assistant' && (
        <div className="action-controls">
          {booking.status === 'Pending' && (
            <>
              <button
                className="btn btn-approve"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => onOpenModal(booking, 'Approved')}
              >
                Approve
              </button>
              <button
                className="btn btn-reject"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => onOpenModal(booking, 'Rejected')}
              >
                Reject
              </button>
            </>
          )}
          {booking.status === 'Approved' && (
            <button
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)' }}
              onClick={() => onOpenModal(booking, 'Collected')}
            >
              Mark as Collected
            </button>
          )}
          {booking.status === 'Collected' && (
            <button
              className="btn btn-approve"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => onOpenModal(booking, 'Returned')}
            >
              Mark as Returned
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingCard;
