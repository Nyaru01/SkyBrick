Implémentation Push Notifications - Guide Complet
Architecture
Frontend (PWA)          Backend (Railway)         Push Service
    ↓                        ↓                         ↓
1. Demander permission   4. Recevoir subscription  7. Recevoir requête
2. S'abonner             5. Sauver en DB          8. Transmettre au device
3. Envoyer au serveur    6. Envoyer notification  9. Deliver notification
                             quand invitation

Étape 1 : Générer les Clés VAPID
Les clés VAPID permettent d'identifier votre serveur auprès du Push Service.
bash# Installer web-push (si pas déjà fait)
npm install web-push --save

# Générer les clés
npx web-push generate-vapid-keys

# Résultat :
# Public Key: BNxW...xyz (à mettre dans le frontend)
# Private Key: abc...789 (à garder SECRET dans le backend)
Ajouter dans Railway :
VAPID_PUBLIC_KEY=BNxW...xyz
VAPID_PRIVATE_KEY=abc...789
VAPID_SUBJECT=mailto:contact@skyjo-score.com

Étape 2 : Modifier le Service Worker
javascript// public/sw.js - Ajouter à votre Service Worker existant

// Écouter les push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  // Parser les données envoyées par le serveur
  const data = event.data ? event.data.json() : {};
  
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
  const data = event.notification.data;

  // Gérer les actions
  if (action === 'accept') {
    // Ouvrir l'app sur la room
    event.waitUntil(
      clients.openWindow(data.url || `/?room=${data.roomId}`)
    );
    
    // Envoyer une confirmation au serveur
    fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId: data.invitationId })
    });
  } else if (action === 'decline') {
    // Envoyer un refus au serveur
    fetch('/api/invitations/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId: data.invitationId })
    });
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
  // Tracking optionnel
});

Étape 3 : Frontend - Demander Permission & S'abonner
javascript// src/hooks/usePushNotifications.js
import { useEffect, useState } from 'react';
import { useProfileStore } from '../stores/profileStore';

const VAPID_PUBLIC_KEY = 'BNxW...xyz'; // Votre clé publique

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
  const profile = useProfileStore(state => state.profile);

  useEffect(() => {
    // Vérifier le support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

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

      // Envoyer la subscription au serveur
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId: profile.profileId,
          username: profile.profileName,
        })
      });

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
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.profileId
          })
        });
        
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

Étape 4 : Composant UI pour Activer les Notifications
javascript// src/components/NotificationSettings.jsx
import { usePushNotifications } from '../hooks/usePushNotifications';

const NotificationSettings = () => {
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    requestPermission, 
    unsubscribe 
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <p>❌ Les notifications push ne sont pas supportées sur cet appareil.</p>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>🔔 Notifications d'Invitation</h3>
      <p>Recevez des notifications quand un ami vous invite à jouer</p>

      {permission === 'default' && (
        <button onClick={requestPermission} className="btn-primary">
          Activer les notifications
        </button>
      )}

      {permission === 'denied' && (
        <div className="alert alert-warning">
          ⚠️ Vous avez refusé les notifications. 
          Pour les activer, allez dans les paramètres de votre navigateur.
        </div>
      )}

      {permission === 'granted' && !isSubscribed && (
        <button onClick={requestPermission} className="btn-primary">
          S'abonner aux notifications
        </button>
      )}

      {permission === 'granted' && isSubscribed && (
        <div>
          <div className="alert alert-success">
            ✅ Notifications activées
          </div>
          <button onClick={unsubscribe} className="btn-secondary">
            Désactiver les notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;

Étape 5 : Backend - Sauvegarder les Subscriptions
javascript// server/routes/push.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Sauvegarder une subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId, username } = req.body;

    // Sauvegarder en DB
    await pool.query(`
      INSERT INTO push_subscriptions (user_id, username, subscription, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        subscription = $3,
        username = $2,
        updated_at = NOW()
    `, [userId, username, JSON.stringify(subscription)]);

    console.log(`✅ Push subscription saved for user: ${username}`);
    res.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Se désabonner
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body;

    await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    console.log(`✅ User ${userId} unsubscribed from push`);
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

export default router;

Étape 6 : Backend - Envoyer des Notifications
javascript// server/utils/pushNotifications.js
import webpush from 'web-push';
import pool from '../db.js';

// Configurer web-push avec vos clés VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:contact@skyjo-score.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendInvitationNotification(inviterId, inviterName, invitedUserId, roomId) {
  try {
    // Récupérer la subscription du joueur invité
    const result = await pool.query(
      'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
      [invitedUserId]
    );

    if (result.rows.length === 0) {
      console.log(`No push subscription found for user: ${invitedUserId}`);
      return { success: false, reason: 'No subscription' };
    }

    const subscription = JSON.parse(result.rows[0].subscription);

    // Créer le payload de notification
    const payload = JSON.stringify({
      title: '🎮 Nouvelle Invitation',
      body: `${inviterName} vous invite à jouer !`,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      url: `/?room=${roomId}`,
      action: 'game-invitation',
      invitationId: `${inviterId}-${Date.now()}`,
      roomId: roomId,
      tag: `invitation-${roomId}`, // Évite les doublons
    });

    // Envoyer la notification
    const response = await webpush.sendNotification(subscription, payload);
    
    console.log(`✅ Push notification sent to user: ${invitedUserId}`);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending push notification:', error);

    // Si la subscription est invalide (410 Gone), la supprimer
    if (error.statusCode === 410) {
      await pool.query(
        'DELETE FROM push_subscriptions WHERE user_id = $1',
        [invitedUserId]
      );
      console.log(`Removed invalid subscription for user: ${invitedUserId}`);
    }

    return { success: false, error: error.message };
  }
}

// Envoyer à plusieurs utilisateurs
export async function sendBulkNotifications(userIds, payload) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendNotificationToUser(userId, payload))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { successful, failed, total: userIds.length };
}

Étape 7 : Intégration avec Socket.io (Invitations)
javascript// server/socket/gameHandlers.js
import { sendInvitationNotification } from '../utils/pushNotifications.js';

export function setupGameHandlers(io, socket) {
  // Quand un joueur invite un ami
  socket.on('sendInvitation', async ({ invitedUserId, roomId }) => {
    const inviterName = socket.playerName || 'Un joueur';
    const inviterId = socket.dbId;

    console.log(`📨 ${inviterName} invites user ${invitedUserId} to room ${roomId}`);

    // 1. Vérifier si l'invité est en ligne
    const invitedSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.dbId === invitedUserId);

    if (invitedSocket) {
      // Si en ligne, envoyer via socket
      invitedSocket.emit('gameInvitation', {
        inviterName,
        inviterId,
        roomId,
        timestamp: Date.now()
      });
      console.log('✅ Invitation sent via socket (user online)');
    }

    // 2. TOUJOURS envoyer une push notification (même si en ligne)
    // Car l'utilisateur peut avoir l'app en arrière-plan
    const pushResult = await sendInvitationNotification(
      inviterId,
      inviterName,
      invitedUserId,
      roomId
    );

    if (pushResult.success) {
      console.log('✅ Push notification sent');
    } else {
      console.log('⚠️ Push notification failed:', pushResult.reason);
    }

    // 3. Confirmer à l'inviteur
    socket.emit('invitationSent', {
      success: true,
      invitedUserId,
      roomId
    });
  });
}

Étape 8 : Migration Base de Données
sql-- migrations/005_push_subscriptions.sql

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  subscription JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_user_id ON push_subscriptions(user_id);

Étape 9 : Tester les Notifications
Test Manuel depuis la Console
javascript// Dans la console du navigateur (après s'être abonné)
const registration = await navigator.serviceWorker.ready;
registration.showNotification('Test', {
  body: 'Notification de test',
  icon: '/icons/icon-192.png',
  actions: [
    { action: 'yes', title: 'Oui' },
    { action: 'no', title: 'Non' }
  ]
});
Test depuis le Backend
javascript// server/test-push.js
import { sendInvitationNotification } from './utils/pushNotifications.js';

// Remplacer par un vrai user_id de test
await sendInvitationNotification(
  'inviter-id',
  'Alice',
  'invited-user-id',
  'TEST123'
);

🎯 Checklist d'Implémentation
Backend

 Installer web-push: npm install web-push
 Générer les clés VAPID
 Ajouter les clés dans Railway env vars
 Créer la table push_subscriptions
 Créer les routes /api/push/subscribe et /api/push/unsubscribe
 Créer pushNotifications.js avec sendInvitationNotification
 Intégrer avec Socket.io event sendInvitation

Frontend

 Modifier sw.js pour écouter les push events
 Créer usePushNotifications.js hook
 Créer NotificationSettings.jsx composant
 Ajouter le composant dans Settings ou Profile
 Tester sur Android Chrome
 Tester sur iOS (app installée uniquement)

Tests

 Permission demandée correctement
 Subscription sauvegardée en DB
 Notification reçue app fermée
 Clic sur notification ouvre l'app
 Actions (Accepter/Refuser) fonctionnent
 Unsubscribe fonctionne


⚠️ Points d'Attention
iOS

L'app DOIT être installée sur l'écran d'accueil
Ne fonctionne PAS dans Safari normal
iOS 16.4+ uniquement

Android

Fonctionne même dans le navigateur (pas besoin d'installer)
Meilleure expérience si installée

Permissions

L'utilisateur peut révoquer à tout moment
Toujours gérer le cas "permission denied"

Rate Limiting

Ne pas spammer les utilisateurs
Max 1 notification par invitation
Grouper si plusieurs invitations


📊 Métriques Recommandées
javascript// Tracker ces événements
- notification_permission_requested
- notification_permission_granted
- notification_permission_denied
- push_subscription_created
- push_notification_sent
- push_notification_received
- push_notification_clicked
- push_notification_action_accept
- push_notification_action_decline

🚀 Impact Attendu
Sans notifications :

Utilisateur doit être dans l'app pour voir l'invitation
Taux de réponse : ~30%

Avec notifications :

Utilisateur notifié même app fermée
Taux de réponse : ~70%
Engagement +150%