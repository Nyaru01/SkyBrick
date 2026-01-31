import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

// Récupérer la clé publique depuis les variables d'environnement Vite
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Convertir la clé VAPID en Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');

    // Accès au profil utilisateur depuis le store (mise à jour réactive)
    const userProfile = useGameStore(state => state.userProfile);

    useEffect(() => {
        // Vérifier le support
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Vérifier l'état de la souscription au chargement
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const requestPermission = async () => {
        if (!isSupported) {
            console.warn('Push notifications not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                await subscribe();
                return true;
            } else {
                console.log('❌ Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            return false;
        }
    };

    const subscribe = async () => {
        if (!isSupported || permission !== 'granted') {
            return null;
        }

        if (!VAPID_PUBLIC_KEY) {
            console.error('Missing VAPID_PUBLIC_KEY in environment variables');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Vérifier si déjà abonné
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // S'abonner
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true, // OBLIGATOIRE
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });

                console.log('✅ Push subscription created:', subscription);
            }

            // TODO: Envoyer la subscription au serveur (Phase 2)
            // Pour l'instant on log juste que l'action est requise
            console.log('[DEV] Ready to send subscription to server for:', userProfile?.name);
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription,
                    userId: userProfile?.id,
                    username: userProfile?.name,
                })
            }).catch(e => console.warn('[DEV] Server not ready yet for push subscription:', e));

            setIsSubscribed(true);
            return subscription;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return null;
        }
    };

    const unsubscribe = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Informer le serveur
                if (userProfile?.id) {
                    await fetch('/api/push/unsubscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userProfile.id
                        })
                    }).catch(e => console.warn('[DEV] Server not ready yet for push unsubscription:', e));
                }

                setIsSubscribed(false);
                console.log('✅ Unsubscribed from push notifications');
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
        }
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        requestPermission,
        subscribe,
        unsubscribe,
    };
};
