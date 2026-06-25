# Cloudflare D1 Database Schema

This document details the SQLite database schema used within the Cloudflare D1 environment for the Athletics Court Booking System.

## Tables

### 1. `bookings`
This table acts as the header record for a reservation. It tracks the customer's contact information and the overarching status of their entire booking request.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Unique short booking ID formatted as `YYMMDD-XXXX` (e.g. `241215-A1B2`). |
| `name` | `TEXT` | `NOT NULL` | Customer's full name. |
| `email` | `TEXT` | | Customer's email address (optional, used for notifications). |
| `phone` | `TEXT` | `NOT NULL` | Customer's contact number. |
| `message` | `TEXT` | | Optional notes or message from the customer. |
| `status` | `TEXT` | `DEFAULT 'pending'` | Overall booking status: `'pending'`, `'confirmed'`, or `'rejected'`. |
| `created_at` | `TEXT` | `NOT NULL` | ISO 8601 timestamp representing when the booking was submitted. |

### 2. `reserved_slots`
This table tracks the granular timeslots requested in a booking. A single batch booking can result in multiple rows here. It supports slot-level status tracking to allow partial rejections/cancellations within a batch booking.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique integer ID for the slot. |
| `booking_id` | `TEXT` | `NOT NULL` | Foreign key linking to `bookings.id`. (`ON DELETE CASCADE`) |
| `court` | `INTEGER` | `NOT NULL` | Court number selected (1 through 6). |
| `date` | `TEXT` | `NOT NULL` | The date of the reservation formatted as `YYYY-MM-DD`. |
| `time_slot` | `TEXT` | `NOT NULL` | The 1-hour time slot formatted as `HH:MM AM/PM` (e.g., `09:00 AM`). |
| `calendar_event_id` | `TEXT` | | The Google Calendar Event ID. Populated only after the slot is confirmed. |
| `status` | `TEXT` | `DEFAULT 'pending'` | Slot-level status: `'pending'`, `'confirmed'`, or `'rejected'`. Allows granular conflict resolution. |

## Relationships

* The `reserved_slots` table has a **Many-to-One** relationship with the `bookings` table via `booking_id`.
* The foreign key employs `ON DELETE CASCADE` so that if a booking header is deleted from the database, all of its child slots are automatically cleaned up.

## Example Usage

**1. Fetching all slots for a specific date:**
```sql
SELECT court, time_slot FROM reserved_slots
JOIN bookings ON reserved_slots.booking_id = bookings.id
WHERE reserved_slots.date = '2024-12-15' AND reserved_slots.status != 'rejected';
```

**2. Calculating the price of a booking:**
```sql
SELECT COUNT(*) * 500 AS total_price 
FROM reserved_slots 
WHERE booking_id = '241215-A1B2' AND status != 'rejected';
```
