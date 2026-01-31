import webpush from 'web-push';
import pool from '../db.js';
import dotenv from 'dotenv';
dotenv.config();

// Configurer web-push avec vos clés VAPID
const publicKey = (process.env.VAPID_PUBLIC_KEY || '').trim();
const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();

if (!publicKey || !privateKey) {
    console.warn('⚠️ VAPID keys are missing! Push notifications will not work.');
} else {
    try {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:contact@skyjo-score.com',
            publicKey,
            privateKey
        );
        console.log('✅ VAPID configuration valid');
    } catch (err) {
        console.error('❌ VAPID Check Failed:', err.message);
    }
}

export async function sendInvitationNotification(inviterId, inviterName, invitedUserId, roomId) {
    try {
        console.log(`[PUSH] Attempting to notify ${invitedUserId} invited by ${inviterName}`);

        // Récupérer la subscription du joueur invité
        const result = await pool.query(
            'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
            [invitedUserId]
        );

        if (result.rows.length === 0) {
            console.log(`[PUSH] No subscription found for user: ${invitedUserId}`);
            return { success: false, reason: 'No subscription' };
        }

        const subscription = result.rows[0].subscription; // Already JSONB, so it's an object

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
        try {
            const response = await webpush.sendNotification(subscription, payload);
            console.log(`✅ [PUSH] Notification sent to user: ${invitedUserId}`);
            return { success: true, response };
        } catch (sendError) {
            // Gérer les erreurs spécifiques de web-push
            if (sendError.statusCode === 410) {
                console.log(`[PUSH] Subscription expired/invalid for user ${invitedUserId}, removing...`);
                await pool.query(
                    'DELETE FROM push_subscriptions WHERE user_id = $1',
                    [invitedUserId]
                );
            } else {
                throw sendError;
            }
            return { success: false, error: sendError.message };
        }

    } catch (error) {
        console.error('[PUSH] Error sending push notification:', error);
        return { success: false, error: error.message };
    }
}

// Envoyer à plusieurs utilisateurs
export async function sendBulkNotifications(userIds, payload) {
    // TODO: Implémenter si nécessaire pour des diffusions générales
    console.log('Bulk notifications not yet implemented');
    return { successful: 0 };
}
