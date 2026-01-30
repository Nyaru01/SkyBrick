
import pool from './db.js';
import { sendInvitationNotification } from './utils/pushNotifications.js';

const userId = process.argv[2];

if (!userId) {
    console.error('Usage: node server/test_push_manual.js <USER_ID>');
    console.log('Trouvez votre USER_ID dans la console du navigateur (userProfile.id) ou dans la table users.');
    process.exit(1);
}

async function testPush() {
    console.log(`Sending test notification to ${userId}...`);

    const result = await sendInvitationNotification(
        'SYSTEM',
        'Système de Test',
        userId,
        'TEST-ROOM'
    );

    if (result.success) {
        console.log('✅ Notification sent successfully!');
        console.log('Response:', result.response);
    } else {
        console.error('❌ Failed to send notification:', result.error || result.reason);
    }

    await pool.end();
}

testPush();
