# Skill: Analytics & conversion Tracking Setup

## Goal
To ensure every marketing baht is trackable via Google Tag Manager and internal analytics.

## Steps
1. **Verification**: Check if GTM script is active on `index.html`.
2. **Event Mapping**: 
    - Tracking "Call" button clicks on Provider cards.
    - Tracking "WhatsApp" icon clicks.
    - Tracking "Booking Confirmed" events.
3. **Reporting**:
    - Update the internal `Leads` table with the `utm_source` and `utm_medium`.
    - Generate a simple daily report for the CFO.
