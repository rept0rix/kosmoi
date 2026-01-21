# 🗺️ Kosmoi AI Product Roadmap: "Autopilot" Era

**Inspiration:** Basedash Autopilot (AI-driven product activation)

## Core Philosophy

Move from **Passive Tools** (Dashboard) to **Proactive Agents** (Autopilot).
The app shouldn't just *show* data; it should *act* on it to drive business success.

## 🚀 Feature 1: "The Receptionist" (AI Onboarding Agent)

**Goal:** 10x Activation Rate for new businesses.
**Problem:** Setting up a profile (filling forms, uploading images) is boring and hard.
**Solution:**

- A chat-based interface that replaces the registration form.
- **Capabilities:**
  - "Hi! What's the name of your hotel?" -> *Scrapes Google Maps/Facebook instantly.*
  - "I found these photos, want to use them?"
  - "Let me write a catchy description for you based on your reviews."
- **Tech:** Logan Agent + Supabase Edge Functions.

## 🧠 Feature 2: "The Consultant" (Auto-Optimization)

**Goal:** Retention & Profile Quality.
**Problem:** Businesses forget to update their profiles or post events.
**Solution:**

- A recurring agent (Cron Job) that audits every business profile weekly.
- **Proactive Suggestions:**
  - "Your profile views dropped 20%. I noticed you have no upcoming events. Shall I draft a 'Full Moon Party' event for next week?"
  - "You have 5 unreplied reviews. Here are draft responses. Click 'Approve' to send."
- **Delivery:** Email or Telegram/Line bot.

## 📡 Feature 3: "The Scout" (Smart Lead Qualification)

**Goal:** Revenue Generation (Operation One Dollar).
**Problem:** Users get overwhelmed by raw leads.
**Solution:**

- AI analyzes every incoming message/inquiry.
- **Scoring:** Assigns a "Vibe Score" (0-100) based on intent ("How much is a room?" vs "Hi").
- **Action:**
  - Low score: Auto-reply FAQ.
  - High score: Instant alert to the business owner via Push Notification + suggested closing script.

## 🛠️ Comparison: Current vs. Autopilot

| Feature | Current (Passive) | Autopilot (Active) |
| :--- | :--- | :--- |
| **Onboarding** | 20-field form | 2-minute chat |
| **Profile** | User must edit manually | AI suggests & applies edits |
| **Analytics** | "You had 50 views" | "You had 50 views, let's get 100 by doing X" |
| **Support** | "Contact Us" | AI proactively fixes issues |

---

*Drafted by Kosmoi Team (powered by Logan)*
