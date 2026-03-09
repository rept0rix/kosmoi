# ☁️ Kosmoi Agent Worker - Cloud Deployment Guide

## Overview

The agent worker runs a 24/7 autonomous loop that:
- Polls `agent_tasks` table every 5 seconds
- Picks up tasks and routes them to the correct AI agent (CEO, CTO, Sales, etc.)
- Uses Google Gemini to execute tasks (send emails, write code, manage CRM, etc.)
- Reports heartbeat to `company_knowledge` table so you can see it's alive

---

## Option A: Railway (Recommended — Easiest)

**Cost:** ~$5/month (Hobby plan, always-on)

### Steps

1. **Create account at [railway.app](https://railway.app)**

2. **Create new project → "Deploy from GitHub repo"**
   - Connect your GitHub account
   - Select the `kosmoi` / `samui-service-hub-main` repo

3. **Set the build configuration**
   - In Railway dashboard → Settings → Build
   - Set **Dockerfile path** to: `Dockerfile.worker`
   - (Or it will auto-detect via `railway.toml`)

4. **Add environment variables** (Settings → Variables):

```env
# Required - Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Required - AI Brain (at least one)
GOOGLE_API_KEY=AIzaSy...          # Gemini (recommended)
OPENAI_API_KEY=sk-...             # GPT-4 (optional)

# Optional - Email
VITE_RESEND_API_KEY=re_...        # Resend API (for sending emails)
EMAIL_USER=your@email.com         # SMTP fallback
EMAIL_APP_PASSWORD=yourpassword
SMTP_HOST=smtppro.zoho.com

# Optional - Integrations
GITHUB_TOKEN=ghp_...              # For GitHub operations
VITE_STRIPE_SECRET_KEY=sk_live_... # For Stripe operations
VITE_TELEGRAM_BOT_TOKEN=...       # For Telegram notifications
```

5. **Deploy** — Railway will build and start automatically

6. **Verify** — Check the Railway logs. You should see:
   ```
   🤖 Starting Universal Worker: Worker-XXX
   🌍 Mode: Universal (Will pick up tasks for ANY agent)
   🚀 Worker Loop Started. Polling for tasks...
   ```

---

## Option B: Render (Free Tier Available)

**Cost:** Free (750 hours/month) or $7/month (always-on)

1. Create account at [render.com](https://render.com)
2. New → **Background Worker**
3. Connect GitHub repo
4. Build command: `npm ci --include=dev`
5. Start command: `node scripts/worker_start.js`
6. Add same env vars as above

---

## Option C: Fly.io

**Cost:** ~$3-5/month

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy worker
fly launch --config fly.worker.toml --dockerfile Dockerfile.worker

# Set secrets
fly secrets set VITE_SUPABASE_URL=https://xxx.supabase.co
fly secrets set VITE_SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
fly secrets set GOOGLE_API_KEY=AIzaSy...
```

---

## Monitoring

Once deployed, check agent status in two ways:

### 1. Railway Logs
Real-time logs in Railway dashboard show every task the worker picks up.

### 2. Kosmoi Admin Dashboard
Go to `/command-center` → the System Status section shows:
- `WORKER_STATUS: RUNNING` (updated every heartbeat)
- Last seen timestamp

### 3. Health Endpoint
The worker exposes: `https://your-railway-app.up.railway.app/health`
```json
{
  "status": "running",
  "pid": 1234,
  "uptime": 3600,
  "restarts": 0,
  "service": "kosmoi-agent-worker"
}
```

---

## Feeding Tasks to the Worker

Once the worker is running, create tasks in Supabase `agent_tasks` table:

```sql
INSERT INTO agent_tasks (title, description, assigned_to, status, priority)
VALUES (
  'Send weekly report',
  'Generate and send a weekly business summary to the admin email',
  'cmo-agent',
  'pending',
  'medium'
);
```

Or use the **Command Center** UI at `/command-center` to create tasks visually.

---

## Env Vars Quick Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | ✅ | Admin key (bypasses RLS) |
| `GOOGLE_API_KEY` | ✅ | Gemini AI for agent brains |
| `OPENAI_API_KEY` | optional | GPT-4 fallback |
| `VITE_RESEND_API_KEY` | optional | Email sending |
| `GITHUB_TOKEN` | optional | GitHub issue creation |
| `VITE_STRIPE_SECRET_KEY` | optional | Stripe payments |
