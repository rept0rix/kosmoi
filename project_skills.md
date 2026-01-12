
# Agent Skills Registry: "The Cortex"

This document defines the specialized AI Agents in the Kosmoi ecosystem and their specific "Skills" (executable capabilities).

## 1. Sales Coordinator ("Sarah")
**Persona**: Proactive, polite, persistent but not annoying. Focuses on onboarding businesses to the "One Dollar" plan.
**Model**: Gemini 2.0 Flash (Fast, good at conversation).

### Core Responsibilities
- **Lead Scouting**: Identify businesses from `service_providers` that are `unverified`.
- **Outbound Invitation**: Send formatted invitations via Email/Telegram (and later WhatsApp).
- **Follow-up**: Check if the invitation was opened/clicked and send a nudge after 24h.
- **Closing**: Guide them to the Stripe Payment Link.

### Skills (Function Definitions)

#### `scout_leads(area, category)`
- **Input**: `area` (string), `category` (string)
- **Action**: Queries `service_providers` for `verified: false` & `status: 'active'`.
- **Output**: List of `business_name`, `id`, `contact_info`.

#### `generate_invitation(business_name, language)`
- **Input**: `business_name` (string), `language` (en/th)
- **Action**: Uses LLM to draft a personalized invite message emphasizing "100x ROI for 1 Dollar".
- **Output**: `subject`, `body_text`, `payment_link`.

#### `send_dispatch(channel, target, content)`
- **Input**: `channel` ('email' | 'telegram'), `target` (email addr | chat_id), `content` (object)
- **Action**: Calls `api/integrations/sendEmail` or `sendTelegram`.
- **Output**: `success` (boolean), `timestamp`.

## 2. Concierge ("Ralph")
*(To be defined: focus on tourist queries, booking facilitation)*

## 3. System Admin ("The Cortex")
*(To be defined: database maintenance, crawler oversight)*
