import React from 'react';

function BookingForm({
  formBooking,
  setFormBooking,
  equipmentList,
  handleCreateBooking
}) {
  return (
    <aside className="glass-panel" style={{ height: 'fit-content' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🔬</span> Request Equipment
      </h2>
      <form onSubmit={handleCreateBooking}>
        <div className="form-group">
          <label htmlFor="equipmentName">Equipment</label>
          <select
            id="equipmentName"
            value={formBooking.equipmentName}
            onChange={(e) => setFormBooking({ ...formBooking, equipmentName: e.target.value })}
            required
          >
            <option value="">Select Equipment</option>
            {equipmentList.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="bookingDate">Date</label>
          <input
            type="date"
            id="bookingDate"
            min={new Date().toISOString().split('T')[0]}
            value={formBooking.bookingDate}
            onChange={(e) => setFormBooking({ ...formBooking, bookingDate: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="startTime">Start Time</label>
            <input
              type="time"
              id="startTime"
              value={formBooking.startTime}
              onChange={(e) => setFormBooking({ ...formBooking, startTime: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">End Time</label>
            <input
              type="time"
              id="endTime"
              value={formBooking.endTime}
              onChange={(e) => setFormBooking({ ...formBooking, endTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="purpose">Purpose</label>
          <textarea
            id="purpose"
            placeholder="Explain why you need this equipment..."
            value={formBooking.purpose}
            onChange={(e) => setFormBooking({ ...formBooking, purpose: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
          Submit Request
        </button>
      </form>
    </aside>
  );
}

export default BookingForm;
