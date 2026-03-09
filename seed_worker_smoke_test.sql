-- ============================================================
-- Isolated Worker Smoke Test (Safe Single-Task)
-- Run this in Supabase SQL Editor before production seed.
-- ============================================================

-- Optional cleanup: close older smoke tasks of the same pattern
UPDATE agent_tasks
SET status = 'done'
WHERE assigned_to = 'consistency-auditor-agent'
  AND status IN ('pending', 'in_progress', 'review')
  AND title LIKE '[SMOKE] Worker isolated health check%';

-- Insert exactly one isolated task for a low-traffic agent
INSERT INTO agent_tasks (title, description, assigned_to, status, priority, created_by)
VALUES (
  '[SMOKE] Worker isolated health check ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  'Isolated smoke test instructions:
  1. Confirm worker is active and can process this task.
  2. Respond with: SMOKE_TEST_OK
  3. Do NOT create new tasks, tickets, notifications, or outbound messages.
  4. Do NOT perform external integrations.
  5. Mark this task complete.',
  'consistency-auditor-agent',
  'pending',
  'low',
  'manual-smoke-test'
);
