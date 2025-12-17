/*
 * SECURITY REINFORCEMENT SCRIPT (v2 - Verified Tables)
 * -----------------------------
 * Run this in the Supabase SQL Editor to resolve security warnings.
 * This script enables RLS on known tables and adds standard policies.
 */
-- 1. ENABLE RLS
-- We use IF EXISTS to avoid errors if a table is missing, but for critical tables we assume they exist.
ALTER TABLE IF EXISTS public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
-- Blog
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
-- Real Estate
ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.faqs ENABLE ROW LEVEL SECURITY;
-- 2. CREATE POLICIES
-- We drop existing policies first to make this script re-runnable.
-- === PUBLIC CONTENT (Read Only) ===
-- Posts (Blog)
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
CREATE POLICY "Public Read Posts" ON public.posts FOR
SELECT USING (true);
-- Events
DROP POLICY IF EXISTS "Public Read Events" ON public.events;
CREATE POLICY "Public Read Events" ON public.events FOR
SELECT USING (true);
-- Properties (Real Estate)
DROP POLICY IF EXISTS "Public Read Properties" ON public.properties;
CREATE POLICY "Public Read Properties" ON public.properties FOR
SELECT USING (true);
-- Service Providers
DROP POLICY IF EXISTS "Public Read Providers" ON public.service_providers;
CREATE POLICY "Public Read Providers" ON public.service_providers FOR
SELECT USING (true);
-- FAQs
DROP POLICY IF EXISTS "Public Read FAQs" ON public.faqs;
CREATE POLICY "Public Read FAQs" ON public.faqs FOR
SELECT USING (true);
-- === AUTHENTICATED ACCESS (Admin/Agent) ===
-- Agent Tasks (Worker needs access)
DROP POLICY IF EXISTS "Auth Full Access Tasks" ON public.agent_tasks;
CREATE POLICY "Auth Full Access Tasks" ON public.agent_tasks FOR ALL TO authenticated USING (true);
-- Company Knowledge
DROP POLICY IF EXISTS "Auth Full Access Knowledge" ON public.company_knowledge;
CREATE POLICY "Auth Full Access Knowledge" ON public.company_knowledge FOR ALL TO authenticated USING (true);
-- CRM (Leads, Pipelines, Stages, Interactions)
DROP POLICY IF EXISTS "Auth Full Access CRM Leads" ON public.crm_leads;
CREATE POLICY "Auth Full Access CRM Leads" ON public.crm_leads FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Auth Full Access CRM Stages" ON public.crm_stages;
CREATE POLICY "Auth Full Access CRM Stages" ON public.crm_stages FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Auth Full Access CRM Pipelines" ON public.crm_pipelines;
CREATE POLICY "Auth Full Access CRM Pipelines" ON public.crm_pipelines FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Auth Full Access CRM Interactions" ON public.crm_interactions;
CREATE POLICY "Auth Full Access CRM Interactions" ON public.crm_interactions FOR ALL TO authenticated USING (true);
-- Service Requests (Dispatch)
DROP POLICY IF EXISTS "Auth Full Access Requests" ON public.service_requests;
CREATE POLICY "Auth Full Access Requests" ON public.service_requests FOR ALL TO authenticated USING (true);
-- Properties (Management)
DROP POLICY IF EXISTS "Auth Full Access Properties" ON public.properties;
CREATE POLICY "Auth Full Access Properties" ON public.properties FOR ALL TO authenticated USING (true);
-- Posts (Management)
DROP POLICY IF EXISTS "Auth Full Access Posts" ON public.posts;
CREATE POLICY "Auth Full Access Posts" ON public.posts FOR ALL TO authenticated USING (true);
-- === SPECIFIC LOGIC ===
-- Bookings: Authenticated (Providers/Users) can manage
DROP POLICY IF EXISTS "Auth Full Access Bookings" ON public.bookings;
CREATE POLICY "Auth Full Access Bookings" ON public.bookings FOR ALL TO authenticated USING (true);
-- Public Create (for guests?) - Optional, depending on biz logic.
-- CREATE POLICY "Public Create Bookings" ON public.bookings FOR INSERT WITH CHECK (true);
-- Analytics: Public Insert Only
DROP POLICY IF EXISTS "Public Insert Analytics" ON public.analytics_events;
CREATE POLICY "Public Insert Analytics" ON public.analytics_events FOR
INSERT WITH CHECK (true);