# Feature Demonstration: The Paddle Club Booking System

Welcome to the comprehensive guide to **The Paddle Club** indoor court booking system. This application is a React-based single-page application (SPA) backed by a Cloudflare Worker and D1 SQL database.

This document demonstrates the core functionalities of the system, particularly focusing on the administrative workflow and the robust double-booking conflict resolution system.

---

## 1. Customer Booking Experience

### Seamless Selection
Users can seamlessly browse available courts (Courts 1-6) and select their desired timeslots. The interface is optimized to allow batch booking—users can select multiple hours across different courts on different dates in a single checkout flow.

### "Pending Confirmation" State
When a customer submits a reservation, it is placed in a **Pending Confirmation** state. 
- **Open Availability:** Crucially, the timeslots remain visually open and clickable on the user-facing site. 
- **Non-blocking:** A pending booking does not block other users from requesting the same slot, ensuring the business owner can choose which booking to accept if demand is high.

---

## 2. The Owner Management Dashboard

The dashboard (`/dashboard`) is a secure, passcode-protected administrative interface designed for efficiency. 

### Modular Views
- **Overview (Dashboard):** Features high-level revenue metrics, a facilities status grid, and a dynamic "Activity by Day" bar chart aggregating real booking data.
- **Courts (Timeline):** A visual timeline calendar summarizing availability across all 6 courts. It features a custom Popover Calendar widget for easy date navigation and sticky headers for scrolling.
- **Bookings (List):** A dedicated list for managing all reservations. Includes an explicit Search bar (requires clicking "Search" or "Enter") to filter by ID, Name, or Phone, and tabs for `Pending`, `Confirmed`, and `Rejected`.

### Global Settings
Located conveniently in the sidebar, the owner has instant control over system automations:
- **Email Alerts:** Toggle on/off the "Action Required" notification sent to the owner's inbox for new bookings.
- **Calendar Auto-Sync:** Toggle on/off the automatic creation of events in the owner's Google Calendar upon confirming a booking.

---

## 3. Double-Booking Conflict Resolution (Core Feature)

Because pending bookings do not block slots, it is entirely possible (and expected) for multiple users to request the same court at the same time. The system handles this gracefully through a granular **Slot-Level Conflict Resolution** mechanism.

### The Scenario
1. **User A** requests Court 1 at 09:00 AM.
2. **User B** also requests Court 1 at 09:00 AM (as part of a larger 3-hour batch booking).

### Flagging the Conflict
In the owner's Bookings dashboard, the system detects the overlap and automatically visually groups them into a prominent **Conflict Card** (marked with an amber `CONFLICT` badge). 
- The conflicting slot (Court 1, 09:00 AM) is presented side-by-side.
- The owner can review both customers' details, notes, and the size of their total reservation.

### Granular Resolution
- The owner clicks **"Confirm slot for User A"**.
- **The System Action:**
  - The slot is instantly confirmed for User A.
  - The slot is automatically **rejected for User B**.
  - *Crucially*, the system **does not reject User B's entire booking**. The other 2 hours in User B's batch remain pending. The Conflict Card clearly displays these remaining non-conflicting slots in a compact grid, warning the owner that they are awaiting separate confirmation or rejection.

### Splitting Bookings
If User B's remaining slots are later confirmed, the backend dynamically "splits" the booking. It generates a new highly-readable Booking ID (e.g., `241215-A1B2`) for the confirmed slots, ensuring precise financial and status tracking.

---

## 4. Automated Notifications & Sync

The system keeps all parties informed automatically via the Gmail and Google Calendar APIs.

* **Customer Emails:**
  - "Awaiting Confirmation" upon submission.
  - "Booking Confirmed" (custom HTML detailing the courts, dates, and times) when the owner approves a slot.
  - "Booking Declined" if the owner rejects the slot or resolves a conflict against them.
* **Owner Automations:**
  - "Action Required" email (if toggle is enabled).
  - Google Calendar event created with the customer's contact details (if Auto-Sync toggle is enabled).

---

*This system ensures maximum booking yield for the business owner while providing a transparent, fair experience for customers.*
