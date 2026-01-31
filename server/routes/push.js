import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Sauvegarder une subscription
router.post('/subscribe', async (req, res) => {
    try {
        const { subscription, userId, username } = req.body;

        if (!userId || !subscription) {
            return res.status(400).json({ error: 'Missing userId or subscription' });
        }

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

        console.log(`✅ Push subscription saved for user: ${username} (${userId})`);
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

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

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
