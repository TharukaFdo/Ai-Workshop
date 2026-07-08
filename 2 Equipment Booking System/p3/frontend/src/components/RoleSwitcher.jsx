import React from 'react';

const MOCK_USERS = [
  { id: 1, username: 'alice_staff', role: 'staff', label: 'Alice (Staff)' },
  { id: 2, username: 'bob_staff', role: 'staff', label: 'Bob (Staff)' },
  { id: 3, username: 'charlie_assistant', role: 'assistant', label: 'Charlie (Assistant)' }
];

export default function RoleSwitcher({ currentUser, onUserChange }) {
  return (
    <div className="role-switcher">
      <label htmlFor="user-select">Act as User: </label>
      <select
        id="user-select"
        value={currentUser.username}
        onChange={(e) => {
          const selected = MOCK_USERS.find(u => u.username === e.target.value);
          if (selected) onUserChange(selected);
        }}
      >
        {MOCK_USERS.map((user) => (
          <option key={user.id} value={user.username}>
            {user.label}
          </option>
        ))}
      </select>
      <span className="role-badge" data-role={currentUser.role}>
        {currentUser.role.toUpperCase()}
      </span>
    </div>
  );
}
