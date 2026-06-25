export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for local/cross-origin requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const jsonResponse = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    };

    // 1. GET /api/availability?date=YYYY-MM-DD
    if (url.pathname === "/api/availability" && request.method === "GET") {
      try {
        const dateStr = url.searchParams.get("date");
        if (!dateStr) return jsonResponse({ error: "Missing date parameter" }, 400);

        const { results } = await env.DB.prepare(`
          SELECT court, time_slot FROM reserved_slots
          JOIN bookings ON reserved_slots.booking_id = bookings.id
          WHERE reserved_slots.date = ?1 AND bookings.status = 'confirmed'
        `).bind(dateStr).all();

        return jsonResponse({ success: true, reservedSlots: results });
      } catch (err: any) {
        return jsonResponse({ error: err.message || "Failed to fetch availability" }, 500);
      }
    }

    // 2. GET /api/bookings
    if (url.pathname === "/api/bookings" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(`
          SELECT 
            b.id, b.name, b.email, b.phone, b.message, b.status, b.created_at,
            r.court, r.date, r.time_slot
          FROM bookings b
          LEFT JOIN reserved_slots r ON b.id = r.booking_id
          ORDER BY b.created_at DESC
        `).all();

        // Group slots by booking ID
        const bookingsMap: Record<string, any> = {};
        for (const row of results) {
          if (!bookingsMap[row.id]) {
            bookingsMap[row.id] = {
              id: row.id,
              name: row.name,
              email: row.email,
              phone: row.phone,
              message: row.message,
              status: row.status,
              createdAt: row.created_at,
              slots: []
            };
          }
          if (row.court !== null) {
            bookingsMap[row.id].slots.push({
              court: row.court,
              date: row.date,
              timeSlot: row.time_slot
            });
          }
        }

        return jsonResponse({ success: true, bookings: Object.values(bookingsMap) });
      } catch (err: any) {
        return jsonResponse({ error: err.message || "Failed to fetch bookings" }, 500);
      }
    }

    // 3. POST /api/bookings/confirm
    if (url.pathname === "/api/bookings/confirm" && request.method === "POST") {
      try {
        const { bookingId } = await request.json();
        if (!bookingId) return jsonResponse({ error: "Missing bookingId" }, 400);

        // Fetch booking and slots
        const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?1").bind(bookingId).first();
        if (!booking) return jsonResponse({ error: "Booking not found" }, 404);
        if (booking.status === "confirmed") {
          return jsonResponse({ success: true, message: "Booking already confirmed" });
        }

        const { results: slots } = await env.DB.prepare("SELECT * FROM reserved_slots WHERE booking_id = ?1").bind(bookingId).all();

        // 1. Get Google Access Token
        const accessToken = await getAccessToken(env);

        // 2. Loop and Create Google Calendar Events
        for (const slot of slots) {
          const startDateTime = parseDateTime(slot.date, slot.time_slot);
          const endDateTime = getEndTime(startDateTime);

          const eventDetails = {
            summary: `Court ${slot.court} Booking - ${booking.name}`,
            description: `Contact Number: ${booking.phone}\nEmail: ${booking.email || 'None'}\nNotes: ${booking.message || 'None'}\nBooking ID: ${bookingId}`,
            start: {
              dateTime: startDateTime,
              timeZone: "Asia/Manila",
            },
            end: {
              dateTime: endDateTime,
              timeZone: "Asia/Manila",
            },
          };

          const event = await createCalendarEvent(accessToken, env.GOOGLE_CALENDAR_ID, eventDetails);
          
          // Save calendar event ID in D1
          await env.DB.prepare("UPDATE reserved_slots SET calendar_event_id = ?1 WHERE id = ?2")
            .bind(event.id, slot.id)
            .run();
        }

        // 3. Update Status
        await env.DB.prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?1").bind(bookingId).run();

        // 4. Send Confirmation Email to Client
        if (booking.email && booking.email.trim()) {
          const emailHeaderHtml = `
            <div style="text-align: center; margin-bottom: 25px; margin-top: -20px;">
              <span style="background-color: #1e293b; color: #ffffff; padding: 10px 30px; border-radius: 0 0 16px 16px; font-weight: 900; font-size: 16px; letter-spacing: 2.5px; display: inline-block; font-family: 'Montserrat', 'Arial Black', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <span style="color: #f59e0b;">THE</span> PADDLE CLUB
              </span>
            </div>
          `;

          // Construct bookings summary HTML
          // Group slots by court to build friendly summary
          const courtGroup: Record<number, { date: string, times: string[] }> = {};
          for (const s of slots) {
            if (!courtGroup[s.court]) {
              courtGroup[s.court] = { date: s.date, times: [] };
            }
            courtGroup[s.court].times.push(s.time_slot);
          }

          let emailBookingsHtml = "";
          for (const [court, cfg] of Object.entries(courtGroup)) {
            const formattedDate = formatFriendlyDate(cfg.date);
            const timesStr = cfg.times.sort().join(', ');
            emailBookingsHtml += `
              <div style="margin-bottom: 15px; border-bottom: 1px dashed #ddd; padding-bottom: 10px;">
                <strong style="color: #f59e0b;">Court ${court}</strong> (Indoor Standard)<br>
                <strong>Date:</strong> ${formattedDate}<br>
                <strong>Timeslot(s):</strong> ${timesStr} (1 hour each)
              </div>
            `;
          }

          const emailSubject = `Booking Confirmed: Court Reservation - The Paddle Club`;
          const emailBody = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
              ${emailHeaderHtml}
              <h2 style="color: #f59e0b; margin-top: 15px; padding-bottom: 10px; border-bottom: 2px solid #f59e0b; font-size: 20px;">Booking Confirmed!</h2>
              <p>Hi <strong>${booking.name}</strong>,</p>
              <p>Great news! Your booking at <strong>The Paddle Club</strong> has been approved and confirmed by the owner:</p>
              
              <div style="background-color: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 20px 0;">
                ${emailBookingsHtml}
              </div>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Amount Due</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #10b981; font-weight: bold;">₱${(slots.length * 500).toLocaleString('en-US')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Contact Number</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.phone}</td>
                </tr>
              </table>
              <p>Please arrive 10 minutes before your schedule. We look forward to seeing you!</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
              <p style="font-size: 12px; color: #777; text-align: center;">The Paddle Club &bull; Indoor Court Selector &bull; Auto-generated Confirmation</p>
            </div>
          `;

          const rawEmail = buildRawEmail(booking.email, env.GOOGLE_CALENDAR_ID, emailSubject, emailBody);
          await sendEmail(accessToken, rawEmail);
        }

        return jsonResponse({ success: true });
      } catch (err: any) {
        return jsonResponse({ error: err.message || "Failed to confirm booking" }, 500);
      }
    }

    // 4. POST /api/bookings/reject
    if (url.pathname === "/api/bookings/reject" && request.method === "POST") {
      try {
        const { bookingId } = await request.json();
        if (!bookingId) return jsonResponse({ error: "Missing bookingId" }, 400);

        // Fetch booking details
        const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?1").bind(bookingId).first();
        if (!booking) return jsonResponse({ error: "Booking not found" }, 404);
        if (booking.status === "rejected") {
          return jsonResponse({ success: true, message: "Booking already rejected" });
        }

        // Update status in D1
        await env.DB.prepare("UPDATE bookings SET status = 'rejected' WHERE id = ?1").bind(bookingId).run();

        // Send Rejection Email to Client
        if (booking.email && booking.email.trim()) {
          const accessToken = await getAccessToken(env);
          const emailHeaderHtml = `
            <div style="text-align: center; margin-bottom: 25px; margin-top: -20px;">
              <span style="background-color: #1e293b; color: #ffffff; padding: 10px 30px; border-radius: 0 0 16px 16px; font-weight: 900; font-size: 16px; letter-spacing: 2.5px; display: inline-block; font-family: 'Montserrat', 'Arial Black', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <span style="color: #f59e0b;">THE</span> PADDLE CLUB
              </span>
            </div>
          `;

          const emailSubject = `Update on Reservation Request - The Paddle Club`;
          const emailBody = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
              ${emailHeaderHtml}
              <h2 style="color: #ef4444; margin-top: 15px; padding-bottom: 10px; border-bottom: 2px solid #ef4444; font-size: 20px;">Reservation Declined</h2>
              <p>Hi <strong>${booking.name}</strong>,</p>
              <p>We regret to inform you that your reservation request at <strong>The Paddle Club</strong> has been declined. Unfortunately, the selected slots are unavailable or have been fully booked.</p>
              <p>Please feel free to submit a new reservation request on our website for alternative timeslots.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
              <p style="font-size: 12px; color: #777; text-align: center;">The Paddle Club &bull; Indoor Court Selector &bull; Auto-generated Notification</p>
            </div>
          `;

          const rawEmail = buildRawEmail(booking.email, env.GOOGLE_CALENDAR_ID, emailSubject, emailBody);
          await sendEmail(accessToken, rawEmail);
        }

        return jsonResponse({ success: true });
      } catch (err: any) {
        return jsonResponse({ error: err.message || "Failed to reject booking" }, 500);
      }
    }

    // 5. POST /api/book (Original submission revised for D1 Pending states)
    if (url.pathname === "/api/book" && request.method === "POST") {
      try {
        const { bookings, name, email, phone, message } = await request.json();
        const bookingId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        // Calculate bookings details
        let emailBookingsHtml = "";
        let totalBookingsCount = 0;

        // Insert booking header
        await env.DB.prepare(`
          INSERT INTO bookings (id, name, email, phone, message, status, created_at)
          VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6)
        `).bind(bookingId, name, email || null, phone, message || null, createdAt).run();

        // Insert slots
        for (const booking of bookings) {
          const { court, date, times } = booking;
          if (!times || !Array.isArray(times)) continue;
          
          const formattedDate = formatFriendlyDate(date);
          const timesStr = times.sort().join(', ');
          totalBookingsCount += times.length;

          emailBookingsHtml += `
            <div style="margin-bottom: 15px; border-bottom: 1px dashed #ddd; padding-bottom: 10px;">
              <strong style="color: #f59e0b;">Court ${court}</strong> (Indoor Standard)<br>
              <strong>Date:</strong> ${formattedDate}<br>
              <strong>Timeslot(s):</strong> ${timesStr} (1 hour each)
            </div>
          `;

          for (const time of times) {
            if (!time || typeof time !== 'string') continue;
            await env.DB.prepare(`
              INSERT INTO reserved_slots (booking_id, court, date, time_slot)
              VALUES (?1, ?2, ?3, ?4)
            `).bind(bookingId, court, date, time).run();
          }
        }

        const amountDue = totalBookingsCount * 500;

        // Fetch Access Token for Alerts
        const accessToken = await getAccessToken(env);

        // Send "Awaiting Confirmation" Confirmation Email to Client
        const emailHeaderHtml = `
          <div style="text-align: center; margin-bottom: 25px; margin-top: -20px;">
            <span style="background-color: #1e293b; color: #ffffff; padding: 10px 30px; border-radius: 0 0 16px 16px; font-weight: 900; font-size: 16px; letter-spacing: 2.5px; display: inline-block; font-family: 'Montserrat', 'Arial Black', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <span style="color: #f59e0b;">THE</span> PADDLE CLUB
            </span>
          </div>
        `;

        if (email && email.trim()) {
          const emailSubject = `Booking Received (Awaiting Confirmation) - The Paddle Club`;
          const emailBody = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
              ${emailHeaderHtml}
              <h2 style="color: #f59e0b; margin-top: 15px; padding-bottom: 10px; border-bottom: 2px solid #f59e0b; font-size: 20px;">Booking Awaiting Approval</h2>
              <p>Hi <strong>${name}</strong>,</p>
              <p>We have received your reservation request at <strong>The Paddle Club</strong>. Your booking is currently **Awaiting Confirmation** from the owner. You will receive another email once it is approved.</p>
              
              <div style="background-color: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 20px 0;">
                ${emailBookingsHtml}
              </div>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Est. Amount Due</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #10b981; font-weight: bold;">₱${amountDue.toLocaleString('en-US')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Contact Number</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${phone}</td>
                </tr>
              </table>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
              <p style="font-size: 12px; color: #777; text-align: center;">The Paddle Club &bull; Indoor Court Selector &bull; Auto-generated Notice</p>
            </div>
          `;

          const rawEmail = buildRawEmail(email, env.GOOGLE_CALENDAR_ID, emailSubject, emailBody);
          await sendEmail(accessToken, rawEmail);
        }

        // Send Alert Email to Owner
        const ownerEmailSubject = `[Action Required] New Pending Booking Request - ${name}`;
        const ownerEmailBody = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
            ${emailHeaderHtml}
            <h2 style="color: #4f46e5; margin-top: 15px; padding-bottom: 10px; border-bottom: 2px solid #4f46e5; font-size: 20px;">New Pending Booking Request</h2>
            <p>A new booking request is pending. Action is required to Confirm or Reject this request.</p>
            
            <h3 style="color: #333; margin-top: 20px;">Customer Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Contact Number</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Email</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Message</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${message || 'None'}</td>
              </tr>
            </table>

            <h3 style="color: #333;">Requested Slots</h3>
            <div style="background-color: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              ${emailBookingsHtml}
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Total Amount Due</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #10b981; font-weight: bold; font-size: 16px;">₱${amountDue.toLocaleString('en-US')}</td>
              </tr>
            </table>
            
            <p style="margin-top: 25px; text-align: center;">
              <a href="https://athletics-court.kevincnh.workers.dev/dashboard" style="background-color: #4f46e5; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Owner Dashboard</a>
            </p>
          </div>
        `;

        const rawOwnerEmail = buildRawEmail(env.GOOGLE_CALENDAR_ID, env.GOOGLE_CALENDAR_ID, ownerEmailSubject, ownerEmailBody);
        await sendEmail(accessToken, rawOwnerEmail);

        return jsonResponse({ success: true, bookingId });

      } catch (err: any) {
        return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
      }
    }

    // Serve static assets from the frontend build
    return env.ASSETS.fetch(request);
  },
};

// Helper: Fetch OAuth Access Token using Refresh Token
async function getAccessToken(env: any): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data: any = await response.json();
  if (!response.ok) {
    throw new Error(`Google Auth error: ${data.error_description || data.error || 'Failed'}`);
  }
  return data.access_token;
}

// Helper: Parse date and time into YYYY-MM-DDTHH:MM:SS format
function parseDateTime(dateStr: string, timeStr: string): string {
  // dateStr is 'YYYY-MM-DD'
  // timeStr is 'HH:MM AM/PM'
  const [time, modifier] = timeStr.split(" ");
  let [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }
  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  return `${dateStr}T${paddedHours}:${paddedMinutes}:00`;
}

// Helper: Calculate end time (+1.5 hours)
function getEndTime(startDateTimeStr: string): string {
  const date = new Date(startDateTimeStr);
  date.setMinutes(date.getMinutes() + 60);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:00`;
}

// Helper: Create Google Calendar Event
async function createCalendarEvent(accessToken: string, calendarId: string, eventDetails: any) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventDetails),
  });
  const data: any = await response.json();
  if (!response.ok) {
    throw new Error(`Google Calendar error: ${data.error?.message || 'Failed to create event'}`);
  }
  return data;
}

// Helper: Format ISO YYYY-MM-DD into a friendly string (e.g. June 23, 2026)
function formatFriendlyDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Helper: Build Raw Email (Base64url encoded MIME RFC 2822)
function buildRawEmail(to: string, from: string, subject: string, body: string): string {
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    body
  ];
  const emailStr = emailLines.join("\r\n");
  // Encode as Base64url (RFC 4648)
  const base64 = btoa(unescape(encodeURIComponent(emailStr)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Helper: Send email using Gmail API
async function sendEmail(accessToken: string, rawEmail: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: rawEmail,
    }),
  });
  const data: any = await response.json();
  if (!response.ok) {
    throw new Error(`Google Gmail error: ${data.error?.message || 'Failed to send email'}`);
  }
  return data;
}

// Helper: Render floorplan HTML layout showing reserved courts
function renderFloorplanHtml(selectedCourts: number[]): string {
  const isSelected = (num: number) => selectedCourts.includes(num);

  const getCourtStyle = (num: number) => {
    const selected = isSelected(num);
    return {
      outer: `position: relative; height: 110px; margin-bottom: 12px; background-color: #3d7a5b; border-radius: 8px; border: ${selected ? '3px solid #f59e0b' : '3px solid #ffffff'}; padding: 6px; box-sizing: border-box;`,
      inner: `position: relative; height: 92px; background-color: #34628f; border: 1.5px solid rgba(255,255,255,0.9); box-sizing: border-box; display: block; overflow: hidden;`,
      badge: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 900; font-size: 16px; border: 2px solid ${selected ? '#fef3c7' : '#ffffff'}; background-color: ${selected ? '#f59e0b' : '#ffffff'}; color: ${selected ? '#451a03' : '#1e293b'}; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 15;`,
      check: selected ? `<div style="position: absolute; top: 4px; right: 4px; background-color: #f59e0b; color: #451a03; border-radius: 50%; width: 16px; height: 16px; font-size: 11px; font-weight: bold; text-align: center; line-height: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 20;">✓</div>` : ''
    };
  };

  const makeCourt = (num: number) => {
    const style = getCourtStyle(num);
    return `
      <div style="${style.outer}">
        <div style="${style.inner}">
          <!-- Top Service Line / Kitchen Line -->
          <div style="height: 38px; border-bottom: 1.5px solid rgba(255,255,255,0.9); position: relative; box-sizing: border-box;">
            <div style="position: absolute; top: 0; bottom: 0; left: 50%; border-right: 1.5px solid rgba(255,255,255,0.9);"></div>
          </div>
          <!-- Net -->
          <div style="height: 2px; background-color: rgba(255,255,255,0.9); position: relative; z-index: 10;">
            <!-- Net posts -->
            <div style="position: absolute; left: -4px; top: -3px; width: 4px; height: 8px; background-color: #cbd5e1; border-radius: 1px;"></div>
            <div style="position: absolute; right: -4px; top: -3px; width: 4px; height: 8px; background-color: #cbd5e1; border-radius: 1px;"></div>
          </div>
          <!-- Bottom Service Line -->
          <div style="height: 38px; position: relative; box-sizing: border-box;">
            <div style="position: absolute; top: 0; bottom: 0; left: 50%; border-right: 1.5px solid rgba(255,255,255,0.9);"></div>
          </div>
          
          <!-- Badge -->
          <div style="${style.badge}">${num}</div>
          <!-- Checkmark -->
          ${style.check}
        </div>
      </div>
    `;
  };

  return `
    <div style="background-color: #d8dde3; padding: 20px; border-radius: 16px; border: 4px solid #cbd5e1; font-family: Arial, sans-serif; margin: 20px 0; box-sizing: border-box;">
      <!-- Title Header inside Layout -->
      <div style="text-align: center; margin-bottom: 20px; margin-top: -20px;">
        <span style="background-color: #1e293b; color: #ffffff; padding: 6px 20px; border-radius: 0 0 10px 10px; font-weight: 900; font-size: 13px; letter-spacing: 2px; display: inline-block;">
          <span style="color: #f59e0b;">THE</span> PADDLE CLUB
        </span>
      </div>

      <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
        <tr>
          <!-- Facilities Column (25%) -->
          <td style="width: 25%; vertical-align: top; padding-right: 8px;">
            <div style="height: 110px; background-color: rgba(255,255,255,0.85); border: 2.5px solid #cbd5e1; border-radius: 8px; text-align: center; margin-bottom: 12px; display: table; width: 100%; box-sizing: border-box;">
              <div style="display: table-cell; vertical-align: middle; font-weight: bold; font-size: 11px; color: #475569; letter-spacing: 1px; font-family: sans-serif;">
                REST
              </div>
            </div>
            <div style="height: 110px; background-color: rgba(255,255,255,0.85); border: 2.5px solid #cbd5e1; border-radius: 8px; text-align: center; margin-bottom: 12px; display: table; width: 100%; box-sizing: border-box;">
              <div style="display: table-cell; vertical-align: middle; font-weight: bold; font-size: 11px; color: #475569; letter-spacing: 1px; font-family: sans-serif;">
                CAFE
              </div>
            </div>
            <div style="height: 110px; background-color: rgba(255,255,255,0.85); border: 2.5px solid #cbd5e1; border-radius: 8px; border-bottom: 4px solid #f59e0b; text-align: center; display: table; width: 100%; box-sizing: border-box;">
              <div style="display: table-cell; vertical-align: middle; font-weight: bold; font-size: 11px; color: #475569; letter-spacing: 1px; font-family: sans-serif;">
                ENTRY
              </div>
            </div>
          </td>

          <!-- Divider Walkway Column (5%) -->
          <td style="width: 5%; vertical-align: middle; padding: 0 4px;">
            <div style="width: 4px; height: 350px; background-color: rgba(203, 213, 225, 0.6); margin: 0 auto; border-radius: 2px;"></div>
          </td>

          <!-- Courts 1-3 Column (35%) -->
          <td style="width: 35%; vertical-align: top; padding-right: 6px;">
            ${makeCourt(1)}
            ${makeCourt(2)}
            ${makeCourt(3)}
          </td>

          <!-- Courts 4-6 Column (35%) -->
          <td style="width: 35%; vertical-align: top; padding-left: 6px;">
            ${makeCourt(4)}
            ${makeCourt(5)}
            ${makeCourt(6)}
          </td>
        </tr>
      </table>
    </div>
  `;
}
