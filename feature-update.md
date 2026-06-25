# Feature Update: Owner Confirmation Workflow & Management Dashboard

This document details the functional specifications for introducing a booking confirmation workflow and a business owner management dashboard.

## Key Requirements

### 1. Booking Status & Double Booking Prevention
* **Tentative State**: When a customer submits a booking, it is placed in a **Pending Confirmation** state.
* **Available Slots**: Timeslots and dates remain open and clickable on the user frontend until they are **Confirmed** by the business owner. A pending booking on a slot does *not* block other users from reserving it.
* **Double Booking Logic**: If multiple pending bookings request the same timeslot/court, the system flags a **Conflict** and joins/groups the conflicting bookings into a single visual Conflict Card container in both the Dashboard and Bookings views. The owner is presented with the choices side-by-side (or stacked on mobile) and can confirm one, which automatically confirms that selection and declines all other conflicting pending bookings.
* **More Prominent Headers**: Dashboard header separator lines are styled with `border-b-2 border-slate-400` to improve UI visibility and scanability.
* **Confirmation State**: Once the owner confirms a booking, those timeslots/courts are officially blocked and unavailable to other users.

### 2. Management Dashboard
* **Route**: A secure `/dashboard` route accessible to the business owner.
* **Modular Views**: The dashboard is split into dedicated components to optimize rendering:
  - **Dashboard**: High-level metrics, facilities status grid, weekly activity charts, and a summary list of pending/confirmed bookings.
  - **Bookings**: A dedicated list for managing all reservations. Filters allow viewing by **Pending**, **Confirmed**, and **Rejected**. This is where owners resolve double-booking conflicts.
  - **Courts**: A timeline calendar view summarizing the availability across all 6 courts for a specific date, highlighting Available, Pending, and Confirmed timeslots.
* **Functionality**:
  - View all reservations with details (Customer Name, Phone, Email, Message, Courts, Dates, Times, Status, Total Revenue).
  - **Partial Cancellations/Rejections**: Multi-slot batch bookings track statuses at a granular slot level. The owner can cancel/reject individual slots within a booking without rejecting the entire batch booking. The total amount due dynamically recalculates.
  - Action buttons: **Confirm** or **Reject** pending reservations (via the Bookings tab or non-conflicting Dashboard entries).
  - **Shorter Booking IDs**: IDs are generated in a highly readable `YYMMDD-XXXX` format (e.g. `241215-A1B2`) rather than standard UUIDs.
  - **Explicit Search Action**: The Bookings tab search input does not filter instant keystrokes automatically. It requires clicking a dedicated "Search" button or pressing the `Enter` key. A clear button (`X`) is nested inside the input to clear and reset the search query.
  - **Cohesive Date Picker**: The Courts view date selection operates via a custom Popover Calendar widget. The navigation is housed in a single seamless pill where the Left/Right chevrons are grouped together and the date text serves as a button that triggers a custom calendar card.
  - **Click-Outside Modal Dismissal**: Custom overlay modals (Booking Details and Conflict Details) close instantly when the user clicks anywhere on the dark backdrop overlay outside of the modal card. Clicks inside the card do not close the modal.

### 3. Notification Flows
* **Awaiting Confirmation**:
  - **Frontend**: The success page must inform the customer that their booking is *awaiting confirmation* and list their reservation details.
  - **Client Email**: Sent immediately stating the reservation is pending approval.
  - **Owner Email**: Sent immediately alerting the owner of a new pending request.
* **Status Updates**:
  - **Confirmed**: When the owner clicks "Confirm", the customer receives a "Booking Confirmed" email, and the status changes.
  - **Rejected**: When the owner clicks "Reject", the customer receives a "Booking Rejected" email.
