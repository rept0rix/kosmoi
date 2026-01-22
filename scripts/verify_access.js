import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function verifyAccess() {
    console.log("🛡️ Starting Access Guard Verification...");

    const targetEmail = "na0ryank0@gmail.com";

    // 1. Check User Role
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', targetEmail);

    if (userError) {
        console.error("❌ Failed to fetch users:", userError);
        process.exit(1);
    }

    if (!users || users.length === 0) {
        console.error(`❌ User ${targetEmail} not found in public.users`);
        process.exit(1);
    }

    const user = users[0];
    console.log(`👤 User Found: ${user.email} (Role: ${user.role})`);

    if (user.role !== 'admin' && user.role !== 'vendor') {
        console.error(`❌ CRITICAL: User role is '${user.role}'! Expected 'admin' or 'vendor'.`);
        console.log("   --> Attempting auto-fix...");

        const { error: fixError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', user.id);

        if (fixError) {
            console.error("   ❌ Auto-fix failed:", fixError);
            process.exit(1);
        } else {
            console.log("   ✅ Auto-fix applied: Role set to 'admin'.");
        }
    } else {
        console.log("✅ Role Check Passed.");
    }

    // 2. Check Business Link
    const { data: businesses } = await supabase
        .from('service_providers')
        .select('id, business_name, created_by')
        .eq('created_by', targetEmail);

    if (businesses && businesses.length > 0) {
        console.log(`✅ Business Link Check Passed: Linked to '${businesses[0].business_name}'`);
    } else {
        console.warn("⚠️ Warning: No business linked to this email. User may see 'No Business' screen.");
        // Identify valid business (Island Taxi Service) and re-link if needed
        // (Simplified logic for verification script)
    }

    console.log("🛡️ Access Verification Complete.");
}

verifyAccess();
