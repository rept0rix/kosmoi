# Kosmoi Platform — PRD (Product Requirements Document)
## Version: 2.0 | Date: 2026-03-19

---

## 1. PRODUCT OVERVIEW

### What is Kosmoi?
Kosmoi is an AI-powered autonomous business platform that combines:
1. **Service Marketplace** — Booking platform for vendors in Samui (wellness, real estate, transport, etc.)
2. **Autonomous Business Brain** — Self-operating agent system that runs business operations 24/7
3. **Multi-Agent Boardroom** — UI for orchestrating AI agents across strategic and operational tasks
4. **CRM + Admin Suite** — Full business management for providers and admins

### Current State (as of March 2026)
The platform is live and operational with:
- 51 AI agents defined (BMAD framework: strategic, execution, specialist, intelligence layers)
- Autonomous brain loop (cron every 15min): Observe → Reason → Act
- 22 Supabase edge functions (sales, retention, email, payments, webhooks)
- Signal-based nervous system (all agent actions write to `signals` table)
- Gemini 2.0 Flash as primary LLM + Groq/Llama fallback
- Stripe payments, Resend email, Telegram alerts, pgvector semantic search
- Glass morphism UI (Tailwind + Framer Motion)
- React 18 + Vite frontend deployed on Vercel
- Worker script for autonomous agent execution (Railway/Docker)

---

## 2. GOALS & SUCCESS METRICS

### Primary Goals
1. **Reliability** — Brain loop runs without failures; 0% silent errors
2. **Scalability** — Adding new agents/features takes <1 hour, not a day
3. **Observability** — Any failure surfaces immediately (Telegram + Sentry)
4. **Code Quality** — Consistent patterns across the codebase; new devs onboard in <1 day

### Success Metrics (measurable)
| Metric | Current | Target |
|--------|---------|--------|
| Brain loop success rate | ~50% (bugs fixed recently) | >95% |
| Time to add new agent | ~2 hours (find pattern, copy, register) | <30 min |
| Test coverage | ~0% | >60% critical paths |
| Data access consistency | ~40% through service layer | 100% |
| Dead code files | 5+ .bak files, commented imports | 0 |
| App.jsx route count | 60+ in one file | Split into sub-routers |

---

## 3. CURRENT PAIN POINTS (GAP ANALYSIS)

### P0 — Critical (blocking reliability)
- [ ] **No automated tests** — Brain loop changes break silently; no regression detection
- [ ] **Inconsistent data access** — Some pages query Supabase directly (bypassing caching, error handling, RLS check in service layer)
- [ ] **Agent brain/runner tight coupling** — `AgentBrain.js` and `AgentRunner.js` share state in ways that cause race conditions

### P1 — High (blocking scalability)
- [ ] **Flat agent registry (51 agents, no hierarchy)** — Hard to find, modify, or understand agent relationships
- [ ] **Monolithic App.jsx (60+ routes)** — Slow dev experience, hard to navigate, bundle splitting inefficient
- [ ] **Knowledge base disconnected** — `src/knowledge/` exists but agents don't reliably use it for context
- [ ] **No agent capability matrix** — Unknown which agents can call which tools; leads to runtime failures

### P2 — Medium (developer experience)
- [ ] **Dead code cluttering repo** — `.bak` files, commented-out imports, unused components
- [ ] **Mixed JS/TS** — No TypeScript enforcement; JSDoc exists but inconsistently applied
- [ ] **Python backend isolation** — `backend-agents/` FastAPI is disconnected; sync only via Supabase
- [ ] **No E2E tests** — Critical flows (booking, payment, auth) untested end-to-end

### P3 — Low (nice to have)
- [ ] **Missing UserService / ProviderService** — Admin pages bypass service layer for user/provider data
- [ ] **n8n automation-proxy still exists** — Being replaced by direct Resend API but proxy still deployed
- [ ] **No agent performance metrics** — Which agents are slowest? Most used? Unknown.

---

## 4. REQUIREMENTS

### 4.1 Agent Architecture (P1)

**REQ-AGENT-01:** Agent registry must be organized into 5 hierarchical categories:
- `strategic/` — CEO, CTO, Board Chairman, Vision Founder, Business Founder, Product Founder, Partnership Founder
- `execution/` — Tech Lead, Frontend, Backend, QA, QA Specialist, UX, UI, Security, Project Manager, Code Refactor
- `specialist/` — Sales Pitch, CRM Sales, Booking, Content, Blog Writer, Video, Concierge, Support, Onboarding, Graphic Designer
- `infrastructure/` — Worker Node, GitHub Specialist, Supabase Specialist, System Mapping, Vector Search, Optimizer, Consistency Auditor
- `intelligence/` — Marketing Intelligence, Finance Capital, Legal Shield, Competitive Radar, Innovation Researcher, Tech Scout, Planner, CMO, CFO, CRO, HR, Marketing

**REQ-AGENT-02:** Each agent definition must include:
- `id`, `name`, `category` (one of 5 above)
- `capabilities[]` — List of what this agent CAN do
- `tools[]` — Default tool set
- `handoffTo[]` — Which agents it can delegate to
- `successCriteria` — How to measure if the agent succeeded

**REQ-AGENT-03:** AgentRegistry must export agents grouped by category (not flat array) for UI consumption.

**REQ-AGENT-04:** Adding a new agent requires only: create file in correct category folder + export from that category's index.

### 4.2 Data Access Layer (P0/P2)

**REQ-DATA-01:** ALL Supabase queries must go through a service (never direct `db.from()` in page components).

**REQ-DATA-02:** Create missing services:
- `UserService.js` — user CRUD, role management
- `ProviderService.js` — provider profile, availability
- `AdminService.js` — admin-specific queries (aggregate stats, bulk operations)

**REQ-DATA-03:** Services must handle: loading states, error states, retry logic (via React Query or similar).

### 4.3 Routing (P1)

**REQ-ROUTE-01:** App.jsx must be split into sub-routers:
- `PublicRoutes.jsx` — landing, pricing, blog, legal
- `UserRoutes.jsx` — marketplace, bookings, profile
- `ProviderRoutes.jsx` — provider dashboard, calendar
- `AdminRoutes.jsx` — all admin pages
- `AgentRoutes.jsx` — BoardRoom, CommandCenter, AdminAgents

**REQ-ROUTE-02:** Each sub-router handles its own lazy imports and error boundaries.

### 4.4 Testing (P0)

**REQ-TEST-01:** Unit tests for all service layer functions (vitest, already configured).

**REQ-TEST-02:** Integration tests for brain loop: Observe → Reason → Act cycle.

**REQ-TEST-03:** E2E tests for critical user flows:
- New user signup → profile creation
- Booking flow (search → select → confirm → payment)
- Provider accepting/declining booking
- Admin approving provider claim

### 4.5 Code Quality (P2)

**REQ-CLEAN-01:** Remove all `.bak` files from repository.

**REQ-CLEAN-02:** Remove all commented-out imports and dead code in `src/App.jsx`.

**REQ-CLEAN-03:** `UXDesignerAgent.js` and `SupabaseSpecialist.js` (currently outside registry/) must be moved into correct category folders.

### 4.6 Observability (P0)

**REQ-OBS-01:** Brain loop failures must surface to Sentry (currently only Telegram).

**REQ-OBS-02:** Agent execution metrics must be tracked: `agent_id`, `duration_ms`, `success`, `tool_calls_count`.

**REQ-OBS-03:** Dashboard widget in AdminAgents showing: top 5 slowest agents, top 5 most-used agents, error rate per agent.

---

## 5. TECHNICAL CONSTRAINTS

- **Do NOT** migrate from JavaScript to TypeScript wholesale — too disruptive
- **Do NOT** change the cron-worker or brain loop logic — recently fixed
- **Do NOT** add new external dependencies unless critical
- **Do NOT** break existing agent IDs (used in database records)
- Gemini 2.0 Flash remains primary LLM
- Vercel + Supabase + Railway deployment stays the same

---

## 6. IMPLEMENTATION PHASES

### Phase 1: Foundation Cleanup (Quick wins)
- Remove dead code (.bak files, commented imports)
- Move `UXDesignerAgent.js` and `SupabaseSpecialist.js` into registry
- Split App.jsx into sub-routers

### Phase 2: Agent Registry Reorganization
- Create 5 category folders in registry/
- Move all 51 agents into correct categories
- Add capability matrix to each agent (capabilities, tools, handoffTo)
- Update AgentRegistry.js to export by category
- Update all imports that reference registry agents

### Phase 3: Data Access Standardization
- Create UserService.js, ProviderService.js, AdminService.js
- Refactor AdminUsers.jsx, AdminBusinesses.jsx, Marketplace.jsx to use services
- Add React Query for caching + loading states

### Phase 4: Testing Infrastructure
- Unit tests for BookingService, SalesService, UserService
- Integration test for brain loop (mock Supabase, test Observe→Reason→Act)
- E2E test for booking flow (Playwright or Vitest browser mode)

### Phase 5: Observability Enhancement
- Add Sentry capture to brain loop failures
- Add agent execution metrics table in Supabase
- Build agent performance dashboard widget

---

## 7. OUT OF SCOPE (THIS CYCLE)

- Python backend (backend-agents/) changes
- Voice calling (Vapi AI) improvements
- New AI features / new agents
- Mobile app
- Full TypeScript migration
- Replacing Gemini with Claude
- New payment methods

---

## 8. OPEN QUESTIONS

1. Should the BoardRoom UI be updated to reflect the new agent category hierarchy?
2. Should agent `handoffTo` be enforced at runtime (hard error if invalid handoff) or soft (logged warning)?
3. Priority for E2E testing: Playwright vs Vitest browser mode?
