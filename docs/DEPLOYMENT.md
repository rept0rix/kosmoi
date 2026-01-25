# 🚀 Deployment Guide

Since we now have a **Frontend** (React App) and a **Background Worker** (Notification Service), we need to deploy them appropriately.

## 1. Frontend (The Website)
**Provider**: Vercel (Recommended) or Netlify.

1.  Push code to GitHub (Done).
2.  Go to Vercel.com -> "Add New Project".
3.  Select Repository `kosmoi`.
4.  **Environment Variables**:
    -   Copy all variables from `.env` to Vercel Settings.
    -   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`, etc.
5.  Click **Deploy**.

## 2. Background Worker (The Brain)
*This runs `notification_service.js` (Telegram/AI) and `cfo_service.js`.*

**Provider**: Railway, Render, or Heroku.
**Why?**: Vercel functions time out after 10s. This script needs to run forever.

### Option A: Railway (Easiest)
1.  Go to Railway.app -> "New Project" -> "Deploy from GitHub".
2.  Select `kosmoi`.
3.  **Variable Setup**: Add the keys from `.env` (`TELEGRAM_BOT_TOKEN`, `SUPABASE_...`, `GEMINI_API_KEY`).
4.  **Start Command**:
    Update the "Start Command" in settings to:
    ```bash
    npm run start:notifications
    ```
5.  Deploy.

### Option B: Local Server (Free)
If you have a dedicated PC/Mac Mini that stays on:
1.  Open Terminal.
2.  `cd /path/to/kosmoi`
3.  `npm run start:notifications`
4.  Leave it running.

## 3. Verify
1.  Send a test lead from the live Vercel site.
2.  Check if you get a Telegram message from the Railway/Worker.
