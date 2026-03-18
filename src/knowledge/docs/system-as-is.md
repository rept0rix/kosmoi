# Kosmoi System As-Is Architecture Map

## Purpose
This document describes the system as it exists today in the repository. It is intentionally grounded in the current codebase rather than the intended vision. The goal is to help the team understand the real structure, the real coupling, and the real sources of truth before deciding what to keep, refactor, replace, or delete.

## Product Overview
Kosmoi currently behaves like a hybrid product with several overlapping identities:

- A public-facing service marketplace and consumer app.
- A vendor and business operations app.
- An admin command center with operational, analytics, CRM, automation, and control views.
- A multi-agent environment with chat, orchestration, task execution, memory, and approval concepts.
- A partially autonomous company runtime that attempts to observe business state and trigger actions.

The product vision implied by the codebase is broader than the current architecture can cleanly support. Multiple paradigms coexist in the same frontend repository, often without hard boundaries.

## Runtime Surfaces

### 1. Public App
The public app includes landing, content, discovery, marketplace, profile, request, booking, and related user-facing flows.

Observed entry points:
- `src/App.jsx`
- `src/Layout.jsx`
- `src/pages.config.js`
- multiple routes under `src/pages/`

Observed behavior:
- Main navigation and shell are handled centrally in `Layout`.
- Route composition is split between `pages.config.js` and explicit route definitions in `App.jsx`.
- Some routes are production-like, some are placeholder “safe pages,” and some are partially implemented.

### 2. Vendor / Business Surface
The repository includes vendor onboarding, vendor dashboard, calendar, business registration, business analytics, and related vendor tools.

Observed areas:
- `src/features/vendors/`
- `src/pages/vendor/`
- vendor-specific sections inside `App.jsx` and `Layout.jsx`

Observed behavior:
- Vendor flows reuse the same global app shell and Supabase client patterns as the public app.
- There is no fully isolated business application boundary.

### 3. Admin Surface
The admin area is large and visually rich. It includes users, businesses, claims, CRM, scheduler, automations, logs, memory, optimizer, studio, live control, health, infrastructure, wallet, and more.

Observed areas:
- `src/layouts/AdminLayout.jsx`
- `src/pages/admin/`
- `src/features/admin/`

Observed behavior:
- `AdminLayout` acts as a dedicated shell once the route is considered part of the admin zone.
- Admin routes are registered in `App.jsx`.
- The admin area mixes operational views, live dashboards, simulators, placeholder panels, and experimental tools.

### 4. Agent Surface
The agent system spans chat, orchestration, memory, approvals, tools, workflows, registry, and runtime-like execution.

Observed areas:
- `src/features/agents/services/`
- `src/features/agents/pages/`
- `src/features/agents/components/`
- `src/services/tools/`

Observed behavior:
- Agent chat and orchestration coexist with autonomous loops.
- Tool routing, approval logic, orchestration, and direct runtime operations are all housed in the frontend repository.
- Several agent-related flows write directly to Supabase.

### 5. Automation / Autonomous Runtime Surface
The repository contains multiple attempts at autonomous execution.

Observed areas:
- `src/services/CompanyHeartbeat.js`
- `src/services/DecisionEngine.js`
- `src/services/StrategicBrain.js`
- `src/services/loops/CoreLoop.js`
- `src/features/agents/services/AutomationService.js`

Observed behavior:
- More than one “autonomy loop” exists.
- Some loops are rule-based, some are heuristic, some are trigger-driven, and some are UI-driven simulations.
- There is no single canonical runtime lifecycle across these modules.

## Current Layer Map

### UI Layer
Primary responsibilities today:
- Route rendering
- visual shells
- page composition
- local state and interaction logic
- in many cases, direct data fetching and direct writes

Main locations:
- `src/App.jsx`
- `src/Layout.jsx`
- `src/layouts/`
- `src/pages/`
- `src/components/`
- `src/features/*/components`

### Feature Layer
Primary responsibilities today:
- feature-specific pages and components
- some local service abstractions
- some domain logic
- some orchestration

Main locations:
- `src/features/auth/`
- `src/features/admin/`
- `src/features/agents/`
- `src/features/vendors/`
- `src/features/leads/`

### Service Layer
Primary responsibilities today:
- business logic
- data access wrappers
- runtime logic
- integrations
- payments
- agents
- security utilities

Main locations:
- `src/services/`
- `src/services/tools/`
- `src/services/integrations/`
- `src/services/ai/`

### API / Data Access Layer
Primary responsibilities today:
- Supabase access
- entity-style wrappers
- some integration helpers

Main locations:
- `src/api/supabaseClient.js`
- `src/api/integrations.js`
- `src/core/api/client.js`

Observed issue:
- This layer is not consistently enforced. Many pages and services bypass it and call Supabase directly.

### Infrastructure / Data Layer
Primary responsibilities today:
- Supabase auth, tables, functions, realtime
- SQL setup scripts
- migrations
- edge functions

Main locations:
- `supabase/`
- `src/data/`
- `src/sql/`

### Knowledge / Documentation Layer
Primary responsibilities today:
- generated plans
- workflow assets
- partial PRD
- system map

Main locations:
- `src/knowledge/`

Observed issue:
- Existing documentation is incomplete, partially stale, and not aligned with current code reality.

## Current Coupling Map

### Routing and Product Surface Coupling
- `src/App.jsx` owns a very large amount of route composition for unrelated product surfaces.
- `src/Layout.jsx` contains zone awareness for public, business, admin, and app experiences.
- `src/pages.config.js` still defines page mappings, but explicit route declarations in `App.jsx` override or bypass part of that model.

Result:
- Navigation architecture is split across multiple paradigms.

### UI to Data Coupling
- Many pages import `db`, `supabase`, or `realSupabase` directly from `src/api/supabaseClient.js`.
- Page components often decide their own reads and writes.
- Some services wrap database behavior, but usage is inconsistent.

Result:
- Business logic is distributed across pages, services, hooks, and Supabase helper modules.

### UI to Agent Runtime Coupling
- Admin views directly import agent services and automation services.
- `AdminCopilotWidget` instantiates `AgentService` in the UI.
- `AdminAutomations` toggles runtime-ish behavior directly from the page.

Result:
- Runtime behavior is partially controlled from presentation code.

### Agent Runtime to Database Coupling
- `AgentService`, `AgentRunner`, loops, approval flows, and admin features all write to agent-related tables.
- Agent tools and runtime policies are implemented close to the Supabase client and database helper wrappers.

Result:
- Runtime, policy, storage, and UI observability are tightly coupled.

### Multiple Runtime Patterns
Observed runtime-like systems:
- `CompanyHeartbeat`
- `DecisionEngine`
- `StrategicBrain`
- `CoreLoop`
- `AutomationService`

Result:
- The codebase has several competing models for “how autonomy works.”

## Source-of-Truth Analysis

### Routing
Current truth is split between:
- `src/App.jsx`
- `src/pages.config.js`
- route-aware logic in `src/Layout.jsx`

Impact:
- The route model is not singular or fully declarative.

### Authentication and User Session
Primary source:
- `src/features/auth/context/AuthContext.jsx`

Observed characteristics:
- auth state, optimistic session behavior, role loading, public settings loading, error handling, and navigation decisions are all centralized in one large context.
- role data comes from the `users` table through Supabase.

Impact:
- AuthContext is both auth session manager and app bootstrap gatekeeper.

### Data Access
Current truth is fragmented:
- direct `supabase.from(...)` in pages and services
- helper methods in `src/api/supabaseClient.js`
- the core client singleton in `src/core/api/client.js`

Impact:
- There is no enforced repository pattern or application service boundary.

### Admin State
Current truth is fragmented across:
- direct page queries
- custom hooks such as `useAdminStats`
- runtime logs in agent tables
- local component state
- simulated state in some admin panels

Impact:
- Admin views are not consistently backed by one operational model.

### Agent Execution State
Current truth is spread across:
- `agent_logs`
- `agent_tasks`
- `agent_approvals`
- `agent_memory`
- local runtime state inside services
- UI state inside admin automation panels

Impact:
- There is no single persisted runtime model for runs, steps, actions, outcomes, and verification.

### Autonomous Company State
Current truth is inconsistent:
- `DecisionEngine` computes a company snapshot from raw tables.
- `StrategicBrain` runs a separate analysis model.
- `MetricsService` computes yet another metric view.
- `AdminLiveControl` combines metrics, goals, tasks, and inferred status on the client side.

Impact:
- “Company state” is an idea, not a canonical domain object.

## Known Architecture Smells

### Direct database access from pages
Many UI pages directly query Supabase instead of using a dedicated application layer.

### Mixed responsibilities inside services
Some services combine:
- orchestration
- prompting
- policy
- database writes
- logging
- UI-facing response formatting

### Multiple access paradigms for the same data
The same tables are accessed through:
- direct Supabase calls
- helper wrappers
- service methods
- agent tools

### Placeholder and production code coexist in the same surface
The app includes polished admin screens, safe placeholder pages, demos, experiments, and partial production flows in the same route tree.

### Runtime fragmentation
There is no single runtime contract for:
- triggers
- decisions
- actions
- verification
- retries
- failure handling

### Shared shell complexity
`Layout.jsx` contains significant zone logic, navigation concerns, and shared behavior across product surfaces that should eventually be more isolated.

### Documentation drift
Existing PRD and system map describe only part of the product and do not match the full current shape.

## Risk Zones

### Auth and bootstrap
Risk drivers:
- large context
- optimistic auth logic
- role fetching during bootstrap
- app gating intertwined with routing

### Admin autonomy
Risk drivers:
- admin pages interact with experimental runtime logic
- mix of real status and inferred/simulated status
- weak separation between operator UI and execution engine

### Agent execution
Risk drivers:
- direct tool execution in the client-side runtime
- partial approval model
- mixed safe and sensitive tool paths
- no single action contract

### Realtime
Risk drivers:
- realtime subscriptions are created in multiple places
- operational meaning is inferred from client-side listeners

### Metrics and company state
Risk drivers:
- multiple metric services and snapshots
- derived status computed independently across modules

### Writes and side effects
Risk drivers:
- writes originate from pages, services, agent runtime, and edge functions
- side effects are not routed through one command layer

## Bounded Areas Visible in the Current System

### Public / Consumer Area
Contains discovery, content, requests, bookings, profile, and marketplace-like flows.

### Vendor / Business Area
Contains business onboarding, dashboards, calendar, analytics, and lead-related flows.

### Admin Area
Contains command center, operational views, CRM, automation panels, monitoring, logs, and system control surfaces.

### Agent Area
Contains registries, services, tools, workflows, chat windows, board room orchestration, and approvals.

### Infrastructure / Data Area
Contains Supabase access, SQL, edge functions, migrations, replication, and integration scripts.

These areas exist conceptually, but the codebase does not enforce them as clean boundaries.

## Practical Conclusions
- The repository contains valuable product surface work, especially in screens, flows, and exploration of the autonomy vision.
- The current structure is not reliable enough to support continued growth without significant architectural separation.
- The most severe issue is not any single bug. It is the absence of hard boundaries between UI, application logic, domain logic, agent runtime, and infrastructure.
- Any rewrite or structured rebuild should treat current screens as reference assets, while assuming most runtime, state, and service boundaries need redesign.
