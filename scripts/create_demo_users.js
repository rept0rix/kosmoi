
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USERS = [
    {
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
        metadata: { full_name: 'Test Consumer' }
    },
    {
        email: 'vendor@test.com',
        password: 'password123',
        role: 'vendor',
        metadata: { full_name: 'Test Vendor' },
        business: {
            name: 'Samui Pipeline & Fix',
            category: 'plumbing'
        }
    }
];

async function main() {
    console.log("🛠️ Starting Demo User Creation...");

    for (const u of USERS) {
        // 1. Create Auth User
        console.log(`\n👤 Processing ${u.email}...`);

        // Check if exists first (by list, or just try create)
        // Admin createUser auto-confirms email
        const { data, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: u.metadata
        });

        let userId = data?.user?.id;

        if (error) {
            console.log(`   🔸 Auth User might exist: ${error.message}`);
            // Fetch ID if exists
            const { data: list } = await supabase.auth.admin.listUsers();
            const existing = list.users.find(x => x.email === u.email);
            if (existing) {
                userId = existing.id;
                console.log(`   ✅ Found existing ID: ${userId}`);
            } else {
                console.error("   ❌ Failed to find or create user.");
                continue;
            }
        } else {
            console.log(`   ✅ Created Auth User: ${userId}`);
        }

        // 2. Create Public Profile (if your app uses a public.users table needed for logic)
        // Based on previous files, we might rely on auth hooks, but let's ensure it exists if we can.
        // Assuming 'users' table or similar exists. Inspecting schema earlier showed 'service_providers'.

        // 3. Create Vendor Profile if needed
        if (u.role === 'vendor' && u.business) {
            console.log(`   🏢 Creating Business Profile for ${u.business.name}...`);

            //  Check if provider exists
            const { data: existingProvider } = await supabase
                .from('service_providers')
                .select('id')
                .eq('created_by', userId)
                .single();

            if (existingProvider) {
                console.log(`   🔸 Provider already exists: ${existingProvider.id}`);
            } else {
                const { error: provError } = await supabase
                    .from('service_providers')
                    .insert({
                        created_by: userId,
                        business_name: u.business.name,
                        category: u.business.category,
                        status: 'active',
                        verified: true,
                        description: 'Demo business created by script.',
                        location: 'Koh Samui',
                        phone: '0812345678'
                    });

                if (provError) console.error(`   ❌ Failed to create provider: ${provError.message}`);
                else console.log("   ✅ Provider profile created.");
            }
        }
    }

    console.log("\n🎉 Demo Data Setup Complete.");
}

main();
