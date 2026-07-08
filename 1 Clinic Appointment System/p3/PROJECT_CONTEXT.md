# Project Context: Clinic Appointment System

## Case Description
The Clinic Appointment System is a lightweight web application designed to replace manual appointment scheduling at a small clinic. Currently, the lack of a digital system prevents receptionists and doctors from staying aligned in real-time. This prototype aims to streamline the core appointment lifecycle, ensuring receptionists can manage bookings efficiently and doctors can view their schedules and record brief visit notes.

---

## Roles and Responsibilities
The system supports two distinct roles, each with defined access boundaries:

1. **Receptionist**
   - **Responsibilities**: Creates, views, updates, and cancels patient appointments.
   - **Permissions**: Full control over booking metadata (patient info, doctor, date, time, reason).
   - **Restrictions**: Strictly prohibited from viewing or editing doctor visit notes.

2. **Doctor**
   - **Responsibilities**: Views their personalized schedule and writes short visit notes after appointments.
   - **Permissions**: Can view appointment schedules and append/edit visit notes.
   - **Restrictions**: Cannot modify booking details (e.g., patient contact info, appointment time) unless absolutely necessary.

---

## Main Entity & Primary Workflow

### The `Appointment` Entity
The database schema will revolve around the `Appointment` entity containing:
- **ID**: Unique identifier (auto-incrementing integer).
- **Patient Name**: String (required).
- **Contact Number**: String (required).
- **Doctor Name**: String (required).
- **Appointment Date**: Date (YYYY-MM-DD).
- **Appointment Time**: Time (HH:MM).
- **Reason for Visit**: Text.
- **Status**: Enum/String (e.g., `pending`, `accepted`, `rejected`, `completed`, `cancelled`).
- **Visit Note**: Text (nullable, editable only by Doctors on accepted appointments).

### Main Workflow
1. **Creation**: Receptionist books an appointment for a patient. (Status: `pending`)
2. **Review**: The assigned Doctor accepts or rejects the appointment. (Status: `accepted` or `rejected`)
3. **Consultation**: The doctor adds visit notes for accepted (confirmed) appointments.
4. **Completion**: The doctor completes the visit, saving notes and updating status. (Status: `completed`)
5. **Cancellation**: Receptionist cancels the appointment if requested. (Status: `cancelled` - allowed for pending and accepted appointments)

---

## Secondary Features
* **Filtering & Search**: Users can filter the schedule by:
  - Doctor Name
  - Appointment Date
  - Appointment Status

---

## Scope Boundaries

### In-Scope (Workshop Prototype)
* **Frontend**: Responsive React single-page application (SPA) with role-switching simulation.
* **Backend**: Node.js with Express exposing REST API endpoints.
* **Database**: Local MySQL database to persist appointments.
* **Validation**: Basic validation for required fields, date formats, and role constraints.
* **Filtering**: Real-time filtering by doctor, date, and status.

### Out-of-Scope (Future Enhancements)
* **Authentication & Authorization**: Full user login, password hashing, and token-based sessions (JWT). (Simplified role switching will be used instead).
* **Roster & Schedule Management**: Complex shift planners, holidays, and clinic operating hour configurations.
* **Patient Records System**: Full medical history tracking, prescription management, or lab reports.
* **Billing & Payments**: Invoicing, insurance processing, or payment gateway integrations.

---

## Assumptions & Missing Details

### Assumptions
* **Role Switcher**: To keep the prototype simple, the UI will feature a prominent role switcher (e.g., a header dropdown) to toggle between "Receptionist" and "Doctor" views.
* **Doctor List**: A fixed list of doctors will be hardcoded in the database/application to facilitate assignment and filtering.
* **Time Slots**: No automatic slot duration checker (e.g., strict 30-minute intervals). Time will be entered manually or via a simple time picker.

### Missing Details
* **Cancellation Policy**: Are cancelled appointments soft-deleted (hidden) or hard-deleted? (Assumption: We will mark status as `Cancelled` and retain them in history).
* **Collision Detection**: Should the system block double-bookings (same doctor, same date, same time) or just warn the receptionist?

---

## Likely Risks
* **Concurrency / Double Bookings**: Multiple receptionists booking the same doctor for the exact same slot concurrently.
* **Bypassing UI Restrictions**: Without a backend authentication layer, a user could theoretically send direct HTTP calls to modify fields they shouldn't (e.g., a receptionist editing visit notes). This risk is accepted for a prototype.
