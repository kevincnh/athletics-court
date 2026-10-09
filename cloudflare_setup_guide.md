# Cloudflare & Google APIs Setup Guide

This guide explains how to set up the backend infrastructure for the **Athletics Court Booking System** ("The Paddle Club"). The application runs as a Cloudflare Worker that serves the frontend, manages court bookings in a Cloudflare D1 SQL database, schedules events via the Google Calendar API, and sends customer and owner notification emails via the Gmail API.

---

## Phase 1: Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project dropdown at the top left and select **New Project**.
   - Name it "Athletics Court Booking" and click **Create**.

2. **Enable Required APIs**
   - In the left sidebar, navigate to **APIs & Services > Library**.
   - Search for **Google Calendar API** and click **Enable**.
   - Search for **Gmail API** and click **Enable**.

3. **Configure the OAuth Consent Screen**
   - Navigate to **APIs & Services > OAuth consent screen**.
   - Choose **External** user type and click **Create**.
   - Fill in the required fields (App name, User support email, Developer contact email).
   - Click **Save and Continue** through the Scopes and Test Users screens.
   - Once created, click **Publish App** so the token doesn't expire in 7 days.

4. **Create OAuth Credentials**
   - Navigate to **APIs & Services > Credentials**.
   - Click **Create Credentials > OAuth client ID**.
   - Select **Web application** as the application type.
   - Name it "Athletics Court Worker".
   - Under **Authorized redirect URIs**, add: `https://developers.google.com/oauthplayground` (temporarily needed to generate your offline refresh token).
   - Click **Create**.
   - Copy the **Client ID** and **Client Secret** somewhere safe.

---

## Phase 2: Generate the Refresh Token

Since the system dispatches emails directly through the owner's `@gmail.com` account and writes to their primary Google Calendar, we must generate an offline Refresh Token.

1. **Construct your Authorization URL**
   - Copy this URL into a text editor:
     ```text
     https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=https://developers.google.com/oauthplayground&response_type=code&scope=https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent
     ```
   - Replace `YOUR_CLIENT_ID` with the Client ID generated in Phase 1.
   
2. **Authorize the App**
   - Paste the constructed URL into your web browser.
   - Log in with your Gmail account and bypass any warning by clicking **Advanced > Go to App**.
   - Click **Continue** to grant Calendar and Gmail permissions. You will automatically be redirected to the OAuth Playground.

3. **Exchange for a Refresh Token**
   - On the OAuth Playground page, look at the URL bar—you will see `?code=4/0AdkV...` appended to the URL.
   - In the top right corner of the page, click the **Gear Icon (Settings)**.
   - Check **"Use your own OAuth credentials"**.
   - Paste your **Client ID** and **Client Secret**.
   - Close the gear settings panel.
   - On the left panel, click **Step 2: Exchange authorization code for tokens** (the blue button).
   - Copy the **Refresh Token** (starts with `1//04...`).

---

## Phase 3: Cloudflare D1 Database Setup

The backend stores reservation records and reserved time slots inside a Cloudflare D1 SQL database.

1. **Log in to Cloudflare**
   ```bash
   pnpm dlx wrangler login
   ```

2. **Create the D1 Database (if not already provisioned)**
   ```bash
   pnpm dlx wrangler d1 create athletics-court-db
   ```
   Copy the `database_id` output by Wrangler and verify it matches [wrangler.toml](file:///c:/Website/service-provider/booking/athletics-court/wrangler.toml):
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "athletics-court-db"
   database_id = "<YOUR_DATABASE_ID>"
   ```

3. **Apply Database Migrations**
   - Execute the schema migration against your remote D1 database:
     ```bash
     pnpm dlx wrangler d1 execute athletics-court-db --remote --file=./migrations/0000_init.sql
     ```
   *(This creates `bookings`, `reserved_slots` with slot-level status tracking, and the `settings` table.)*

---

## Phase 4: Configure Variables and Secrets

### 1. Public Environment Variables (`wrangler.toml`)
Non-sensitive variables are configured under `[vars]` in [wrangler.toml](file:///c:/Website/service-provider/booking/athletics-court/wrangler.toml):
```toml
[vars]
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CALENDAR_ID = "YOUR_EMAIL_ADDRESS"
```

### 2. Encrypted Secrets
Set the confidential secrets via Wrangler in your project directory:
```bash
pnpm dlx wrangler secret put GOOGLE_CLIENT_SECRET
pnpm dlx wrangler secret put GOOGLE_REFRESH_TOKEN
```
Paste your Google Client Secret and Refresh Token when prompted.

---

## Phase 5: Build and Deploy

1. **Build the Frontend Assets**:
   ```bash
   pnpm run build
   ```
2. **Deploy the Worker with Static Assets**:
   ```bash
   pnpm dlx wrangler deploy
   ```

Your Cloudflare Worker will now serve the court booking interface, persist pending bookings in D1, and automatically sync approved bookings with Google Calendar while sending email notifications via Gmail!
