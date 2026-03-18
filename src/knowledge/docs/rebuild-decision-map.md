# Kosmoi Rebuild Decision Map

## Purpose
This document translates repository reality into rebuild decisions. It is not a migration plan. It is a classification tool for deciding what should survive the rebuild and in what form.

## Decision Categories

### Keep
Preserve with minimal change because the artifact provides durable value.

### Refactor
Preserve the intent or asset, but redesign the structure, interfaces, or ownership boundaries.

### Replace
Rebuild from scratch because the current implementation shape is structurally wrong for the target system.

### Delete
Remove because it is redundant, misleading, stale, or harmful to future clarity.

## Area-by-Area Classification

### 1. Visual Screens and UI Inventory
Decision: `Keep` and `Refactor`

Why:
- The repository contains meaningful visual exploration across consumer, business, and admin surfaces.
- Admin screens in particular provide a strong inventory of concepts, navigation, and operator workflows.

What to keep:
- screen intent
- naming
- layout ideas
- navigation groupings
- reusable UI components that are stylistically sound

What to refactor:
- data contracts
- page composition logic
- local state assumptions
- hidden business logic inside pages

### 2. Route Composition and Shell Boundaries
Decision: `Replace`

Why:
- Routing truth is split across `App.jsx`, `pages.config.js`, and shell-aware zone logic in `Layout.jsx`.
- Public, business, app, and admin concerns are mixed inside shared route composition.

Target decision:
- create one routing model
- create separate shell boundaries
- remove implicit zone inference as the main organizing principle

### 3. Auth and Bootstrap Flow
Decision: `Refactor`

Current value:
- `AuthContext` already centralizes session and role awareness.

Why not keep as-is:
- it is too broad and mixes auth, bootstrap, gating, and resilience behavior
- role fetching and public settings behavior should not remain coupled to one large context

Target decision:
- keep the auth domain intent
- refactor into smaller modules with explicit responsibilities

### 4. Supabase Access Pattern
Decision: `Replace`

Why:
- direct Supabase access is scattered throughout pages, features, hooks, and services
- helper wrappers and direct calls coexist without enforcement

Target decision:
- move to explicit repositories or infra adapters
- route all reads and writes through application services or command/query handlers

### 5. Admin Surface
Decision: `Keep` and `Refactor`

Current value:
- the admin area contains the clearest expression of the product ambition
- `AdminLayout` and the page inventory are useful references

Why not keep as-is:
- current admin pages mix real telemetry, inferred telemetry, placeholder content, and simulation
- runtime behavior leaks into UI pages

Target decision:
- keep the admin information architecture as input
- rebuild admin views on top of canonical runtime and company state models

### 6. Agent Registry and Agent Concepts
Decision: `Refactor`

Current value:
- the codebase has already named roles, responsibilities, and agent categories
- the idea of capability-scoped agents is valuable

Why not keep as-is:
- agents are too entangled with orchestration, prompting, tool routing, and UI behavior
- output contracts are inconsistent

Target decision:
- keep the role taxonomy where useful
- redesign runtime participation, capability contracts, and action schemas

### 7. AgentService and Tool Router Model
Decision: `Replace`

Why:
- `AgentService` combines policy, tool dispatch, approval creation, skill handling, execution logging, and conversational behavior
- this creates a bottleneck service with too many responsibilities

Target decision:
- split into:
  - agent session / conversation handling
  - tool execution gateway
  - policy evaluation
  - approval orchestration
  - runtime action contracts

### 8. Autonomous Runtime
Decision: `Replace`

Observed implementations:
- `CompanyHeartbeat`
- `DecisionEngine`
- `StrategicBrain`
- `CoreLoop`
- `AutomationService`

Why:
- the runtime model is duplicated and internally inconsistent
- there is no canonical lifecycle or persisted run contract

Target decision:
- design one runtime
- one trigger model
- one run model
- one action pipeline
- one verification model

### 9. Metrics and Company State
Decision: `Replace`

Why:
- company state is computed in multiple places
- different services and pages infer business health independently

Target decision:
- introduce a canonical company state snapshot and explicit read models

### 10. Approval Model
Decision: `Refactor`

Current value:
- `agent_approvals` and approval queue concepts are useful
- the system already recognizes the need for human-in-the-loop controls

Why not keep as-is:
- approval generation is too tightly bound to current tool execution logic
- risk classes are implicit rather than system-wide

Target decision:
- keep the approval domain concept
- rebuild it around risk classes, action contracts, and audit-ready context

### 11. Knowledge and Documentation Assets
Decision: `Refactor` and `Delete`

Current value:
- there are useful assets in `src/knowledge/`
- workflow examples and generated material show intended direction

Problems:
- current PRD and system map are incomplete
- some generated material is stale or too narrow

Target decision:
- replace stale top-level product definition docs
- keep useful knowledge assets only where they support real workflows

### 12. SQL, Migrations, and Edge Functions
Decision: `Refactor`

Current value:
- the project already contains real domain tables and operational data concepts
- some edge functions encode important admin and automation behaviors

Why not classify as keep:
- the data model needs review against the target bounded areas
- some tables encode old assumptions and mixed concerns

Target decision:
- audit the schema by domain
- keep only durable business entities
- redesign runtime tables explicitly

## Recommended Retention Strategy

### Preserve As Reference
- admin navigation structure
- page inventory
- visual direction and reusable UI components
- named business concepts such as leads, approvals, goals, memory, logs, claims, and tasks

### Preserve As Transitional Assets
- auth role model
- selected schema concepts
- existing admin and agent terminology
- selected integrations where they align with the target architecture

### Do Not Preserve As Architecture
- direct page-to-database calls
- mixed route definition patterns
- client-driven runtime orchestration
- fragmented autonomy loops
- large multipurpose services acting as pseudo-frameworks

## Decision Summary Table

| Area | Decision | Notes |
| --- | --- | --- |
| Visual screens | Keep / Refactor | Strong reference value, weak runtime ownership |
| Routes and shells | Replace | Needs one explicit model |
| Auth bootstrap | Refactor | Keep intent, reduce responsibility |
| Supabase access | Replace | Scattered and weakly bounded |
| Admin surface | Keep / Refactor | Strong product intent, weak data truth |
| Agent concepts | Refactor | Keep roles, replace execution shape |
| AgentService model | Replace | Too many mixed responsibilities |
| Autonomous runtime | Replace | Multiple conflicting implementations |
| Metrics and company state | Replace | No canonical state model |
| Approval model | Refactor | Valuable concept, weak execution boundary |
| Knowledge docs | Refactor / Delete | Preserve useful knowledge, remove drift |
| Schema and edge functions | Refactor | Domain audit required |

## Final Rebuild Position
- Keep the vision.
- Keep the screen inventory.
- Keep useful domain concepts.
- Refuse the current structural boundaries.
- Rebuild the runtime, data access model, and application layering around clear contracts.
