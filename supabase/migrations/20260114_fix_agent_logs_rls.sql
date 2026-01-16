-- Create agent_logs table
CREATE TABLE IF NOT EXISTS "public"."agent_logs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "agent_id" text NOT NULL,
    "level" text NOT NULL,
    -- 'info', 'warn', 'error'
    "message" text NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE "public"."agent_logs" ENABLE ROW LEVEL SECURITY;
-- Policy to allow inserting logs for all users (anon/authenticated)
CREATE POLICY "Enable insert for all users" ON "public"."agent_logs" FOR
INSERT WITH CHECK (true);
-- Policy to allow viewing logs for all users (or restrict to admins later)
CREATE POLICY "Enable read access for all users" ON "public"."agent_logs" FOR
SELECT USING (true);