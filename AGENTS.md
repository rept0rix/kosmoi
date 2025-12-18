# Agent Registry

This file is the **Single Source of Truth** for all agents in the Kosmoi system.
Agents are defined in code at `src/services/agents/AgentRegistry.js`.

## Agent Layers

### 1. Specialist Agents
*Focused, single-purpose agents for technical tasks.*
- **UX Designer**: (`ux-designer`) - Design & Experience
- **Supabase Specialist**: (`supabase-specialist`) - Database & Backend
- **GitHub Specialist**: (`github-specialist`) - Version Control
- **QA Specialist**: (`qa-specialist`) - Quality Assurance

### 2. Board Layer
*High-level governance and user representation.*
- **Board Chairman**: (`board-chairman`)
- **Human User**: (`human-user`)
- **Worker Node**: (`worker-node`)
- **Vision Founder**: (`vision-founder`)
- **Business Founder**: (`business-founder`)
- **Product Founder**: (`product-founder`)
- **Partnership Founder**: (`partnership-founder`)

### 3. Executive Layer
*C-Suite level agents responsible for broad domains.*
- **CEO**: (`ceo-agent`) - Chief Executive Officer (Current Model: gemini-3-pro-preview)
- **CTO**: (`cto-agent`) - Chief Technology Officer (Current Model: gemini-3-pro-preview)
- **Tech Lead**: (`tech-lead-agent`) - Technical Leadership (Current Model: gemini-3-flash-preview)
- **HR**: (`hr-agent`) - Human Resources
- **CMO**: (`cmo-agent`) - Chief Marketing Officer
- **CFO**: (`cfo-agent`) - Chief Financial Officer
- **CRO**: (`cro-agent`) - Chief Revenue Officer
- **Project Manager**: (`project-manager-agent`)

### 4. Strategic Layer
*Analysis, research, and long-term planning.*
- **Marketing Intelligence**: (`marketing-intelligence-agent`)
- **Finance Capital**: (`finance-capital-agent`)
- **Legal Shield**: (`legal-shield-agent`)
- **Competitive Radar**: (`competitive-radar-agent`)
- **Innovation Researcher**: (`innovation-researcher-agent`)
- **Product Vision**: (`product-vision-agent`)

### 5. Operational Layer
*Execution and day-to-day operations.*
- **Frontend**: (`frontend-agent`)
- **Backend**: (`backend-agent`)
- **Graphic Designer**: (`graphic-designer-agent`)
- **UI**: (`ui-agent`)
- **UX**: (`ux-agent`)
- **QA**: (`qa-agent`)
- **Security**: (`security-agent`)
- **Content**: (`content-agent`)
- **Concierge**: (`concierge-agent`)
- **Support**: (`support-agent`)
- **Booking**: (`booking-agent`)
- **Sales Pitch**: (`sales-pitch-agent`)
- **CRM Sales**: (`crm-sales-agent`)
- **Vector Search**: (`vector-search-agent`)
- **Code Refactor**: (`code-refactor-agent`)

### 6. Documentation Layer
*Maintaining system knowledge and documentation.*
- **System Mapping**: (`system-mapping-agent`)
- **UI/UX Docs**: (`ui-ux-docs-agent`)
- **Requirements**: (`requirements-agent`)
- **Onboarding**: (`onboarding-agent`)
- **Consistency Auditor**: (`consistency-auditor-agent`)

### 7. Automation Layer
*Background processes and optimization.*
- **Translator**: (`translator-agent`)
- **Growth**: (`growth-agent`)
- **Build**: (`build-agent`)
- **Test**: (`test-agent`)
- **Ship**: (`ship-agent`)
- **Observe**: (`observe-agent`)
- **Improve**: (`improve-agent`)
- **The Optimizer**: (`optimizer-agent`) - *Optimization & Strategy* (Current Model: gemini-3-flash-preview)

---
*Note: This file must be updated whenever `src/services/agents/AgentRegistry.js` is modified.*
