
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Connection string from user's initial dump (cleaned)
const CONNECTION_STRING = "postgres://postgres.kgnuutevrytqrirgybla:rvJRbFTrZ4CfiF4N@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function run() {
    console.log("🔌 Connecting to Postgres to Initialize Schema...");
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected.");

        const sql = `
            -- 1. Create service_providers table
            CREATE TABLE IF NOT EXISTS public.service_providers (
                id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now(),
                business_name text NOT NULL,
                description text,
                category text,
                sub_category text,
                super_category text,
                location text,
                phone text,
                website text,
                email text,
                status text DEFAULT 'active',
                verified boolean DEFAULT false,
                average_rating numeric,
                user_ratings_total integer,
                google_place_id text,
                images text[],
                source_url text UNIQUE,
                metadata jsonb DEFAULT '{}'::jsonb
            );

            -- 2. Enable RLS
            ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
            
            -- Drop existing policies to avoid conflicts
            DROP POLICY IF EXISTS "Public Select" ON public.service_providers;
            DROP POLICY IF EXISTS "Admin Insert" ON public.service_providers;
            DROP POLICY IF EXISTS "Admin Update" ON public.service_providers;
            
            CREATE POLICY "Public Select" ON public.service_providers FOR SELECT USING (true);
            CREATE POLICY "Admin Insert" ON public.service_providers FOR INSERT WITH CHECK (true);
            CREATE POLICY "Admin Update" ON public.service_providers FOR UPDATE USING (true);
            
            -- 3. Fix Security Issue (spatial_ref_sys) if it exists
            DO $$ 
            BEGIN 
                REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon, authenticated, public;
            EXCEPTION 
                WHEN undefined_table THEN NULL; 
            END $$;
        `;

        console.log("🚀 Executing DDL...");
        await client.query(sql);
        console.log("✅ Schema Initialized Successfully.");

    } catch (err) {
        console.error("FATAL ERROR:", err);
    } finally {
        await client.end();
    }
}

run();
