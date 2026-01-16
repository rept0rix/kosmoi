
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const vapidKeys = {
    publicKey: process.env.VITE_VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
    'mailto:admin@kosmoi.com', // Replace with your email
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

async function sendPushToAll() {
    console.log("🚀 Sending Push Notification to all subscribers...");

    // Fetch all subscriptions
    const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
    if (error) throw error;

    console.log(`Found ${subs.length} subscriptions.`);

    const payload = JSON.stringify({
        title: 'Kosmoi Updates',
        body: 'This is a test notification from your new Push System! 🔔',
        url: 'https://kosmoi.site/profile'
    });

    for (const sub of subs) {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
            }
        };

        try {
            await webpush.sendNotification(pushSubscription, payload);
            console.log(`✅ Sent to user ${sub.user_id}`);
        } catch (err) {
            console.error(`❌ Failed to send to ${sub.user_id}:`, err.message);
            // Optionally delete invalid subscription
        }
    }
}

sendPushToAll();
