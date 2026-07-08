import React, { useState, useEffect } from 'react';

export default function BookingForm({ booking, onSubmit, onCancel, error, loading }) {
  const [roomName, setRoomName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (booking) {
      setRoomName(booking.room_name || '');
      // Format date to YYYY-MM-DD
      const dateStr = booking.booking_date ? booking.booking_date.split('T')[0] : '';
      setBookingDate(dateStr);
      setStartTime(booking.start_time || '');
      setEndTime(booking.end_time || '');
      setPurpose(booking.purpose || '');
      setRequesterName(booking.requester_name || '');
    } else {
      // Default to empty for creation
      setRoomName('');
      setBookingDate('');
      setStartTime('');
      setEndTime('');
      setPurpose('');
      setRequesterName('');
    }
    setFormError('');
  }, [booking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!roomName.trim() || !bookingDate || !startTime || !endTime || !purpose.trim() || !requesterName.trim()) {
      setFormError('All fields are required');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (bookingDate < today) {
      setFormError('Booking date cannot be in the past');
      return;
    }

    if (startTime >= endTime) {
      setFormError('Start time must be before end time');
      return;
    }

    onSubmit({
      room_name: roomName,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      purpose,
      requester_name: requesterName
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: '1.5rem' }}>
        {booking ? 'Edit Booking Request' : 'New Booking Request'}
      </h2>

      {(error || formError) && (
        <div className="alert alert-danger">{formError || error}</div>
      )}

      <div className="form-group">
        <label htmlFor="roomName">Room Name</label>
        <input
          id="roomName"
          type="text"
          className="form-control"
          placeholder="e.g., Conference Room A"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="bookingDate">Booking Date</label>
        <input
          id="bookingDate"
          type="date"
          className="form-control"
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="startTime">Start Time</label>
          <input
            id="startTime"
            type="time"
            className="form-control"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="endTime">End Time</label>
          <input
            id="endTime"
            type="time"
            className="form-control"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="purpose">Purpose</label>
        <input
          id="purpose"
          type="text"
          className="form-control"
          placeholder="e.g., Team Sync Meeting"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="requesterName">Your Name</label>
        <input
          id="requesterName"
          type="text"
          className="form-control"
          placeholder="e.g., Alice Smith"
          value={requesterName}
          onChange={(e) => setRequesterName(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}
