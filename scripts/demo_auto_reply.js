
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Use the credentials we just validated for IMAP
const SMTP_USER = process.env.IMAP_USER;
const SMTP_PASS = process.env.IMAP_PASSWORD;

if (!SMTP_USER || !SMTP_PASS) {
    console.error('❌ Missing IMAP_USER or IMAP_PASSWORD in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('🔍 Fetching latest email from inbound_emails...');

    const { data: emails, error } = await supabase
        .from('inbound_emails')
        .select('*')
        .order('created_at', { ascending: false })
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

    // Extract reply-to
    const replyToMatch = email.sender.match(/<(.+)>/);
    const replyTo = replyToMatch ? replyToMatch[1] : email.sender;

    console.log(`📨 Replying to: ${replyTo}`);
    console.log(`   Re: ${email.subject}`);

    // Clean password
    let cleanPass = SMTP_PASS;
    if (cleanPass.startsWith('"') && cleanPass.endsWith('"')) {
        cleanPass = cleanPass.slice(1, -1);
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: SMTP_USER,
            pass: cleanPass
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Kosmoi Agent" <${SMTP_USER}>`,
            to: replyTo,
            subject: `Re: ${email.subject}`,
            html: `
                <div style="font-family: sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #4F46E5;">Kosmoi Intelligent System</h2>
                    <p>Hi there,</p>
                    <p>I successfully received your message: <strong>"${email.subject}"</strong></p>
                    <p>I am the AI Agent thinking about your request. 🧠✨</p>
                    <br/>
                    <p><em>(This is an automated reply proving the loop is closed!)</em></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">Original message from: ${email.sender}</p>
                    <p style="font-size: 12px; color: #888;">Received at: ${new Date(email.created_at).toLocaleString()}</p>
                </div>
            `
        });

        console.log('✅ Reply sent via Gmail SMTP!');
        console.log('   Message ID:', info.messageId);

    } catch (err) {
        console.error('❌ SMTP Error:', err);
    }
}

main();
