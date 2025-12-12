# Design Overhaul Tasks

- [x] **Task DO-1: Implement Kanban Task Board** <!-- id: 0 -->
    - [x] Verify existing `KanbanBoard.jsx` functionality <!-- id: 1 -->
    - [x] Integrate Kanban Board into the main Board Room or Dashboard <!-- id: 2 -->
    - [x] Ensure drag-and-drop persists changes (connect to state/backend) <!-- id: 3 -->
- [x] **Task DO-2: Enhance VisualEditAgent** <!-- id: 4 -->
    - [x] Locate or Create `VisualEditAgent` <!-- id: 5 -->
    - [x] Implement "AI Layout Generation" capabilities <!-- id: 6 -->
    - [x] Define commands for layout generation <!-- id: 7 -->
- [x] **Task B-1: Booking System Implementation** <!-- id: 8 -->
    - [x] Apply/Verify `create_booking_schema.sql` in Supabase <!-- id: 9 -->
    - [x] Verify `BookingService.js` functionality with actual DB <!-- id: 10 -->
    - [x] Implement "My Bookings" Page/Component for users <!-- id: 11 -->
    - [x] Ensure `BookingDialog` integration in BoardRoom works <!-- id: 12 -->

- [x] **Task M-1: Refine Agent Conversation Flow** <!-- id: 13 -->
    - [x] Analyze `BoardOrchestrator.js` message generation <!-- id: 14 -->
    - [x] Improve prompt engineering for more natural flow <!-- id: 15 -->

- [x] **Task A-1: Agent Architecture Overhaul** <!-- id: 16 -->
    - [x] **Phase 1: Standardization** <!-- id: 17 -->
        - [x] Create `src/services/agents/registry/` and move agent definitions to separate files. <!-- id: 18 -->
        - [x] Standardize Agent Schema (Role, Prompt, Tools, Icon). <!-- id: 19 -->
    - [x] **Phase 2: Tool System Refactor** <!-- id: 20 -->
        - [x] Create `src/services/tools/` directory. <!-- id: 21 -->
        - [x] Extract tools from `AgentService.js` `toolRouter` into individual modules. <!-- id: 22 -->
        - [x] Implement `ToolRegistry` to dynamic load tools. <!-- id: 23 -->
    - [x] **Phase 3: MCP Optimization** <!-- id: 24 -->
        - [x] Create reusable `MCPClient` helper to avoid duplicated WebSocket logic. <!-- id: 25 -->

- [x] **Task P2: Autonomous Organization** <!-- id: 26 -->
    - [x] **Growth Layer** <!-- id: 27 -->
        - [x] Verify `InnovationResearcherAgent` configuration. <!-- id: 28 -->
        - [x] Implement `market-scanner` tool (Mocked or Real Search). <!-- id: 29 -->
    - [x] **Shared Brain (Knowledge Base)** <!-- id: 30 -->
        - [x] Create `create_knowledge_schema.sql` (Vector/Text Search Schema). <!-- id: 31 -->
        - [x] Implement `save_knowledge` and `query_knowledge` tools (connected to DB). <!-- id: 32 -->
        - [x] Update `CompanyKnowledge.js` to use new DB schema. <!-- id: 33 -->
    - [x] **CEO Loop (Proactive Management)** <!-- id: 34 -->
        - [x] Verify `CeoAgent` configuration. <!-- id: 35 -->
        - [x] Implement `DailyStandupService.js` (Loop Logic). <!-- id: 36 -->
        - [x] Create UI Trigger for Daily Standup in Board Room. <!-- id: 37 -->
