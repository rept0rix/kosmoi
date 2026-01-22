import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugUserBusiness() {
    console.log("🔍 Debugging User-Business Link...");

    // 1. Get the specific user we are debugging (Naor)
    const targetEmail = "na0ryank0@gmail.com";
    console.log(`\n👤 Target User: ${targetEmail}`);

    // 2. Check Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("❌ Auth Error:", authError);
        return;
    }

    const user = users.find(u => u.email === targetEmail);
    if (!user) {
        console.error("❌ User not found in Auth system!");
    } else {
        console.log(`✅ User found in Auth: ID=${user.id}, Role=${user.role}`);
    }

    // 3. Check Service Providers linked to this email
    const { data: businessesByEmail, error: bpError } = await supabase
        .from('service_providers')
        .select('id, business_name, status, created_by')
        .eq('created_by', targetEmail);

    if (bpError) {
        console.error("❌ DB Find Error (Email):", bpError);
    } else if (businessesByEmail.length === 0) {
        console.warn("⚠️ No businesses found with created_by =", targetEmail);
    } else {
        console.log(`✅ Found ${businessesByEmail.length} businesses linked by EMAIL:`);
        businessesByEmail.forEach(b => console.log(`   - [${b.id}] ${b.business_name} (Status: ${b.status})`));
    }

    // 4. Check Service Providers linked by ID (sometimes used instead of email)
    if (user) {
        const { data: businessesById, error: idError } = await supabase
            .from('service_providers')
            .select('id, business_name, status, owner_id') // assuming owner_id might be used
            .eq('owner_id', user.id); // Check widely

        if (idError) {
            // owner_id might not exist, ignore
        } else if (businessesById && businessesById.length > 0) {
            console.log(`✅ Found ${businessesById.length} businesses linked by OWNER_ID:`);
            businessesById.forEach(b => console.log(`   - [${b.id}] ${b.business_name}`));
        }
    }

    // 5. Search for "Taxi" or similar to see if we can perform a manual match
    console.log("\n🔍 Searching for potential matches (Taxi/Transport)...");
    const { data: potentialMatches, error: searchError } = await supabase
        .from('service_providers')
        .select('id, business_name, created_by')
        .ilike('business_name', '%taxi%')
        .limit(5);

    if (searchError) {
        console.error("❌ Search Error:", searchError);
    } else if (potentialMatches) {
        potentialMatches.forEach(b => console.log(`   ? [${b.id}] ${b.business_name} (Created By: ${b.created_by})`));
    }
}

debugUserBusiness();
