# Cloudflare & Google APIs Setup Guide

This guide explains how to set up the backend infrastructure for the Bataan Guest House booking system. Since we are moving away from Google Apps Script, we need to manually configure Google Cloud APIs to allow our Cloudflare Worker to read/write to your Calendar and send emails from your personal Gmail account.

## Phase 1: Google Cloud Setupa

1. **Create a Google Cloud Project**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project dropdown at the top left and select **New Project**.
   - Name it "Bataan Guest House Booking" and click **Create**.

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
   - Name it "Cloudflare Worker Backend".
   - Under **Authorized redirect URIs**, add: `https://developers.google.com/oauthplayground` (We need this temporarily to generate your refresh token).
   - Click **Create**.
   - Copy the **Client ID:** and **Client Secret:** somewhere safe.

   **GOOGLE_CLIENT_ID = YOUR_GOOGLE_CLIENT_ID**
   **GOOGLE_CLIENT_SECRET = YOUR_GOOGLE_CLIENT_SECRET**
   **GOOGLE_REFRESH_TOKEN = YOUR_GOOGLE_REFRESH_TOKEN**
   **GOOGLE_CALENDAR_ID = YOUR_EMAIL_ADDRESS**

## Phase 2: Generate the Refresh Token

Since you want the system to send emails from your standard `@gmail.com` account, we must generate an "offline" Refresh Token. The standard Google OAuth Playground is notorious for accidentally generating tokens under the wrong Client ID. Follow these steps carefully:

1. **Construct your Authorization URL**
   - Copy this URL into a text editor:
     `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=https://developers.google.com/oauthplayground&response_type=code&scope=https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent`
   - Replace `YOUR_CLIENT_ID` with the Client ID you generated in Phase 1.
   
2. **Authorize the App**
   - Paste the constructed URL into your web browser.
   - Log in with your Gmail account and ignore any warnings by clicking Advanced > Go to App.
   - Click **Continue** to grant the Calendar and Gmail permissions. You will automatically be redirected to the OAuth Playground.

3. **Exchange for a Refresh Token**
   - On the OAuth Playground page, look at the URL bar—you will see `?code=4/0AdkV...` appended to the URL. This means you successfully got your authorization code!
   - In the top right corner of the page, click the **Gear Icon (Settings)**.
   - Check **"Use your own OAuth credentials"**.
   - Paste your **Client ID** and **Client Secret**.
   - Close the gear settings panel.
   - Look at the left panel. Click **Step 2: Exchange authorization code for tokens** (the blue button).
   - Copy the **Refresh Token** (it starts with `1//04...`). This token never expires unless you revoke it.

## Phase 3: Cloudflare Setup (Unified Worker)

1. **Install Wrangler**
   - You need Node.js installed on your computer.
   - Open a terminal and run: `npm install -g wrangler`
   - Login to Cloudflare by running: `wrangler login`

2. **Set Up the Project Secrets**
   - Once your unified Cloudflare Worker project is ready, you will need to add these secrets so the backend code can talk to Google.
   - Run these commands in your project folder, and paste the respective values when prompted:
     - `wrangler secret put GOOGLE_CLIENT_ID`
     - `wrangler secret put GOOGLE_CLIENT_SECRET`
     - `wrangler secret put GOOGLE_REFRESH_TOKEN`
     - `wrangler secret put GOOGLE_CALENDAR_ID` (Your primary email address)

Your Cloudflare Worker will now be able to use the Refresh Token to automatically grab a temporary Access Token whenever a user books a stay, allowing it to add the event to your calendar and send an email directly from your Gmail outbox!
