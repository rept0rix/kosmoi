# Kosmoi Rebuild PRD

## Document Intent
This PRD defines the target product and system model for the rebuild. It is written for the internal engineering team and is intended to drive architectural, product, and implementation decisions. It does not attempt to preserve the current implementation shape unless that shape is explicitly useful.

## Product Vision
Kosmoi is an AI-native operating system for a service company. It combines:

- a consumer-facing application,
- a business and vendor operating surface,
- an admin control tower,
- and an autonomous runtime that can observe the company, decide what should happen next, execute safe actions, escalate risky actions, and make the whole system observable and controllable.

The target system should feel like one company brain with multiple interfaces, not multiple products stitched together inside a single frontend repo.

## Product Goals
- Build a coherent system with hard architectural boundaries.
- Make the admin surface a real operational control tower backed by runtime truth.
- Make autonomous behavior explicit, governed, observable, and testable.
- Keep user and vendor experiences usable without exposing internal system complexity.
- Create a foundation that supports a future rewrite without carrying forward current coupling mistakes.

## Core Actors

### Consumer User
Uses the app to discover services, submit requests, communicate, book, pay, and manage personal activity.

### Vendor / Business Operator
Uses the business surface to manage profile, leads, bookings, communications, tasks, and business performance.

### Admin Operator
Uses the admin surface to monitor the company, supervise autonomy, inspect failures, approve risky actions, and intervene when necessary.

### Autonomous Company Runtime
The runtime is the operational brain that observes state, evaluates triggers and goals, creates decisions, executes allowed actions, verifies outcomes, logs results, and escalates exceptions.

### Specialized Agents
Agents are role-based workers that participate in a bounded runtime. They do not define the system architecture. They are components inside the runtime.

### Approval Authority
The approval authority is the human decision boundary for sensitive, destructive, or high-risk actions.

## Primary Product Surfaces

### 1. Consumer App
Core purpose:
- service discovery
- request initiation
- booking and commerce flows
- profile and account management
- communications and notifications

### 2. Business App
Core purpose:
- vendor onboarding
- provider profile management
- operational dashboards
- leads and booking workflows
- communications and fulfillment support

### 3. Admin Control Tower
Core purpose:
- live operational visibility
- decisions and execution history
- approvals and escalations
- failures and recovery workflows
- goals and performance
- runtime health and telemetry

### 4. Autonomous Runtime
Core purpose:
- observe
- decide
- act
- verify
- log
- learn

This runtime is a product surface even if end users do not interact with it directly. It must be modeled explicitly.

## Jobs To Be Done

### Consumer Jobs
- Find the right service quickly.
- Submit requests with minimal friction.
- Track progress and communication.
- Complete bookings and payments with confidence.

### Vendor Jobs
- Receive and manage leads efficiently.
- Operate day-to-day workflows without administrative overload.
- Understand business performance and pending work.

### Admin Jobs
- Know what the company is doing right now.
- Trust the system’s state and runtime telemetry.
- Understand why a decision happened.
- Approve or reject risky actions with enough context.
- Diagnose failures and restore normal operation quickly.

### Runtime Jobs
- Monitor relevant business and system signals.
- Convert signals into decisions using clear policy.
- Execute safe actions without human intervention.
- Stop, escalate, or degrade gracefully when confidence or risk changes.
- Produce auditable records of what happened and why.

## Functional Requirements

### Application Structure
- The system must separate UI, application logic, domain logic, and infrastructure.
- Each product surface must use clear interfaces rather than reaching directly into the database from UI pages.
- Shared code must be explicitly categorized as UI, domain, infra, or utility.

### Routing and Shells
- Public app, business app, and admin app must each have a clear shell boundary.
- Route ownership must live in one route model, not split across multiple paradigms.

### Authentication and Authorization
- Authentication must be handled through a dedicated auth module.
- Authorization must be explicit and role-based.
- Admin-only capabilities must be enforced server-side and not rely on UI assumptions.

### Company State
- The system must define a canonical company state model.
- Metrics, goals, anomalies, queues, approvals, and runtime health must resolve into a single application-readable state snapshot.

### Command and Query Separation
- Reads and writes must be mediated through application services or command handlers.
- Side effects must not originate directly from page components.

### Admin Control Tower Requirements
- Show current runtime mode and runtime health.
- Show active goals, current priorities, and blocked work.
- Show recent runs, decisions, actions, verification outcomes, and failures.
- Show pending approvals with action context, risk level, and rollback notes.
- Show telemetry for success rate, retries, latency, and degradation.
- Support manual run triggers through the same execution pipeline as scheduled triggers.
- Support drill-down into agent participation without making agents the primary unit of system truth.

### Runtime Requirements
- The runtime must support trigger ingestion from schedules, events, and manual invocation.
- The runtime must produce persisted run records.
- Every run must include:
  - trigger source
  - observed state snapshot
  - decisions
  - actions
  - verification results
  - final status
- The runtime must support safe retries, fallback behavior, and escalation.
- The runtime must classify actions by risk level.
- Sensitive or destructive actions must be approval-gated.

### Agent Requirements
- Agents must be modeled as capability-scoped workers.
- Each agent must declare:
  - role
  - allowed capabilities
  - allowed tools
  - risk envelope
  - memory access
- Agent outputs must conform to structured contracts rather than ad hoc response parsing.

### Tooling Requirements
- Tool execution must be routed through one policy-aware executor.
- Tool categories must include read-only, safe-write, sensitive-write, and destructive.
- Tool execution must be observable, auditable, and replayable where possible.

### Memory and Learning Requirements
- The system must separate:
  - conversation memory
  - operational memory
  - business knowledge
  - configuration and policy data
- Runtime learning must not silently mutate production behavior without policy rules.

### Observability Requirements
- All runtime operations must emit structured telemetry.
- Logs must support correlation across:
  - run
  - decision
  - action
  - agent
  - approval
  - target entity
- Failure visibility must be first-class in the admin surface.

## Non-Functional Requirements

### Reliability
- The system must degrade safely on partial failure.
- Background execution must not depend on a browser session being open.
- Runtime actions must be idempotent where practical.

### Observability
- The system must expose enough state to explain what happened without reading raw code or console logs.

### Security
- Admin and autonomous write paths must be role-protected and server-enforced.
- Sensitive tools must require policy checks and approvals.
- Secrets and privileged actions must not depend on client-side trust.

### Testability
- Core application services and runtime workflows must be testable without rendering the UI.
- Policies, action classification, approval paths, and verification must support deterministic tests.

### Recoverability
- Failed runs must be inspectable, retryable when safe, and visible in the admin control tower.

### Boundary Clarity
- Frontend components must not become the source of truth for runtime behavior.
- Supabase access must not be scattered throughout product pages.

## V1 Scope For The Rebuild

### In Scope
- Canonical route and shell model.
- Auth and role boundary cleanup.
- Company state model.
- Command/query layer for major surfaces.
- Admin control tower backed by runtime truth.
- Unified autonomy runtime with persisted runs, decisions, actions, and approvals.
- Safe action execution and approval-gated sensitive execution.
- Operational telemetry and failure visibility.

### Out Of Scope For V1
- Full self-modifying agent behavior.
- Autonomous code changes and autonomous deploys.
- Preserving all current experimental admin panels.
- Perfect feature parity with every existing page.
- Supporting every old data access path.

## Success Criteria
- A new engineer can explain the system in terms of clear layers and bounded areas.
- Admin views reflect real runtime truth, not local UI simulation.
- Consumer, business, admin, and runtime surfaces have explicit ownership boundaries.
- All meaningful writes flow through command handlers or application services.
- The autonomous runtime has one canonical lifecycle.
- Sensitive actions are policy-governed and auditable.
- The team can classify old modules into keep, refactor, replace, or delete with confidence.

## Product Principles For The Rebuild
- One source of truth per concern.
- One execution path per class of action.
- One runtime model for autonomy.
- UI is for display and interaction, not hidden orchestration.
- Admin is an operator interface, not a simulation.
- Agents are components of the system, not the system architecture itself.
