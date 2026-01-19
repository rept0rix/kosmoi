---
description: How to execute a Marketing Swarm Blitz (Strategy -> Code -> Creative)
---

# 🐝 Marketing Swarm Blitz Protocol

Use this workflow to launch a high-speed marketing campaign for a new vertical (e.g., Real Estate, Boat Rentals).

## 1. Strategy & Content (The Brain)
**Agent**: CEO / CMO
- [ ] Create a task: "Analyze market for [Vertical] and generate ad copy + landing page outline."
- [ ] Output: `[vertical]_strategy.md` (Ad Copy, Headlines, Value Prop).
- [ ] Output: `[vertical]_campaigns.json` (Structured Data).
- [ ] **Tool**: `write_code` (to save artifacts).

## 2. Implementation (The Body)
**Agent**: Developer / Human
- [ ] Build Landing Page Component (`src/pages/LandingPage_[Vertical].jsx`).
- [ ] Create/Update Lead Form (`src/components/[Vertical]Form.jsx`).
- [ ] Add Route in `src/App.jsx` (`/r/[vertical]`).
- [ ] **Verification**: Backend "Smoke Test" (ensure leads save to DB).

## 3. Analytics (The Eyes)
**Agent**: Analytics Agent
- [ ] Ensure GTM is active.
- [ ] Configure `dataLayer` events (`generate_lead`) in the form component.
- [ ] Verify `conversion_id` and `lead_category` tracking.

## 4. Creative Assets (The Face)
**Agent**: Graphic Designer
- [ ] Create task: "Generate 3 visuals for [Vertical] based on `[vertical]_strategy.md`."
- [ ] **Tool**: `generate_image` (DALL-E 3 / Flux).
- [ ] Output: High-quality images for FB/IG/TikTok ads.

## 5. Execution (The Action)
- [ ] Generator UTM Links (`campaign_links.md`).
- [ ] Launch Ads.

---
**Turbo Mode**:
// turbo
1. Run `npm run worker` to wake up the swarm.
