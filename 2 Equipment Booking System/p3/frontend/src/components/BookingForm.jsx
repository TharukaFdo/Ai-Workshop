import React, { useState, useEffect } from 'react';

const PREDEFINED_EQUIPMENT = [
  'Electron Microscope',
  'Centrifuge X1',
  'Spectrophotometer',
  'PCR Thermocycler',
  'Gas Chromatograph',
  'Fume Hood Delta'
];

export default function BookingForm({ booking, onSubmit, onCancel }) {
  const [equipmentName, setEquipmentName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');

  // If editing an existing booking, populate fields
  useEffect(() => {
    if (booking) {
      setEquipmentName(booking.equipmentName || '');
      // Ensure date is formatted YYYY-MM-DD
      const formattedDate = booking.bookingDate ? booking.bookingDate.split('T')[0] : '';
      setBookingDate(formattedDate);
      // Ensure time is formatted HH:MM
      setStartTime(booking.startTime ? booking.startTime.substring(0, 5) : '');
      setEndTime(booking.endTime ? booking.endTime.substring(0, 5) : '');
      setPurpose(booking.purpose || '');
    } else {
      setEquipmentName(PREDEFINED_EQUIPMENT[0]);
      setBookingDate('');
      setStartTime('');
      setEndTime('');
      setPurpose('');
    }
    setError('');
  }, [booking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!equipmentName || !bookingDate || !startTime || !endTime || !purpose.trim()) {
      setError('All fields are required.');
      return;
    }

    if (endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }

    onSubmit({
      equipmentName,
      bookingDate,
      startTime,
      endTime,
      purpose
    });
  };

  return (
    <form className="booking-form card" onSubmit={handleSubmit}>
      <h3>{booking ? 'Edit Booking Request' : 'New Booking Request'}</h3>
      
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="equipment">Equipment Name</label>
        <select
          id="equipment"
          value={equipmentName}
          onChange={(e) => setEquipmentName(e.target.value)}
        >
          {PREDEFINED_EQUIPMENT.map((eq) => (
            <option key={eq} value={eq}>{eq}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="booking-date">Booking Date</label>
        <input
          type="date"
          id="booking-date"
          required
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start-time">Start Time</label>
          <input
            type="time"
            id="start-time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end-time">End Time</label>
          <input
            type="time"
            id="end-time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="purpose">Purpose</label>
        <textarea
          id="purpose"
          required
          rows="3"
          maxLength="500"
          placeholder="Explain the experiment / research purpose..."
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {booking ? 'Save Changes' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}
