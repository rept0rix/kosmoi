# Kosmoi Architecture Trees and Relationship Maps

## Purpose
This document provides multiple focused maps instead of one overloaded diagram. Each tree highlights a different aspect of the system and future rebuild.

## 1. System Tree

```text
Kosmoi
├── Consumer App
│   ├── Landing and content
│   ├── Discovery and marketplace
│   ├── Requests and bookings
│   ├── Profile and account
│   └── Communications and notifications
├── Business App
│   ├── Onboarding
│   ├── Provider profile management
│   ├── Calendar and operations
│   ├── Leads and CRM-related work
│   └── Business analytics
├── Admin Control Tower
│   ├── Live control
│   ├── Decisions and runs
│   ├── Approvals
│   ├── Failures and recovery
│   ├── Company goals and health
│   ├── Logs and telemetry
│   ├── Data inspection
│   └── Agent and system supervision
├── Autonomous Runtime
│   ├── Trigger ingestion
│   ├── State observation
│   ├── Decision engine
│   ├── Action execution
│   ├── Verification
│   ├── Escalation and approvals
│   └── Learning and memory
└── Platform Infrastructure
    ├── Auth
    ├── Database
    ├── Realtime
    ├── Edge functions
    ├── Integrations
    ├── Observability
    └── Policies and configuration
```

## 2. Layer Tree

```text
UI Layer
├── Public shells and screens
├── Business shells and screens
├── Admin shells and screens
└── Shared UI components

Application Layer
├── Route composition
├── Commands
├── Queries
├── View models
└── Access control orchestration

Domain Layer
├── Company state
├── User and role models
├── Booking and request workflows
├── Lead and CRM workflows
├── Admin operations
├── Runtime decisions
├── Approvals
└── Policies

Infrastructure Layer
├── Supabase client adapters
├── Persistence repositories
├── Realtime adapters
├── Edge function clients
├── LLM providers
├── External integrations
└── Structured telemetry

External Systems
├── Supabase Auth
├── Supabase Postgres
├── Supabase Realtime
├── Supabase Edge Functions
├── Payment providers
├── Email providers
└── LLM APIs
```

## 3. Admin Tree

```text
Admin Control Tower
├── Shell
│   ├── Admin route boundary
│   ├── Role enforcement
│   └── Admin navigation
├── Operational Views
│   ├── Live control
│   ├── Company health
│   ├── Goals and KPIs
│   ├── Tasks and queues
│   └── Entity management
├── Runtime Visibility
│   ├── Current run status
│   ├── Recent runs
│   ├── Decisions
│   ├── Actions
│   └── Verification outcomes
├── Human Governance
│   ├── Pending approvals
│   ├── Approval history
│   ├── Escalations
│   └── Rollback context
├── Failure Management
│   ├── Incidents
│   ├── Retryable failures
│   ├── Dead-letter items
│   └── Degraded mode visibility
└── Telemetry
    ├── Logs
    ├── Metrics
    ├── Reliability charts
    └── Audit trails
```

## 4. Agent Tree

```text
Agent System
├── Registry
│   ├── Agent definitions
│   ├── Roles
│   ├── Capability declarations
│   └── Tool permissions
├── Orchestration
│   ├── Goal routing
│   ├── Speaker selection
│   ├── Workflow coordination
│   └── Team composition
├── Runtime Participation
│   ├── Task execution
│   ├── Decision support
│   ├── Content generation
│   └── Escalation requests
├── Tool Execution
│   ├── Read tools
│   ├── Safe write tools
│   ├── Sensitive tools
│   └── Destructive tools
├── Policy Layer
│   ├── Risk classification
│   ├── Approval rules
│   ├── Rate limits
│   └── Guardrails
├── Memory
│   ├── Short-term session memory
│   ├── Operational memory
│   ├── Knowledge retrieval
│   └── Skills and knowledge updates
└── Approval Boundary
    ├── Request generation
    ├── Human decision
    ├── Approved execution
    └── Rejection handling
```

## 5. Data Flow Tree

```text
Frontend Event
├── User interaction
├── Admin interaction
├── Scheduled trigger
└── Realtime trigger
    ↓
Application Command / Query
├── Validate intent
├── Resolve actor and permissions
├── Build command or query model
└── Route to service
    ↓
Application / Domain Service
├── Fetch canonical state
├── Evaluate rules or workflow
├── Prepare side effects
└── Emit runtime records
    ↓
Infrastructure Adapter
├── Supabase read/write
├── Edge function invocation
├── Realtime subscription or publication
├── External provider call
└── Telemetry emission
    ↓
State Update
├── Domain tables
├── Runtime tables
├── Approval tables
├── Audit logs
└── Metrics snapshots
    ↓
Read Model / Admin View
├── Consumer UI refresh
├── Business UI refresh
├── Admin live control refresh
└── Operational analytics refresh
```

## 6. Ownership and Boundary Map

```text
Consumer UI
├── Can read view models
├── Can submit user commands
└── Cannot directly own system state logic

Business UI
├── Can read business view models
├── Can submit business commands
└── Cannot directly execute admin or runtime actions

Admin UI
├── Can inspect operational truth
├── Can trigger manual commands
├── Can approve gated actions
└── Cannot become the runtime itself

Application Services
├── Own command handling
├── Own query composition
├── Own policy-aware side-effect routing
└── Expose stable interfaces to UI

Domain Services
├── Own business rules
├── Own company state calculations
├── Own decision logic contracts
└── Must remain UI-agnostic

Autonomous Runtime
├── Can observe state
├── Can decide within policy
├── Can execute safe actions
├── Can request approvals
└── Cannot bypass policy boundaries

Approval Authority
├── Can approve or reject risky actions
└── Provides the final human boundary for sensitive operations

Infrastructure
├── Persists state
├── Executes privileged integrations
└── Must not absorb domain logic that belongs above it
```

## 7. Rewrite Classification Tree

```text
Keep
├── Useful screen inventory and visual references
├── Route and feature discovery value
├── Some UI components and admin surface ideas
└── Useful domain concepts already named in code

Refactor
├── Auth and role handling
├── Shared layout and shell boundaries
├── Supabase client access model
├── Metrics and company state calculations
└── Admin pages that have useful intent but weak data contracts

Replace
├── Autonomous runtime implementation
├── Agent execution lifecycle
├── Tool policy and approval execution model
├── State ownership model
└── Direct page-to-database patterns

Delete
├── Stale or misleading documentation
├── Duplicate runtime patterns
├── Placeholder logic posing as production behavior
└── Experimental pathways that cannot be justified in the target architecture
```

## Reading Notes
- The trees describe the target structural logic, but they are informed by the current repository.
- They should be used together with the As-Is map and the rebuild decision map.
- The most important design shift is from mixed responsibilities to hard boundaries.
