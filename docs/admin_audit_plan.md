# 🛡️ Admin Dashboard Audit & Repair Plan

## 🚨 Problem
The Admin Interface is currently a "Potemkin Village" — it looks real but relies on mock data or broken actions. The user needs a fully functional Command Center synced with `supabase`.

## 🗺️ Scope (Admin Routes)
Found in `App.jsx` under `/admin/*`:

### 1. Operations & Users
- [ ] `users` (AdminUsers): Management of registered users.
- [ ] `claims` (AdminClaims): Business verification requests.
- [ ] `company` (AdminCompany): Kosmoi system settings.
- [ ] `bookings` (AdminBookings): Global booking oversight.
- [ ] `businesses` (AdminBusinesses): Vendor/Provider directory.
- [ ] `wallet` (AdminWallet): Financial transactions/balances.

### 2. Agents & AI
- [ ] `command-center` (CommandCenter): Real-time agent status.
- [ ] `board-room` (BoardRoom): Agent meetings.
- [ ] `agents` (AdminAgents): Registry of active agents.
- [ ] `optimizer` (AdminOptimizer): Token usage/optimization.
- [ ] `hyperloop` (AdminHyperloop): AI interaction speed.
- [ ] `memory` (AdminMemory): RAG/Vector DB status.
- [ ] `skills` (AdminSkills): Skill registry.

### 3. CRM & Growth
- [ ] `crm` (AdminCRM): Overall pipeline.
- [ ] `sales` (AdminSales): Outreach campaigns.
- [ ] `leads` (AdminLeads): **(Fixed/Live)** - Verified in recent task.
- [ ] `marketing` (AdminMarketing): Ad campaigns.
- [ ] `campaigns/roar` (AdminRoarCampaign): Specific blitz campaigns.
- [ ] `automations` (AdminAutomations): n8n/Zapier status.
- [ ] `analytics` (AdminAnalytics): Traffic/Conversion data.

### 4. Technical
- [ ] `data` (AdminData): Raw DB viewer?
- [ ] `scheduler` (AdminScheduler): Cron jobs.
- [ ] `logs` (AdminLogs): System logs.
- [ ] `evolution` (AdminEvolution): git history/changelog?
- [ ] `schema` (AdminSchema): DB Schema viewer.
- [ ] `infrastructure` (AdminInfra): Server status.
- [ ] `sitemap` (AdminSitemap): SEO status.

## 🛠️ Execution Strategy

### Phase 1: The "Real Data" Audit (Immediate)
For each critical page, we will check:
1.  **Read**: Does it fetch from Supabase? (or `mockData`?)
2.  **Write**: Do buttons (Approve, Delete, Edit) actually commit to DB?
3.  **Sync**: Does it reflect recent changes (e.g. the new Leads)?

### Phase 2: Priority Repairs
We will fix them in this order of importance:
1.  **Users & Businesses**: (Core Directory)
2.  **Bookings**: (Revenue)
3.  **Agents**: (AI Control)
4.  **Wallet**: (Money)

## 📝 Verification
We will create a `tests/admin_verification.js` script to simulate admin actions and verify they reflect in the UI.
