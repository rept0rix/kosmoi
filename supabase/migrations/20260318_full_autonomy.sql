-- ============================================================
-- Full Autonomy Migration
-- Phases 1-5: Verification, KPI Watchdog, RAG, Escalation, Goals
-- ============================================================

-- ============================================================
-- PHASE 1: Closed-Loop Verification
-- ============================================================

-- Extend agent_tasks with verification/remediation support
ALTER TABLE agent_tasks
  ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS success_criteria JSONB,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_result TEXT,
  ADD COLUMN IF NOT EXISTS escalation_count INTEGER DEFAULT 0;

-- Add task_type constraint
ALTER TABLE agent_tasks
  DROP CONSTRAINT IF EXISTS agent_tasks_task_type_check;
ALTER TABLE agent_tasks
  ADD CONSTRAINT agent_tasks_task_type_check
  CHECK (task_type IN ('primary', 'verification', 'remediation'));

-- Extend status values to include verified and escalated
-- First drop old constraint if it exists, then re-add with full set
ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS agent_tasks_status_check;
ALTER TABLE agent_tasks ADD CONSTRAINT agent_tasks_status_check
  CHECK (status IN ('pending','in_progress','review','done','failed','verified','escalated'));

CREATE INDEX IF NOT EXISTS idx_agent_tasks_parent ON agent_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_type ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_retry ON agent_tasks(retry_count);

-- ============================================================
-- PHASE 2: Business KPI Watchdog
-- ============================================================

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  leads_today INTEGER DEFAULT 0,
  bookings_today INTEGER DEFAULT 0,
  verified_businesses INTEGER DEFAULT 0,
  active_providers INTEGER DEFAULT 0,
  new_businesses_today INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT kpi_snapshots_date_unique UNIQUE (snapshot_date)
);

CREATE TABLE IF NOT EXISTS kpi_thresholds (
  metric_name TEXT PRIMARY KEY,
  warning_threshold NUMERIC,
  critical_threshold NUMERIC,
  comparison TEXT CHECK (comparison IN ('less_than', 'greater_than')) DEFAULT 'less_than',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default thresholds
INSERT INTO kpi_thresholds (metric_name, warning_threshold, critical_threshold, comparison, description)
VALUES
  ('leads_today', 2, 0, 'less_than', 'New CRM leads per day'),
  ('verified_businesses', 50, 20, 'less_than', 'Total verified businesses on platform'),
  ('bookings_today', 1, 0, 'less_than', 'Bookings per day'),
  ('new_businesses_today', 1, 0, 'less_than', 'New business registrations per day')
ON CONFLICT (metric_name) DO NOTHING;

-- ============================================================
-- PHASE 4: Human Escalation
-- ============================================================

CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('open','acknowledged','resolved','ignored')) DEFAULT 'open',
  telegram_message_id TEXT,
  human_response TEXT,
  resolution_task_id UUID REFERENCES agent_tasks(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_escalations_task ON escalations(task_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_open ON escalations(status) WHERE status = 'open';

-- ============================================================
-- PHASE 3: Per-Agent RAG Memory
-- ============================================================

ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS source_task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS task_type_tag TEXT;

CREATE INDEX IF NOT EXISTS idx_kb_agent_id ON knowledge_base(agent_id);
CREATE INDEX IF NOT EXISTS idx_kb_task_type_tag ON knowledge_base(task_type_tag);
CREATE INDEX IF NOT EXISTS idx_kb_source_task ON knowledge_base(source_task_id);

-- ============================================================
-- PHASE 5: Business Goals
-- ============================================================

CREATE TABLE IF NOT EXISTS business_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  deadline DATE,
  status TEXT CHECK (status IN ('active','achieved','paused','abandoned')) DEFAULT 'active',
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  auto_task_enabled BOOLEAN DEFAULT true,
  last_evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial goals
INSERT INTO business_goals (title, target_metric, target_value, deadline, description, priority)
VALUES
  ('100 Verified Businesses', 'verified_businesses', 100, '2026-04-30', 'Get 100 businesses verified on the platform', 1),
  ('50 Leads Per Week', 'leads_today', 8, NULL, 'Maintain 8+ new CRM leads per day (≈50/week)', 2),
  ('10 Bookings Per Day', 'bookings_today', 10, NULL, 'Sustain 10+ daily bookings', 3)
ON CONFLICT DO NOTHING;

-- RLS: allow service role full access
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access kpi_snapshots" ON kpi_snapshots FOR ALL USING (true);
CREATE POLICY "Service role full access kpi_thresholds" ON kpi_thresholds FOR ALL USING (true);
CREATE POLICY "Service role full access escalations" ON escalations FOR ALL USING (true);
CREATE POLICY "Service role full access business_goals" ON business_goals FOR ALL USING (true);
