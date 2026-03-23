/**
 * SEND CLAIM INVITATIONS
 * ======================
 * Sends "claim your business" emails to unclaimed providers.
 *
 * Usage:
 *   node scripts/send_claim_invitations.js              # Dry run (no emails sent)
 *   node scripts/send_claim_invitations.js --send       # Actually send
 *   node scripts/send_claim_invitations.js --send --limit=10
 *   node scripts/send_claim_invitations.js --send --id=<provider_id>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const BASE_URL = 'https://kosmoi.site';
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--send');
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');
const SINGLE_ID = args.find(a => a.startsWith('--id='))?.split('=')[1];

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUnclaimedProviders() {
    let query = supabase
        .from('service_providers')
        .select('id, business_name, category, email, images')
        .is('claimed_by', null)
        .not('email', 'is', null)
        .neq('email', '')
        .limit(LIMIT);

    if (SINGLE_ID) {
        query = supabase
            .from('service_providers')
            .select('id, business_name, category, email, images')
            .eq('id', SINGLE_ID)
            .single();

        const { data, error } = await query;
        if (error) throw error;
        return [data];
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

async function createInviteToken(providerId) {
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data, error } = await supabase
        .from('invitations')
        .insert({
            service_provider_id: providerId,
            token,
            status: 'pending',
            expires_at: expiresAt.toISOString(),
            metadata: { source: 'soft_launch_batch' }
        })
        .select('token')
        .single();

    if (error) throw error;
    return data.token;
}

async function sendEmail(provider, claimUrl) {
    const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
            to: provider.email,
            template: 'claim_invite',
            data: {
                businessName: provider.business_name,
                claimUrl,
                category: provider.category,
            }
        }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
}

async function main() {
    console.log(`\n🚀 Kosmoi — Claim Invitation Sender`);
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no emails sent)' : '📧 LIVE SEND'}`);
    console.log(`Limit: ${SINGLE_ID ? `single provider (${SINGLE_ID})` : LIMIT}`);
    console.log('─'.repeat(50));

    const providers = await getUnclaimedProviders();
    console.log(`\nFound ${providers.length} unclaimed providers with emails\n`);

    const results = { sent: 0, failed: 0, skipped: 0 };

    for (const provider of providers) {
        process.stdout.write(`  ${provider.business_name} (${provider.email}) ... `);

        if (DRY_RUN) {
            console.log('⏭  skipped (dry run)');
            results.skipped++;
            continue;
        }

        try {
            const token = await createInviteToken(provider.id);
            const claimUrl = `${BASE_URL}/claim?token=${token}`;
            await sendEmail(provider, claimUrl);
            console.log('✅ sent');
            results.sent++;

            // Throttle — avoid rate limits
            await new Promise(r => setTimeout(r, 300));
        } catch (err) {
            console.log(`❌ failed: ${err.message}`);
            results.failed++;
        }
    }

    console.log('\n' + '─'.repeat(50));
    console.log(`✅ Sent:    ${results.sent}`);
    console.log(`❌ Failed:  ${results.failed}`);
    console.log(`⏭  Skipped: ${results.skipped}`);

    if (DRY_RUN) {
        console.log('\n💡 Run with --send to actually send emails\n');
    }
}

main().catch(err => {
    console.error('\n💥 Fatal error:', err.message);
    process.exit(1);
});
