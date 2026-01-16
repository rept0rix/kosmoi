import imaps from 'imap-simple';
import simpleParser from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 10000 // 10 seconds
    },
    supabase: {
        url: process.env.VITE_SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    }
};

async function main() {
    if (!config.imap.user || !config.imap.password) {
        console.error('❌ Missing IMAP credentials in .env');
        process.exit(1);
    }

    const supabase = createClient(config.supabase.url, config.supabase.key);

    console.log(`🔌 Connecting to Gmail (${config.imap.user})...`);

    try {
        const connection = await imaps.connect(config);
        console.log('✅ Connected to IMAP');

        await connection.openBox('INBOX');

        // Fetch unseen emails
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`📨 Found ${messages.length} new emails.`);

        for (const item of messages) {
            const all = item.parts.find(part => part.which === '');
            const id = item.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";

            // Parse email
            const parsed = await simpleParser.simpleParser(all.body);

            // Extract fields
            const from = parsed.from ? parsed.from.text : 'Unknown';
            // Important: We need the ORIGINAL recipient. 
            // When forwarded, it might be in 'To' or 'X-Forwarded-To'.
            // Simple approach: Use 'To' first.
            const to = parsed.to ? (Array.isArray(parsed.to) ? parsed.to[0].text : parsed.to.text) : 'Unknown';
            const subject = parsed.subject;
            const text = parsed.text;
            const html = parsed.html || text; // Fallback to text if no HTML

            console.log(`\n📥 Processing: "${subject}" from ${from} to ${to}`);

            // Insert to Supabase
            const { error } = await supabase
                .from('inbound_emails')
                .insert({
                    sender: from,
                    recipient: to, // This allows the UI to filter by "mailbox"
                    subject: subject,
                    body_text: text,
                    body_html: html,
                    raw_payload: { headers: parsed.headers }, // Store headers just in case
                    processed_status: 'unread'
                });

            if (error) {
                console.error('❌ Failed to save to DB:', error.message);
            } else {
                console.log('✅ Saved to Supabase');
            }
        }

        connection.end();
        console.log('👋 Done.');

    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.message.includes('Web login required') || err.message.includes('Invalid credentials')) {
            console.log('\n⚠️  GOOGLE AUTH ERROR: You likely need an "App Password".');
            console.log('   Go to: Google Account > Security > 2-Step Verification > App Passwords');
        }
    }
}

main();
