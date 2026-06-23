export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // POST /api/book
    if (url.pathname === "/api/book" && request.method === "POST") {
      try {
        const { court, date, time, name, email, phone, message } = await request.json();

        // 1. Get Google Access Token
        const accessToken = await getAccessToken(env);

        // 2. Format times for Google Calendar (assume local timezone is Asia/Manila / UTC+8)
        // date comes as YYYY-MM-DD from frontend
        const startDateTime = parseDateTime(date, time);
        const endDateTime = getEndTime(startDateTime);

        // 3. Create Google Calendar Event
        const eventDetails = {
          summary: `Court ${court} Booking - ${name}`,
          description: `Contact Number: ${phone}\nEmail: ${email}\nNotes: ${message || 'None'}`,
          start: {
            dateTime: startDateTime,
            timeZone: "Asia/Manila",
          },
          end: {
            dateTime: endDateTime,
            timeZone: "Asia/Manila",
          },
        };

        await createCalendarEvent(accessToken, env.GOOGLE_CALENDAR_ID, eventDetails);

        // 4. Send Confirmation Email to Client
        const emailSubject = `Booking Confirmed: Court ${court} - The Paddle Club`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Booking Confirmed!</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for choosing <strong>The Paddle Club</strong>. Your reservation details are listed below:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Court</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Court ${court} (Indoor Standard)</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Date</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatFriendlyDate(date)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Time Slot</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${time} (1.5 hours)</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Amount Due</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #10b981; font-weight: bold;">500 pesos</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Contact Number</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${phone}</td>
              </tr>
            </table>
            <p>We look forward to seeing you! Please arrive 10 minutes before your schedule.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="font-size: 12px; color: #777; text-align: center;">The Paddle Club &bull; Indoor Court Selector &bull; Auto-generated Confirmation</p>
          </div>
        `;

        const rawEmail = buildRawEmail(email, env.GOOGLE_CALENDAR_ID, emailSubject, emailBody);
        await sendEmail(accessToken, rawEmail);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Serve static assets from the frontend build
    return env.ASSETS.fetch(request);
  },
};

// Helper: Fetch OAuth Access Token using Refresh Token
async getAccessToken(env: any): Promise<string> {
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
  date.setMinutes(date.getMinutes() + 90);
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
