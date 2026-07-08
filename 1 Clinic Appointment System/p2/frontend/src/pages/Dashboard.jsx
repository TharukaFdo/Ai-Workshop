import React, { useState, useEffect } from 'react';
import { 
  getAppointments, 
  createAppointment, 
  updateAppointment, 
  updateVisitNote, 
  cancelAppointment,
  acceptAppointment,
  rejectAppointment
} from '../services/api';

export default function Dashboard({ currentUser }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modals / Form States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null); // If set, we are editing
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedAppointmentForNote, setSelectedAppointmentForNote] = useState(null);

  // Form Fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Smith');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('pending');
  
  // Note Field
  const [visitNote, setVisitNote] = useState('');
  
  // Validation error state
  const [formValidationError, setFormValidationError] = useState('');

  // Map user to doctor filter
  useEffect(() => {
    if (currentUser.role === 'doctor') {
      if (currentUser.username === 'dr_smith') {
        setFilterDoctor('Dr. Smith');
      } else if (currentUser.username === 'dr_adams') {
        setFilterDoctor('Dr. Adams');
      }
    } else {
      setFilterDoctor('');
    }
  }, [currentUser]);

  // Load appointments
  useEffect(() => {
    fetchAppointments();
  }, [filterDoctor, filterStatus, filterDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppointments({
        doctor: filterDoctor,
        status: filterStatus,
        date: filterDate
      });
      setAppointments(data);
    } catch (err) {
      setError('Could not connect to the database. Make sure Express server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingAppointment(null);
    setPatientName('');
    setPatientPhone('');
    setDoctorName('Dr. Smith');
    setAppointmentDate('');
    setAppointmentTime('');
    setReason('');
    setStatus('pending');
    setFormValidationError('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (app) => {
    setEditingAppointment(app);
    setPatientName(app.patient_name);
    setPatientPhone(app.patient_phone);
    setDoctorName(app.doctor_name);
    const dateFormatted = app.appointment_date.split('T')[0];
    setAppointmentDate(dateFormatted);
    setAppointmentTime(app.appointment_time);
    setReason(app.reason);
    setStatus(app.status);
    setFormValidationError('');
    setShowFormModal(true);
  };

  const handleOpenNoteModal = (app) => {
    setSelectedAppointmentForNote(app);
    setVisitNote(app.visit_note || '');
    setFormValidationError('');
    setShowNoteModal(true);
  };

  // Validate form entries
  const validateForm = () => {
    if (!patientName.trim() || !patientPhone.trim() || !appointmentDate || !appointmentTime || !reason.trim()) {
      return 'All fields are required.';
    }
    if (!/^[a-zA-Z\s]+$/.test(patientName)) {
      return 'Patient Name must contain letters and spaces only.';
    }
    if (!/^[0-9\-\+\s\(\)]+$/.test(patientPhone)) {
      return 'Patient Phone contains invalid characters.';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(appointmentDate);
    if (selectedDate < today) {
      return 'Appointment Date must not be in the past.';
    }
    return null;
  };

  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    const valError = validateForm();
    if (valError) {
      setFormValidationError(valError);
      return;
    }

    const payload = {
      patient_name: patientName,
      patient_phone: patientPhone,
      doctor_name: doctorName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      reason,
      status
    };

    try {
      if (editingAppointment) {
        await updateAppointment(editingAppointment.id, payload);
      } else {
        await createAppointment(payload);
      }
      setShowFormModal(false);
      fetchAppointments();
    } catch (err) {
      setFormValidationError(err.message || 'Error occurred while saving');
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!visitNote.trim()) {
      setFormValidationError('Visit note content cannot be empty.');
      return;
    }

    try {
      await updateVisitNote(selectedAppointmentForNote.id, { visit_note: visitNote });
      setShowNoteModal(false);
      fetchAppointments();
    } catch (err) {
      setFormValidationError(err.message || 'Error occurred while saving note.');
    }
  };

  const handleAcceptClick = async (id) => {
    try {
      await acceptAppointment(id);
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to accept appointment.');
    }
  };

  const handleRejectClick = async (id) => {
    if (window.confirm('Are you sure you want to reject this appointment?')) {
      try {
        await rejectAppointment(id);
        fetchAppointments();
      } catch (err) {
        alert(err.message || 'Failed to reject appointment.');
      }
    }
  };

  const handleCancelClick = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelAppointment(id);
        fetchAppointments();
      } catch (err) {
        alert('Failed to cancel appointment.');
      }
    }
  };

  const isReceptionist = currentUser.role === 'receptionist';
  const isDoctor = currentUser.role === 'doctor';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-info">
          <h1>Clinic Schedule</h1>
          <p className="role-indicator">
            Logged in as <strong>{currentUser.username}</strong> ({currentUser.role})
          </p>
        </div>
        {isReceptionist && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            + New Appointment
          </button>
        )}
      </header>

      {/* Filters */}
      <section className="filter-panel">
        <div className="filter-group">
          <label htmlFor="filter-doctor">Doctor:</label>
          <select
            id="filter-doctor"
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            disabled={isDoctor}
          >
            {isReceptionist && <option value="">All Doctors</option>}
            <option value="Dr. Smith">Dr. Smith</option>
            <option value="Dr. Adams">Dr. Adams</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-status">Status:</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-date">Date:</label>
          <input
            type="date"
            id="filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </section>

      {/* Appointment Table */}
      <section className="appointments-section">
        {loading && <p className="alert alert-info">Loading appointment schedules...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && appointments.length === 0 ? (
          <div className="empty-state">
            <p>No appointments found matching the criteria.</p>
          </div>
        ) : (
          !loading && !error && (
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Contact Phone</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Visit Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((app) => (
                  <tr key={app.id}>
                    <td className="bold-text">{app.patient_name}</td>
                    <td>{app.patient_phone}</td>
                    <td>{app.doctor_name}</td>
                    <td>{app.appointment_date} @ {app.appointment_time.slice(0, 5)}</td>
                    <td>{app.reason}</td>
                    <td>
                      <span className={`status-badge status-${app.status}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="visit-notes-cell">
                      {app.visit_note ? (
                        <span className="note-text">{app.visit_note}</span>
                      ) : (
                        <em className="text-muted">No notes added</em>
                      )}
                    </td>
                    <td>
                      <div className="actions-cell">
                        {isReceptionist && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(app)}
                              className="btn btn-secondary btn-sm"
                            >
                              Edit
                            </button>
                            {app.status !== 'cancelled' && (
                              <button
                                onClick={() => handleCancelClick(app.id)}
                                className="btn btn-danger btn-sm"
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                        {isDoctor && (
                          <>
                            {app.status === 'pending' && (
                              <div className="doctor-decision-actions">
                                <button
                                  onClick={() => handleAcceptClick(app.id)}
                                  className="btn btn-primary btn-sm"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectClick(app.id)}
                                  className="btn btn-danger btn-sm"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {(app.status === 'confirmed' || app.status === 'completed') && (
                              <button
                                onClick={() => handleOpenNoteModal(app)}
                                className="btn btn-primary btn-sm"
                              >
                                Add/Edit Note
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </section>

      {/* BOOKING MODAL (CREATE/EDIT) */}
      {showFormModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>{editingAppointment ? 'Update Appointment Booking' : 'New Patient Booking'}</h3>
            {formValidationError && <div className="alert alert-error">{formValidationError}</div>}

            <form onSubmit={handleSaveAppointment}>
              <div className="form-group">
                <label>Patient Name</label>
                <input
                  type="text"
                  placeholder="Letters and spaces only"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Patient Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 555-0199"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assigned Doctor</label>
                <select value={doctorName} onChange={(e) => setDoctorName(e.target.value)}>
                  <option value="Dr. Smith">Dr. Smith</option>
                  <option value="Dr. Adams">Dr. Adams</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason for Visit</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                ></textarea>
              </div>

              {editingAppointment && (
                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISIT NOTE MODAL (DOCTOR) */}
      {showNoteModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Add Doctor Visit Note</h3>
            <p>
              Patient: <strong>{selectedAppointmentForNote?.patient_name}</strong>
            </p>
            {formValidationError && <div className="alert alert-error">{formValidationError}</div>}

            <form onSubmit={handleSaveNote}>
              <div className="form-group">
                <label>Short Visit Summary & Note</label>
                <textarea
                  rows="5"
                  placeholder="Enter medical observations, treatment recommendations, or visit summary..."
                  value={visitNote}
                  onChange={(e) => setVisitNote(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowNoteModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Complete Visit & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
