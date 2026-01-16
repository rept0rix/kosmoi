# Agent System Documentation

## Overview
The Kosmoi Agent System uses a multi-agent architecture orchestrated by a central `BoardOrchestrator` to simulate business operations.

## Architecture
- **Orchestrator**: `BoardOrchestrator.js` manages the conversation loop, creates meetings (`board_meetings`), and logs messages (`board_messages`).
- **Registry**: `AgentRegistry.js` (`src/features/agents/services/AgentRegistry.js`) loads all available agent profiles.
- **Service**: `AgentService.js` handles the execution of agent logic and tool calls.
- **Brain**: `AgentBrain.js` interfaces with the LLM (Gemini) to generate responses.

## Current Configuration
- **Model**: Mixed strategy for optimization:
  - **Executive Layer** (CEO): `gemini-3-pro-preview` (Enhanced reasoning for strategic decisions)
  - **Service Layer**: `gemini-2.0-flash` (Standardized for reliability and cost)
- **Integration**: Google Gemini API via `geminiInteractions.js`.
- **Output Mode**: `responseMimeType: 'application/json'` (enforced via `jsonMode: true`).

## Active Agents
Located in `src/features/agents/services/`:

| Agent ID | Role | Description | Model | Key Tools |
|----------|------|-------------|-------|-----------|
| `ceo-agent` | CEO | Provides high-level direction, strategic decisions, and revenue generation. | `gemini-3-pro-preview` | scheduler, create_task, delegate_task, market_scanner, create_payment_link |
| `sales-coordinator` | Sales Coordinator | Scouts unverified businesses, generates invitations, processes leads via Protocol 626 Mesh. | `gemini-2.0-flash` | scout_leads, generate_invitation, n8n/email integration |
| `ux-vision-agent` | UX Designer | Analyzes visual design and user flow. | `gemini-2.0-flash` | - |
| `product-founder-agent` | Product Lead | Defines product strategy and MVP scope. | `gemini-2.0-flash` | - |
| `sales-copy-agent` | Copywriter | Crafts marketing copy and value propositions. | `gemini-2.0-flash` | - |
| `scrum-master-agent` | Project Manager | Organizes tasks and sprints. | `gemini-2.0-flash` | - |

## Usage
Run the agent terminal:
```bash
node run_agents_terminal.mjs
```
