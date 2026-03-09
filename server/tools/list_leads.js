import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const key = raw.replace(/^--/, "");
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function createSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key);
}

export async function listLeads(options = {}) {
  const supabase = createSupabase();

  const limit = Math.min(Math.max(Number(options.limit || 20), 1), 200);
  let query = supabase
    .from("crm_leads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.q) {
    const q = String(options.q).trim();
    if (q) {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`,
      );
    }
  }

  if (options.stale_days) {
    const days = Number(options.stale_days);
    if (!Number.isNaN(days) && days > 0) {
      const cutoff = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000,
      ).toISOString();
      query = query.lt("updated_at", cutoff);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const leads = await listLeads(options);
    console.log(JSON.stringify(leads, null, 2));
  } catch (error) {
    console.error("list_leads failed:", error.message);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await main();
}
