const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const getAppointments = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_URL}/appointments?${params}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch appointments');
  }
  return response.json();
};

export const createAppointment = async (appointmentData) => {
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(appointmentData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create appointment');
  }
  return response.json();
};

export const updateAppointment = async (id, appointmentData) => {
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(appointmentData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update appointment');
  }
  return response.json();
};

export const acceptAppointment = async (id) => {
  const response = await fetch(`${API_URL}/appointments/${id}/accept`, {
    method: 'PUT',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to accept appointment');
  }
  return response.json();
};

export const rejectAppointment = async (id) => {
  const response = await fetch(`${API_URL}/appointments/${id}/reject`, {
    method: 'PUT',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to reject appointment');
  }
  return response.json();
};

export const updateVisitNote = async (id, noteData) => {
  const response = await fetch(`${API_URL}/appointments/${id}/note`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(noteData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update visit note');
  }
  return response.json();
};

export const cancelAppointment = async (id) => {
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to cancel appointment');
  }
  return response.json();
};
