# 💰 CFO Agent: Financial Watchdog Strategy

## 🎯 Objective
Maximize ROAS (Return on Ad Spend) by monitoring Lead CPA (Cost Per Acquisition) in real-time.
**Goal**: Ensure we aren't burning cash on underperforming campaigns.

## 📊 Logic & Data Sources
Since we don't have a live Facebook Ads API connection yet, we will **simulate ad spend** to test the logic.

### Inputs
1.  **Real Data**: Lead counts from `crm_leads` (grouped by `business_type`: 'Boat' vs 'Villa').
2.  **Assumed Data**: Daily Ad Spend (e.g., 1,000 THB / campaign / day).

### Analysis (The Brain)
The CFO Agent will calculate:
-   **CPA (Cost Per Acquisition)**: `Daily Spend / Daily Leads`.
-   **Verdict**:
    -   🟢 **Great**: CPA < 200 THB -> "Double Down! 🚀"
    -   🟡 **Warning**: CPA 200-500 THB -> "Monitor Closely 👀"
    -   🔴 **Available**: CPA > 500 THB -> "Kill Campaign ✂️"

## 🛠️ Implementation
1.  **Script**: `scripts/cfo_service.js`
2.  **Schedule**: Runs every 24h (or on demand).
3.  **Output**: A Telegram "Financial Briefing" every morning.

## 📝 Example Report (Telegram)
```text
💰 CFO Daily Briefing

📊 **Performance (Last 24h)**
-----------------------------
🚤 **Boats**: 5 Leads | CPA: 200 THB
   ✅ Verdict: SCALE UP (+20%)

🏰 **Villas**: 1 Lead | CPA: 1,000 THB
   ❌ Verdict: PAUSE AD (Too expensive)

-----------------------------
📉 Total Spend: 2,000 THB
📈 Total Value: 150,000 THB (Est.)
```
