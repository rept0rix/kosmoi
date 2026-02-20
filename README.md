# Kosmoi (Samui Service Hub)

**Kosmoi** is a comprehensive "City OS" platform designed to integrate user services, business management, and AI-driven autonomous agents.

## 📚 Documentation (Single Source of Truth)

To understand this project, please consult the following files which serve as the single source of truth:

- **[SPEC.md](./SPEC.md)**: Technical Specifications, Architecture, and Data Models.
- **[AGENTS.md](./AGENTS.md)**: Registry of all AI Agents, their roles, models, and capabilities.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

## 🧠 AI Agent System

The system is powered by a multi-agent architecture.
- **Agents** are defined in `src/services/agents/registry/`.
- **Orchestration** is handled by the `BoardRoom` and `AgentService`.
- **Documentation**: See `AGENTS.md` for a full list of agents.

## 🏗 Project Structure

- `src/`: Source code
  - `api/`: API clients (Supabase)
  - `components/`: Reusable UI components
  - `pages/`: Application pages
  - `services/`: Business logic and AI services
- `scripts/`: Utility scripts for maintenance and diagnosis

## 🔐 Environment & Deployment

### Required Environment Variables
Ensure these are set in your `.env` (local) and Supabase Project Settings (Production):

- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
- `RESEND_API_KEY`: (Backend/Edge Only) For sending emails.
- `STRIPE_SECRET_KEY`: (Backend/Edge Only) For generating payment links.

### ⚡ Edge Functions
We use Supabase Edge Functions for secure operations. Deploy them using the CLI:

```bash
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy create-payment-link --no-verify-jwt
```

### 🌍 Production Deployment
The frontend is deployed to `kosmoi.site`.
1. Ensure all Edge Functions are deployed.
2. Run `npm run build` to verify the build.
3. Push to `main` branch (triggers CI/CD if configured).

## ⚙️ Admin Modules (Placeholder - Needs Update)

**Important:** This section is a placeholder. Please provide the correct information about the Admin Modules.

We have several admin modules available to manage the platform. Details on accessing and using these modules will be documented here.

## 🔄 Auto-Sync Docs

Documentation is automatically synchronized and can be found in the [docs](.taskmaster/docs) folder. Refer to these documents for up-to-date information on the system.
