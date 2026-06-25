# Feature Update: Owner Confirmation Workflow & Management Dashboard

This document details the functional specifications for introducing a booking confirmation workflow and a business owner management dashboard.

## Key Requirements

### 1. Booking Status & Double Booking Prevention
* **Tentative State**: When a customer submits a booking, it is placed in a **Pending Confirmation** state.
* **Available Slots**: Timeslots and dates remain open and clickable on the user frontend until they are **Confirmed** by the business owner. A pending booking on a slot does *not* block other users from reserving it.
* **Confirmation State**: Once the owner confirms a booking, those timeslots/courts are officially blocked and unavailable to other users.

### 2. Management Dashboard
* **Route**: A secure `/dashboard` route accessible to the business owner.
* **Functionality**:
  - View all reservations with details (Customer Name, Phone, Email, Message, Courts, Dates, Times, Status).
  - Filter bookings by status: **Pending**, **Confirmed**, **Rejected**.
  - Action buttons: **Confirm** or **Reject** pending reservations.

### 3. Notification Flows
* **Awaiting Confirmation**:
  - **Frontend**: The success page must inform the customer that their booking is *awaiting confirmation* and list their reservation details.
  - **Client Email**: Sent immediately stating the reservation is pending approval.
  - **Owner Email**: Sent immediately alerting the owner of a new pending request.
* **Status Updates**:
  - **Confirmed**: When the owner clicks "Confirm", the customer receives a "Booking Confirmed" email, and the status changes.
  - **Rejected**: When the owner clicks "Reject", the customer receives a "Booking Rejected" email.
