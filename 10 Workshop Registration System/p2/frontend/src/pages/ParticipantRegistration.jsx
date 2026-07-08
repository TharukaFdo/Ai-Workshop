import React, { useState } from 'react';

const WORKSHOPS = [
  'Introduction to React & State Management',
  'Building REST APIs with Express & MySQL',
  'Advanced Frontend Systems & Deployment'
];

export default function ParticipantRegistration() {
  const [formData, setFormData] = useState({
    participantName: '',
    email: '',
    workshopTitle: WORKSHOPS[0],
    registrationDetails: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (!formData.participantName.trim()) {
      setError('Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('sessionToken');
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      setSuccess('Successfully registered! Your registration is now pending review.');
      setFormData({
        participantName: '',
        email: '',
        workshopTitle: WORKSHOPS[0],
        registrationDetails: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#fff' }}>Workshop Registration</h2>
      
      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '8px', color: '#4ade80', marginBottom: '1.25rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="participantName" style={{ fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
        <input
          id="participantName"
          name="participantName"
          type="text"
          placeholder="John Doe"
          value={formData.participantName}
          onChange={handleChange}
          disabled={loading}
        />

        <label htmlFor="email" style={{ fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>Email Address *</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />

        <label htmlFor="workshopTitle" style={{ fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>Select Workshop *</label>
        <select
          id="workshopTitle"
          name="workshopTitle"
          value={formData.workshopTitle}
          onChange={handleChange}
          disabled={loading}
        >
          {WORKSHOPS.map((workshop) => (
            <option key={workshop} value={workshop} style={{ background: '#1e1b29', color: '#fff' }}>
              {workshop}
            </option>
          ))}
        </select>

        <label htmlFor="registrationDetails" style={{ fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>Additional Details (Optional)</label>
        <textarea
          id="registrationDetails"
          name="registrationDetails"
          rows="4"
          placeholder="Prerequisites met, questions, requirements, etc."
          value={formData.registrationDetails}
          onChange={handleChange}
          disabled={loading}
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
