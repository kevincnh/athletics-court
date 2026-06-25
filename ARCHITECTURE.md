# Athletics Court Booking System Architecture

## Overview
The Athletics Court Booking System is a web-based application designed to facilitate court reservations for "The Paddle Club". It features an interactive layout map where users can select courts, choose dates and times, and submit reservation requests. 

Rather than booking directly into Google Calendar, reservations are first persisted in a Cloudflare D1 SQL database in a `pending` state. An owner dashboard (accessible at `/dashboard` with passcode protection) allows the business owner to confirm or reject reservations. Once confirmed, the system automatically schedules the sessions on Google Calendar, updates the database, and sends confirmation emails to the client via the Gmail API.

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React (icons)
- **Deployment**: Built into static assets served via Cloudflare

### Backend
- **Framework**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQL Database) for persisting bookings and reserved slots
- **Integrations**: 
  - **Google Calendar API**: To schedule and manage confirmed court booking events.
  - **Gmail API**: To dispatch confirmation/rejection emails to clients and booking notifications to the owner.
  - **Google OAuth2**: Using Refresh Tokens to authorize server-to-server Google API requests.

---

## Database Schema (D1 SQL)

### `bookings` Table
Stores main reservation headers and customer details.
* `id` (TEXT, PK): Unique short booking ID formatted as `YYMMDD-XXXX` (previously UUID).
* `name` (TEXT): Customer's name
* `email` (TEXT): Customer's email
* `phone` (TEXT): Customer's contact number
* `message` (TEXT): Optional customer message/notes
* `status` (TEXT): `'pending'` | `'confirmed'` | `'rejected'`
* `created_at` (TEXT): ISO timestamp of submission

### `reserved_slots` Table
Stores individual timeslots associated with a booking. Allows partial rejection within batch bookings.
* `id` (INTEGER, PK AUTOINCREMENT)
* `booking_id` (TEXT, FK references `bookings.id` ON DELETE CASCADE)
* `court` (INTEGER): Court number (1-6)
* `date` (TEXT): Booking date (`YYYY-MM-DD`)
* `time_slot` (TEXT): Selected timeslot string (e.g. `'09:00 AM'`)
* `calendar_event_id` (TEXT): Google Calendar event ID (populated after owner confirmation)
* `status` (TEXT): `'pending'` | `'confirmed'` | `'rejected'` (Tracks granular slot status to support partial rejections)

### `settings` Table
Stores global configuration flags and system preferences.
* `key` (TEXT, PK): The setting identifier (e.g., `'send_owner_notifications'`).
* `value` (TEXT): The setting value (e.g., `'true'` or `'false'`).

---

## User Interaction Workflows

### 1. Customer Booking Workflow
1. **Court Selection**: The user interacts with the top-down graphical layout of the courts. Clicking courts toggles selection.
2. **Scheduling Mode**: The user chooses between **Batch** (apply same date & time to all courts) or **Individual** scheduling.
3. **Detail Submission**: The customer enters Name, Email, Phone, and optional Message, then submits.
4. **Pending Confirmation Screen**: The frontend displays a success alert stating the booking is "Awaiting Confirmation" with slot summaries.

```mermaid
sequenceDiagram
    participant U as Customer (Browser)
    participant F as Frontend (React UI)
    participant DB as Cloudflare D1 Database
    participant W as Cloudflare Worker (/api/book)
    participant Gmail as Gmail API

    U->>F: Submit booking details
    F->>W: POST /api/book (bookings array, customer details)
    W->>DB: INSERT into bookings (status = 'pending')
    W->>DB: INSERT into reserved_slots
    W->>Gmail: Send "Awaiting Confirmation" notification to Customer
    W->>Gmail: Send "Action Required" notification to Owner
    W-->>F: 200 OK (bookingId)
    F-->>U: Show "Awaiting Confirmation" screen
```

### 2. Owner Confirmation & Management Workflow
1. **Dashboard Access**: The owner navigates to `/dashboard` and enters the security passcode (`admin123`).
2. **Modular Dashboard Rendering**: The dashboard UI (`src/app/App.tsx`) is split into specialized sub-views (`DashboardView.tsx`, `BookingsView.tsx`, `CourtsView.tsx`) rendered conditionally based on navigation state to improve maintainability and rendering efficiency. The `DashboardView` features a dynamically calculated "Activity by Day" chart that tallies valid slots by their day of the week across all bookings to visualize peak activity trends.
3. **Double Booking Detection & Resolution UI**: The system cross-references pending booking slots against all active bookings. In both the `DashboardView` and `BookingsView`, conflicting pending requests are grouped into a single unified Conflict Card. The conflict card lists the specific conflicting slot alongside any *other* non-conflicting slots requested within the same batch (arranged in a grid with an explicit warning note that they are waiting for conflict resolution). The owner can inspect the details side-by-side and choose which request to confirm at a granular slot-level. Confirming one slot automatically triggers the rejection of that specific slot for all other conflicting pending bookings, without rejecting their entire batch.
4. **Court Date Selection & Calendar Popover**: The date selection header in the Courts view uses a seamless navigation pill. It groups Chevron navigation arrows together and integrates a custom styled `Popover` and `Calendar` component. This custom date picker allows the user to browse dates with a calendar popup that matches the theme and visual aesthetics of the dashboard, replacing default browser/OS widgets.
5. **Interactive Modals with Backdrop Dismissal**: Details and conflict modals are configured to support backdrop click dismissal. Clicking on the dark semi-transparent overlay backdrop closes the modal, whereas clicking inside the card content propagates no events and keeps the modal open.
6. **Explicit Search Interface**: To prevent immediate keystroke filtering confusion, the Bookings view uses an explicit search control. It includes a text input, an inline clear (`X`) button to instantly reset queries, and a dedicated "Search" button (or `Enter` key trigger) to apply filters.
8. **Global Settings Management**: The dashboard sidebar includes an "Email Alerts" toggle. This switch interacts with the `POST /api/settings` endpoint to persistently enable or disable the automated "Action Required" email sent to the owner upon new booking submissions.
9. **Action (Confirm)**: Owner clicks "Confirm". The worker marks the booking status as `confirmed`, creates Google Calendar events, and emails the customer.
10. **Action (Reject)**: Owner clicks "Reject". The worker marks the status as `rejected` and emails a decline notification to the customer.

```mermaid
sequenceDiagram
    participant O as Owner (Dashboard)
    participant W as Cloudflare Worker
    participant DB as Cloudflare D1 Database
    participant GCal as Google Calendar API
    participant Gmail as Gmail API

    O->>W: POST /api/bookings/confirm (bookingId)
    W->>DB: Fetch booking and slots
    W->>GCal: Create Google Calendar event for each slot
    W->>DB: UPDATE reserved_slots (set calendar_event_id)
    W->>DB: UPDATE bookings (set status = 'confirmed')
    W->>Gmail: Send "Booking Confirmed" email to Customer
    W-->>O: 200 OK (Success, list re-fetches)
```

---

## Customization and Branding Guide (White-Label Setup)

### 1. Frontend Logo & Branding
* **Banner Text**: Edit the absolute header banner container inside **[App.tsx](file:///c:/Website/service-provider/booking/athletics-court/src/app/App.tsx)**. Locate `THE PADDLE CLUB` and change the text values or swap them with an image tag.
* **Colors & Theme**: Swap Tailwind color accents (e.g., `bg-slate-800`, `text-amber-400`) to match your customer's branding.

### 2. Email Notifications & Owner Address
* **Branding Logo**: The styled header HTML badge (`emailHeaderHtml`) is defined inside **[worker.ts](file:///c:/Website/service-provider/booking/athletics-court/src/worker.ts)**. Adjust styling and text here.
* **Owner Destination Email**: The worker dynamically routes owner notifications to the email address set in the **`GOOGLE_CALENDAR_ID`** environment variable. When onboarding new clients, update this value in **[wrangler.toml](file:///c:/Website/service-provider/booking/athletics-court/wrangler.toml)**.
