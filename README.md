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
