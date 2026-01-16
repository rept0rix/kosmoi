
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY;

if (!RESEND_API_KEY) {
    console.error('❌ Missing VITE_RESEND_API_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('🔍 Fetching latest email from inbound_emails...');

    // Get the most recent email
    const { data: emails, error } = await supabase
        .from('inbound_emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ DB Error:', error.message);
        return;
    }

    if (!emails || emails.length === 0) {
        console.log('📭 No emails found to reply to.');
        return;
    }

    const email = emails[0];
    console.log(`📨 Found email from: ${email.sender}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   To: ${email.recipient}`);

    // Construct Reply
    // Verify "From" address. It MUST be from @kosmoi.site verified domain.
    // We try to match the recipient, but if it's external, we default to 'naor@kosmoi.site' or 'support@kosmoi.site'
    let fromAddress = 'support@kosmoi.site';
    if (email.recipient && email.recipient.includes('@kosmoi.site')) {
        fromAddress = email.recipient; // Reply AS the alias receiving it
    }

    // Extract raw email from format "Name <email@domain.com>"
    const replyToMatch = email.sender.match(/<(.+)>/);
    const replyTo = replyToMatch ? replyToMatch[1] : email.sender;

    console.log(`📤 Sending reply to: ${replyTo} from ${fromAddress}...`);

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: `Kosmoi Agent <${fromAddress}>`,
                to: [replyTo],
                subject: `Re: ${email.subject}`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <p>Hi there,</p>
                        <p>I received your message: <strong>"${email.subject}"</strong></p>
                        <p>This is an automated reply verifying that the Kosmoi Agent system is fully operational. 🚀</p>
                        <hr />
                        <p style="font-size: 12px; color: #666;">Original message received at: ${new Date(email.received_at).toLocaleString()}</p>
                    </div>
                `
            })
        });

        const data = await res.json();

        if (res.ok) {
            console.log('✅ Reply sent successfully!');
            console.log('   ID:', data.id);
        } else {
            console.error('❌ Resend API Error:', data);
        }

    } catch (err) {
        console.error('❌ Exception:', err.message);
    }
}

main();
