// public/sw.js - Push Notifications Service Worker

// Écouter les push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received:', event);

    // Parser les données envoyées par le serveur
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.warn('[SW] Error parsing push data:', e);
            data = { body: event.data.text() };
        }
    }

    const title = data.title || '🎮 Skyjo Score';
    const options = {
        body: data.body || 'Nouvelle notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        image: data.image, // Image optionnelle
        data: {
            url: data.url || '/',
            action: data.action,
            invitationId: data.invitationId,
            roomId: data.roomId,
        },
        actions: [
            {
                action: 'accept',
                title: '✅ Rejoindre',
                icon: '/icons/accept.png' // optionnel
            },
            {
                action: 'decline',
                title: '❌ Ignorer',
                icon: '/icons/decline.png' // optionnel
            }
        ],
        tag: data.tag || 'default', // Évite les doublons
        requireInteraction: true, // Reste jusqu'à ce qu'on agisse (Android)
        vibrate: [200, 100, 200], // Pattern de vibration
        sound: '/sounds/notification.mp3' // Son (Android)
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Gérer les clics sur la notification
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    const action = event.action;
    const data = event.notification.data || {};

    // Gérer les actions
    if (action === 'accept') {
        // Ouvrir l'app sur la room
        event.waitUntil(
            clients.openWindow(data.url || `/?room=${data.roomId}`)
        );

        // Envoyer une confirmation au serveur
        if (data.invitationId) {
            fetch('/api/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invitationId: data.invitationId })
            }).catch(err => console.error('[SW] API Error:', err));
        }
    } else if (action === 'decline') {
        // Envoyer un refus au serveur
        if (data.invitationId) {
            fetch('/api/invitations/decline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invitationId: data.invitationId })
            }).catch(err => console.error('[SW] API Error:', err));
        }
    } else {
        // Clic sur la notification (pas sur un bouton)
        event.waitUntil(
            clients.openWindow(data.url || '/')
        );
    }
});

// Gérer la fermeture de la notification
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event);
});
