-- 🚨 EMERGENCY RESET SCRIPT 🚨
-- Usage: Run this in Supabase SQL Editor to wipe TRANSACTIONAL data.
-- Does NOT delete Users or Service Providers by default.
BEGIN;
-- 1. Wipe Board Room Activity
TRUNCATE TABLE board_messages CASCADE;
TRUNCATE TABLE agent_tasks CASCADE;
TRUNCATE TABLE agent_logs CASCADE;
-- 2. Wipe Bookings & Slots (Optional - uncomment if needed)
-- TRUNCATE TABLE bookings CASCADE;
-- TRUNCATE TABLE provider_slots CASCADE;
-- 3. Wipe Financials (Optional - uncomment if needed)
-- TRUNCATE TABLE transactions CASCADE;
-- UPDATE wallets SET balance = 0;
-- 4. Reset Sequences (if needed)
-- ALTER SEQUENCE board_messages_id_seq RESTART WITH 1;
COMMIT;
-- 🛑 HARD RESET (Uncomment to delete EVERYTHING including users)
/*
 TRUNCATE TABLE service_providers CASCADE;
 TRUNCATE TABLE auth.users CASCADE; -- Requires checking foreign keys
 */