# 🤖 Kosmoi AI Worker Setup Guide

This guide enables you to turn any secondary machine (Mac/Linux/Windows) into an autonomous AI Worker node for Kosmoi.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- A terminal (Terminal.app, iTerm, VS Code Terminal)

## 1. Clone the Repository

On your **secondary machine**, open a terminal and run:

```bash
git clone https://github.com/rept0rix/samui-service-hub-main.git
cd samui-service-hub-main
```

## 2. Install Dependencies

Install the necessary packages:

```bash
npm install
```

## 3. Configure Environment

Create a `.env` file in the root directory. You can copy the example keys from your main machine, or use this template (fill in the values):

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Tools
VITE_RESEND_API_KEY=your_resend_key  # Optional: For sending emails
OPENAI_API_KEY=your_openai_key       # Required: For the AI brain
```

> **Tip:** You can securely send the `.env` content from your main machine to yourself via encrypted chat (Signal/WhatsApp) or a password manager. Do not commit it to Git!

## 4. Run the Worker

Start the worker in "Universal Mode" (it will pick up any open task):

```bash
npm run worker
```

**Or** assign it a specific role (e.g., Sales Agent):

```bash
npm run worker -- --role=sales-pitch-agent
```

## 5. Verification

1. Go back to your **Main Machine**.
2. Open the **Board Room** in the app.
3. Look at the **"System Status"** or **"Active Agents"** indicator. You should see a new worker online!
4. Create a task (e.g., "Say Hello to the team") and watch the worker pick it up.

---
**Troubleshooting:**

- **Permission Denied?** Ensure `VITE_SUPABASE_SERVICE_ROLE_KEY` is correct. The worker needs admin privileges.
- **Node Error?** Check your Node version with `node -v` (should be v18+).
