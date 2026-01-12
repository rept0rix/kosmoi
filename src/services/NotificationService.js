
import { supabase } from '@/api/supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const NotificationService = {
    /**
     * Convert VAPID key to Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    },

    /**
     * Request Permission and Subscribe
     */
    async subscribeUser() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error("Push notifications not supported");
        }

        if (!VAPID_PUBLIC_KEY) {
            throw new Error("VAPID Public Key not configured");
        }

        // 1. Register SW (if not already)
        // Usually done in main.jsx, but ensure it's ready
        const registration = await navigator.serviceWorker.ready;

        // 2. Subscribe
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        console.log("User Subscribed:", subscription);

        // 3. Save to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await this.saveSubscription(subscription, user.id);
        }

        return subscription;
    },

    /**
     * Save subscription to Supabase
     */
    async saveSubscription(subscription, userId) {
        const payload = {
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.toJSON().keys.p256dh,
            auth: subscription.toJSON().keys.auth,
            user_agent: navigator.userAgent
        };

        const { error } = await supabase.from('push_subscriptions').upsert(payload, { onConflict: 'user_id, endpoint' });
        if (error) throw error;
        console.log("Subscription saved to DB");
    }
};
