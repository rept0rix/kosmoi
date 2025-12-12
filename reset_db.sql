-- 🚨 EMERGENCY DB RESET SCRIPT 🚨
-- This will wipe all messages, tasks, and meetings.
-- Use with CAUTION.
-- 1. Truncate Dependent Tables first
TRUNCATE TABLE board_messages CASCADE;
TRUNCATE TABLE agent_tasks CASCADE;
TRUNCATE TABLE agent_memory CASCADE;
TRUNCATE TABLE agent_approvals CASCADE;
TRUNCATE TABLE agent_tickets CASCADE;
-- 2. Truncate Main Tables
TRUNCATE TABLE board_meetings CASCADE;
-- 3. Optional: Clear Business Data (Commented out by default for safety)
-- TRUNCATE TABLE service_providers CASCADE;
-- TRUNCATE TABLE reviews CASCADE;
-- TRUNCATE TABLE favorites CASCADE;
-- TRUNCATE TABLE service_requests CASCADE;
-- 4. Reset Sequences (if needed)
-- ALTER SEQUENCE board_meetings_id_seq RESTART WITH 1;
COMMIT;