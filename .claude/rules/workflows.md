# Workflows & Agent Protocols

## BMAD Methodology (Build, Market, Architect, Dream)
The system operates on the BMAD framework. 

### Agent Types
1. **Board Room Agents**: High-level strategic agents (CEO, CTO, Product).
   - **Interaction**: Communicate via `BoardRoom.jsx` chat interface.
   - **Context**: Share a common "Memory" of the session.
2. **Service Agents**: Task-specific workers (e.g., `SupabaseClient`, `Translator`).

### Workflows
Defined in `.agent/workflows/` and orchestrated by `WorkflowService.js`.

#### Standard Flows:
- **Quick Fix**: User reports bug -> Tech Lead analyzes -> Fix proposed.
- **Feature Build**: PM defines constraints -> Tech Lead plans -> Code Gen.
- **Strategic Pivot**: CEO analyzes market -> Adjusts roadmap.

## Automation Rules
- **Formatting**: Agents must output markdown.
- **Tool Use**: Agents should prefer robust tools (`run_command`, `replace_file`) over manual suggestions.
- **Verification**: Every code change workflow must end with a verification step (e.g., "Run the app and check").
