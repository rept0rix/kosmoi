# 📅 January 2026 Roadmap: "Operation One Dollar"

**Status:** `IN PROGRESS`
**Phase:** 7 (DevOps & QA) -> 8 (Growth)
**Focus:** Revenue Verification, Business Onboarding, Autonomous Agents.

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

## 🗓️ Week 2: The Growth Engine (Jan 8 - Jan 14)
*Objective: Automate the outreach to businesses.*

- [ ] **Activate "Sales Coordinator" Agent**
    - Enable `search_knowledge_base` for sales queries.
    - Connect Agent to Email/WhatsApp dispatchers (n8n).
- [ ] **Invitation System Polish**
    - Create beautiful email templates for "Claim your business".
    - Track "Open Rates" and "Click Rates" in Admin Dashboard.
- [ ] **Mobile View Optimization**: Ensure `Pricing` and `Dashboard` look perfect on mobile.

## 🗓️ Week 3: Product Value & Retention (Jan 15 - Jan 21)
*Objective: Deliver the "Power" promised in the Premium plans.*

- [ ] **AI Receptionist Alpha**:
    - Test auto-reply features for "Scale" (3500฿) tier.
    - Allow businesses to customize their AI's tone.
- [ ] **Analytics Dashboard Upgrade**:
    - Show real "Leads" counts to businesses (Phone clicks, Map directions).
    - Generate "Monthly ROI Report" PDF.

## 🗓️ Week 4: Scale & Automation (Jan 22 - Jan 31)
*Objective: Remove the human from the loop.*

- [ ] **Autonomous Billing**: Automated invoicing and subscription renewals.
- [ ] **Commission Engine**: Logic to calculate 8-15% cut on bookings.
- [ ] **Agent "Self-correction"**: Implementing the Security Immune System fully.
- [ ] **Review**: Prepare for Phase 9 (Island Expansion).

---

## 🚦 Bottlenecks / Risks
1.  **Stripe Verification**: Need to confirm Thai Baht (THB) processing is live.
2.  **Google Maps Quota**: Crawler might hit limits; monitor usage.
3.  **Agent Costs**: Monitor tokens for "AI Receptionist".
