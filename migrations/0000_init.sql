CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'confirmed' | 'rejected'
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reserved_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  court INTEGER NOT NULL,
  date TEXT NOT NULL,          -- YYYY-MM-DD
  time_slot TEXT NOT NULL,     -- HH:MM AM/PM
  calendar_event_id TEXT,      -- Google Calendar Event ID (filled upon confirmation)
  FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
