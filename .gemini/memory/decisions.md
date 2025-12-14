# Architectural Decisions Log

## 1. Core Stack
- **Frontend**: React (Vite)
- **Styling**: TailwindCSS with `lucide-react` for icons.
- **State Management**: React Context + Hooks (e.g., `useBoardRoom`).
- **Backend/DB**: Supabase (PostgreSQL) for Auth, Database, and Storage.

## 2. Agent System
- **Architecture**: Registry-based tool system (`ToolRegistry.js`).
- **Communication**: Agents interact via tools, not direct imports where possible.
- **Memory**: `agent_memory` table in Supabase for long-term storage of agent context.
- **Workflow**: Agents execute tasks asynchronously via `AgentTasks` table or direct `AgentTools` invocation.

## 3. UI/UX Philosophy
- **Glassmorphism**: Heavy use of `GlassCard` and semi-transparent backgrounds (`bg-white/10`, `backdrop-blur-md`).
- **Dark Mode Default**: The "Board Room" and Admin interfaces default to dark/futuristic aesthetics (`slate-900`, `slate-950`).
- **Business Landing**: Clean, professional, light-mode aesthetic for public-facing B2B pages.

## 4. Internationalization
- **Library**: `react-i18next`.
- **Strategy**: Full RTL support for Hebrew (`he`), standard LTR for English/Thai.
- **Asset Separation**: Translations stored in `src/i18n`.

## 5. Security (Fortress)
- **RLS (Row Level Security)**: Mandatory for all tables.
- **Service Role**: Admin operations use a specific "Service Role" client (`supabaseAdmin`) only when necessary.
- **Public Access**: Explicitly enabled only for `read` on public directories/tables (e.g., `service_providers`).
