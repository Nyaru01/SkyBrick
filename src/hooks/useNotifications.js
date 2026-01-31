import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to manage browser notifications
 * Provides: permission state, request permission function, send notification function
 */
export function useNotifications() {
    const [permission, setPermission] = useState('default');

    // Check initial permission state
    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    /**
     * Request notification permission from the user
     * @returns {Promise<boolean>} true if granted, false otherwise
     */
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('[Notifications] Not supported in this browser');
            return false;
        }

        if (Notification.permission === 'granted') {
            setPermission('granted');
            return true;
        }

        if (Notification.permission !== 'denied') {
            try {
                const result = await Notification.requestPermission();
                setPermission(result);
                return result === 'granted';
            } catch (err) {
                console.error('[Notifications] Permission request failed:', err);
                return false;
            }
        }

        return false;
    }, []);

    /**
     * Send a browser notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options (body, icon, tag, etc.)
     * @returns {Notification|null} The notification object or null if failed
     */
    const sendNotification = useCallback((title, options = {}) => {
        if (!('Notification' in window)) {
            console.warn('[Notifications] Not supported');
            return null;
        }

        if (Notification.permission !== 'granted') {
            console.warn('[Notifications] Permission not granted');
            return null;
        }

        try {
            const notification = new Notification(title, {
                icon: '/virtual-logo.jpg',
                badge: '/virtual-logo.jpg',
                vibrate: [200, 100, 200], // Mobile vibration pattern
                requireInteraction: false,
                silent: false,
                ...options
            });

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Focus window when clicked
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } catch (err) {
            console.error('[Notifications] Failed to send:', err);
            return null;
        }
    }, []);

    /**
     * Check if browser tab is currently hidden (in background)
     * @returns {boolean}
     */
    const isTabHidden = useCallback(() => {
        return document.hidden;
    }, []);

    return {
        permission,
        hasPermission: permission === 'granted',
        isSupported: 'Notification' in window,
        requestPermission,
        sendNotification,
        isTabHidden
    };
}
