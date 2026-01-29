
/**
 * Utility to convert VAPID public key from base64 string
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const pushManager = {
    /**
     * Get current push subscription
     */
    getSubscription: async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return null;
        }

        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    },

    /**
     * Subscribe user to push notifications
     */
    subscribe: async (userId) => {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Get VAPID public key from server or env
            // For now we'll try to get it from a global or a default if not provided
            // In a real app, you might fetch it from /api/push/key
            let vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            // Fallback: Fetch from server if not in env (e.g., in production via Railway)
            if (!vapidPublicKey) {
                try {
                    const res = await fetch('/api/config/vapid');
                    if (res.ok) {
                        const data = await res.json();
                        vapidPublicKey = data.key;
                    }
                } catch (err) {
                    console.error('[PUSH] Failed to fetch VAPID key from server:', err);
                }
            }

            if (!vapidPublicKey) {
                console.error('[PUSH] No VAPID public key found in environment or server config');
                return null;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Send subscription to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, subscription })
            });

            console.log('[PUSH] User subscribed successfully');
            return subscription;
        } catch (err) {
            console.error('[PUSH] Subscription error:', err);
            return null;
        }
    },

    /**
     * Unsubscribe user from push notifications
     */
    unsubscribe: async (userId) => {
        try {
            const subscription = await pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });

                console.log('[PUSH] User unsubscribed');
            }
            return true;
        } catch (err) {
            console.error('[PUSH] Unsubscription error:', err);
            return false;
        }
    }
};
