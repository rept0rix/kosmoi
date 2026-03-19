-- ============================================================
-- Enable Supabase Realtime on key tables
-- Run this once against your Supabase project via the SQL editor
-- or via: psql $DATABASE_URL -f scripts/enable_realtime.sql
-- ============================================================

-- Supabase Realtime works by adding tables to the supabase_realtime publication.
-- This publication is created automatically by Supabase.

-- Enable Realtime on board_messages (agent chat — drives the receptionist trigger)
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_messages;

-- Enable Realtime on service_providers (new business registration → CRM trigger)
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_providers;

-- Enable Realtime on transactions (the correct payment table name in this project)
-- NOTE: The codebase uses "transactions", NOT "payments".
--       PaymentService.js, WalletService.js, FinancialPulse.jsx, VibeTicker.jsx,
--       ProviderDashboard.jsx, AdminService.js — all reference public.transactions.
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Enable Realtime on agent_tasks (so workers can react to new task assignments)
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tasks;

-- Verify the publication contains the expected tables:
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
