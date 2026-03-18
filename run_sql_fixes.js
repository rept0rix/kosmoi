import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
    console.error("Missing VITE_SUPABASE_SERVICE_ROLE_KEY inside .env!");
    process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const fix_security = `
-- 1. Secure spatial_ref_sys
REVOKE ALL ON public.spatial_ref_sys FROM PUBLIC;
REVOKE ALL ON public.spatial_ref_sys FROM anon;
GRANT SELECT ON public.spatial_ref_sys TO authenticated;
GRANT SELECT ON public.spatial_ref_sys TO service_role;
`;

const fix_secure_db_1 = `
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
`;

const fix_permissions = `
DROP POLICY IF EXISTS "Enable all access for board_meetings" ON board_meetings;
DROP POLICY IF EXISTS "Enable all access for board_messages" ON board_messages;
DROP POLICY IF EXISTS "Enable all access for agent_tasks" ON agent_tasks;
`;

console.log("Applying patches...");
Promise.all([
  client.rpc('exec_sql', { sql_query: fix_security }).then(r => console.log('spatial_ref_sys:', r.error?.message || 'OK')),
  client.rpc('exec_sql', { sql_query: fix_secure_db_1 }).then(r => console.log('update_updated_at_column:', r.error?.message || 'OK')),
  client.rpc('exec_sql', { sql_query: fix_permissions }).then(r => console.log('permissions:', r.error?.message || 'OK')),
]).then(() => process.exit(0));
