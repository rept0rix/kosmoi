import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

// Connection string from setup_exec_sql.js
const CONNECTION_STRING = "postgres://postgres.gzjzeywhqbwppfxqkptf:rvJRbFTrZ4CfiF4N@db.gzjzeywhqbwppfxqkptf.supabase.co:5432/postgres";

async function createExecSql() {
    console.log("🔌 Connecting to Postgres to create exec_sql RPC...");
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected.");

        const sql = `
            CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public
            AS $$
            BEGIN
              EXECUTE sql;
            END;
            $$;

            -- Grant access to authenticated and anon (handle with care, but needed for worker)
            GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
            GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
            GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
        `;

        console.log("🚀 Creating exec_sql function...");
        await client.query(sql);
        console.log("✅ exec_sql RPC Created Successfully.");

        console.log("🔄 Reloading PostgREST Schema Cache...");
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log("✅ Cache reload notified.");

    } catch (err) {
        console.error("FATAL ERROR:", err);
    } finally {
        await client.end();
    }
}

createExecSql();
