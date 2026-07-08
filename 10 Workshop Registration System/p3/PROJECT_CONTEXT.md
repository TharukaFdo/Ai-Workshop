# Project Context: Workshop Registration System

## Project Overview & Restatement
The Workshop Registration System is a prototype web application designed to manage participant sign-ups and attendance for training workshops. It bridges the gap between two user types: **Participants**, who need a frictionless way to register for workshops and monitor their status, and **Organizers**, who require administrative control to view, filter, update registration status, add notes, and track attendance (present or absent). This system is a self-contained prototype built using React, Node.js with Express, and a local MySQL database.

---

## Roles and Responsibilities

### 1. Participant
- **Register for a Workshop**: Submit name, email, workshop title, and additional registration details.
- **Track Status**: View their registration status (Pending, Confirmed, or Cancelled) and attendance status.
- **Access Control**: Prohibited from marking their own attendance, editing organizer notes, or viewing other participants' registrations.

### 2. Organizer
- **View Registrations**: Access a comprehensive list of all workshop registrations.
- **Manage Statuses**: Update the status of any registration (e.g., Confirm or Cancel a pending registration).
- **Add Notes**: Record organizer-specific notes on any registration record.
- **Mark Attendance**: Mark participants as either *Present* or *Absent*.
- **Filter Registrations**: Sort and filter the registration table by workshop title, registration status, and attendance status.

---

## Main Entity & Primary Workflow

### Main Entity: `Registration`
A registration record holds the relationship between a participant and a workshop. Key fields include:
- `id` (Primary Key)
- `participant_name`
- `participant_email`
- `workshop_title`
- `registration_details` (e.g., questions, dietary requirements, background info)
- `status` (`Pending`, `Confirmed`, `Cancelled`)
- `attendance` (`Unmarked`, `Present`, `Absent`)
- `organizer_notes` (Text)
- `created_at` / `updated_at` (Timestamps)

### Primary Workflow (Happy Path)
1. **Registration**: A Participant fills out a form specifying their details and workshop choice. The registration is saved as `Pending` by default.
2. **Review & Action**: An Organizer reviews the pending registrations, updates the status to `Confirmed`, and adds any relevant setup notes.
3. **Attendance Tracking**: On the day of the workshop, the Organizer uses the system to mark the Participant as `Present` or `Absent`.
4. **Status Check**: The Participant can search or view their registration entry to check its confirmation and attendance status.

---

## Secondary Features
- **Filtering and Sorting**: Advanced search and filter controls for Organizers to quickly segment registrations by workshop title, registration status, or attendance.
- **Mock Authentication / Role Switching**: Simple visual toggle or login to simulate switching between the Participant and Organizer views.

---

## Scope Boundaries

### In Scope
- Simple registration form for participants.
- Single-page application dashboard for organizers with search/filtering capabilities.
- Backend API endpoints to handle registration creation, status updates, organizer notes updates, and attendance tracking.
- Local MySQL database storage.

### Out of Scope (Explicitly Excluded)
- Payment processing or fee collection.
- Automated email notifications or reminders (e.g., confirmation emails).
- Automatic generation or distribution of attendance certificates.
- Complex user authentication system (like OAuth, JWT, session stores) - a simple role selector/header switcher is sufficient for this prototype.

---

## Assumptions & Missing Details

### Assumptions
1. **Workshop Selection**: Workshops are pre-defined (either hardcoded in the system or populated in a simple lookup table) rather than dynamically managed via an organizer workshop builder.
2. **Single Registration**: A participant (uniquely identified by email) registers once per workshop title.
3. **Local Dev Environment**: The app is designed for local setup with a standard local MySQL database instance.

### Missing Details
- **Workshop Schedule/Metadata**: Do workshops have dates, times, or seat limits? (Assumed not needed for this basic registration prototype unless requested).
- **Security Requirements**: No password-protection or multi-tenant separation is requested, so role enforcement will be implemented via client/server routing conventions.

---

## Likely Risks & Mitigation Strategies
- **SQL Injection**: Since a MySQL database is used, parameterized queries must be enforced on all backend API routes.
- **Unauthorized Actions**: A participant could potentially trigger API endpoints meant for organizers (e.g., marking attendance). *Mitigation*: Simple mock header role validation on API requests to block unauthorized updates.
- **Duplicate Registrations**: A participant might submit the registration form multiple times. *Mitigation*: Implement database/backend check to prevent duplicate email-workshop combinations.
