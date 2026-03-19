import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split('\n').forEach(l => {
  const eq = l.indexOf('='); if (eq > 0) env[l.slice(0, eq).trim()] = l.slice(eq + 1).trim();
});

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await sb.from('agent_tasks').insert({
  title: 'Scout top 5 unverified providers and send Telegram report',
  description: `Use search_providers with payload {"verified": false, "limit": 10} to get unverified providers from the service_providers table.
Then score each one using score_lead with payload {"providerId": "<id>"}.
Pick the top 5 by score.
Finally use notify_admin to send a Telegram message with a formatted list of those 5 providers (name, category, score, grade).
DB TABLE NAME: service_providers (not "providers").`,
  assigned_to: 'ceo-agent',
  priority: 'high',
  status: 'pending'
}).select().single();

if (error) console.error('❌', error.message);
else console.log('✅ Task injected:', data.id, '\n📋', data.title);
