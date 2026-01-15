
import { db } from '@/api/supabaseClient';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const PushService = {
    async register() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error('Push notifications are not supported by this browser.');
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    },

    async getSubscription() {
        // Ensure SW is ready
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    },

    async subscribe() {
        // Ensure SW is registered
        const registration = await this.register();
        await navigator.serviceWorker.ready;

        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            console.log('Push Subscription:', subscription);

            // Save subscription to Supabase
            await this.saveSubscription(subscription);

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to Push:', error);
            throw error;
        }
    },

    async unsubscribe() {
        const subscription = await this.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();

            // Remove from DB
            const user = await db.auth.getUser();
            if (user?.data?.user) {
                const { error } = await db.from('push_subscriptions').delete().match({
                    user_id: user.data.user.id,
                    endpoint: subscription.endpoint
                });
                if (error) console.error("Failed to remove subscription from DB:", error);
            }
        }
    },

    async saveSubscription(subscription) {
        const { keys } = subscription.toJSON();
        const user = await db.auth.getUser(); // Standard Supabase auth check

        if (!user?.data?.user) {
            console.warn("User not logged in, skipping subscription save.");
            return;
        }

        const { error } = await db.from('push_subscriptions').upsert({
            user_id: user.data.user.id,
            endpoint: subscription.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            user_agent: navigator.userAgent
        }, { onConflict: 'user_id, endpoint' });

        if (error) {
            console.error("Error saving subscription to DB:", error);
            throw error;
        }
    }
};
