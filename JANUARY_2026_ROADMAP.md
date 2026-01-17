# 📅 January 2026 Roadmap: "Operation One Dollar"

**Status:** `SHIFTING FOCUS TO GROWTH`
**Phase:** 8 (Growth & Marketing Blitz)
**Focus:** Revenue Scaling, Multi-Channel Marketing, Analytics, Autonomous Lead Gen.

---

## 🗓️ Week 1: Foundation & Revenue (Jan 1 - Jan 7)
*Objective: Ensure the system can actually take money and onboard a business successfully.*

- [x] **Fix Admin Dashboard Loading** (Critical Blocker) - *Completed Jan 2*
- [x] **Refine Pricing Page** (Free / 35฿ / 1500฿ / 3500฿) - *Completed Jan 2*
- [ ] **"Operation One Dollar" End-to-End Test**
    - Verify Stripe Payment Link generation.
    - Test "Claim Profile" flow for new businesses.
    - Confirm 35฿ payment grants "Verified" status automatically.
- [ ] **Security Audit**: Revoke/Rotate exposed keys (Google Maps, Telegram).
- [x] **AI Chatbot Integration** - *Completed Jan 3*
    - ✅ Implemented intelligent chatbot for customer inquiries.
    - ✅ Connected to BoardRoom agent system for context-aware responses.
    - ✅ Deployed on service provider pages (desktop sidebar + mobile FAB).
    - Components: ServiceProviderChat, CustomerMessageList, ChatFloatingButton, useServiceProviderChat hook.

## 🗓️ Week 2: The Growth Engine (Jan 8 - Jan 14)
*Objective: Automate the outreach to businesses.*

- [ ] **Activate "Sales Coordinator" Agent**
    - Enable `search_knowledge_base` for sales queries.
    - Connect Agent to Email/WhatsApp dispatchers (n8n).
- [ ] **Invitation System Polish**
    - Create beautiful email templates for "Claim your business".
    - Track "Open Rates" and "Click Rates" in Admin Dashboard.
- [ ] **Mobile View Optimization**: Ensure `Pricing` and `Dashboard` look perfect on mobile.

## 🗓️ Week 3: Product Value & Growth (Jan 15 - Jan 21)
*Objective: Deploy the Marketing Swarm and scale initial revenue.*

- [x] **Design Upgrade (Nano Banana)**: Completed premium glassmorphism overhaul.
- [x] **Revenue Verification**: Infrastructure for Stripe & Sales validated.
- [ ] **Marketing Blitz Launch**:
    - **FB/TikTok/Google Ads**: Activate CMO & Marketing Intelligence to draft high-conversion copy.
    - **Graphics/Video**: Assign `video-agent` and `graphic-designer` to produce creative assets.
    - **GTM & Analytics**: Set up Google Tag Manager and conversion tracking via `analytics-agent`.
- [ ] **Human Notification System**:
    - Implement triggers for `notify_admin` when human action (budget approval, manual review) is required.

## 🗓️ Week 4: Scale & Automation (Jan 22 - Jan 31)
*Objective: Remove the human from the loop while keeping them informed.*

- [ ] **Autonomous Budget Management**:
    - CFO Agent monitors spend vs. ROI and provides daily summaries.
- [ ] **Lead Expansion**:
    - Vertical expansion into Real Estate/Boat Rentals using the standardized Sales Pitch engine.
- [ ] **Self-correction**: Implementing the Security & Performance Immune System.

---

## 🚦 Bottlenecks / Risks
1.  **Ad Spend Optimization**: Initial burn vs. ROI needs daily human sign-off until trust is built.
2.  **Asset Quality**: AI-generated videos must meet the "Premium" Nano Banana standard.
3.  **Analytics Latency**: Ensuring GTM events fire correctly across the PWA/Mobile app.

## 🚀 Acceleration Track (R&D & Innovation)
*Parallel initiatives to leverage new AI breakthroughs (UI-TARS, OpenCode).*

- [ ] **Evolution Protocol v2**: Auto-scaling agent workers based on task volume.
- [ ] **Autonomous Marketing AI**: An agent that A/B tests ad copy independently and shifts budget.
- [ ] **Autonomous Operation (UI-TARS Desktop)**:
    - Experiment with `UI-TARS` for "Island Crawler" v2 (scraping without API).
    - Automate local dev environments (VSCode self-healing).
- [ ] **Agent Standardization (OpenCode / Skills)**:
    - Define `project.skills` to document business logic for *any* compatible agent.
    - Reduce vendor lock-in by abstracting prompt logic.
- [ ] **Premium Design System (The "Apple" Standard)**:
    - Implement "Nano Banana" design tokens (Glassmorphism, Fine/Premium UI).
    - Upgrade "Mobile View" to confirm with new aesthetic standards.
