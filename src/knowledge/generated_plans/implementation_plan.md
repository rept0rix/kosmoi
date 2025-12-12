# Design Overhaul & Architecture Implementation Plan

## Goal Description
Transition from a manual tool-use system to an Autonomous Organization. Agents should proactively research, remember, and manage the company loop.

## User Review Required
> [!IMPORTANT]
> - Requires database schema changes (`agent_knowledge` table).
> - Will introduce "background loops" (Daily Standup).

## Proposed Changes

### 1. Growth Layer
**Objective**: Enable `InnovationResearcher` to scan the market.
- **Agent**: `InnovationResearcherAgent` (already created, need to verify tools).
- **Tools**: `market-scanner`.
    - Implementation: Use `BrowserTool` wrappers to perform specific search queries (e.g., "latest trends in [category]").

### 2. Shared Brain (Knowledge Base)
**Objective**: Long-term memory for agents.
- **Database**: Create `agent_knowledge` table in Supabase.
    - Columns: `id, vector (optional), content, category, tags, created_by, created_at`.
- **Tools**:
    - `save_knowledge`: Store insights.
    - `query_knowledge`: Semantic or Keyword search.

### 3. CEO Loop (Proactive Management)
**Objective**: The "Heartbeat" of the company.
- **Service**: `DailyStandupService.js`.
    - Logic:
        1. Fetch "Company State" (recent tickets, tasks, revenue).
        2. Prompt CEO with status.
        3. CEO generates "Daily Mission".
        4. CEO assigns tasks to agents.
- **UI**: Add "Start Daily Standup" button in Board Room (for manual trigger initially).

## Verification Plan
1.  **Growth**: Ask Innovation Researcher to "Find 3 trends for Air Conditioning service".
2.  **Brain**: Ask CEO to "Remember that our strategy is Low Cost". Then ask "What is our strategy?".
3.  **Loop**: Click "Start Daily Standup" and verify CEO creates tasks for other agents.
