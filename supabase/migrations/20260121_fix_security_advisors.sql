-- Security Fixes for Supabase Advisors
-- 1. Fix Mutable Search Path in Functions
ALTER FUNCTION public.admin_delete_user(uuid)
SET search_path = public;
ALTER FUNCTION public.admin_transfer_vibes(uuid, uuid, numeric, text)
SET search_path = public;
ALTER FUNCTION public.award_vibes(uuid, integer, text, text)
SET search_path = public;
ALTER FUNCTION public.transfer_funds_v2(uuid, numeric, text, text)
SET search_path = public;
-- 2. Fix Permissive RLS Policy on service_requests
-- The policy "Auth Full Access Requests" was completely open (true). 
-- Dropping it falls back to the other existing restrictive policies.
DROP POLICY IF EXISTS "Auth Full Access Requests" ON public.service_requests;