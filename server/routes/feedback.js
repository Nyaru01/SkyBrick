import express from 'express';
import { validateFeedback } from '../middleware/validateFeedback.js';
import { feedbackLimiter } from '../middleware/rateLimiter.js';
import { adminAuth } from '../middleware/adminAuth.js';
import pool from '../db.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====

// Submit feedback
router.post('/', feedbackLimiter, validateFeedback, async (req, res) => {
    try {
        const { user_id, username, content, type, device_info } = req.body;

        const result = await pool.query(
            `INSERT INTO feedbacks (user_id, username, content, type, device_info) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
            [user_id || null, username, content, type || 'general', JSON.stringify(device_info || {})]
        );

        console.log(`[FEEDBACK] New submission from ${username} (ID: ${result.rows[0].id})`);

        res.status(201).json({
            success: true,
            message: 'Feedback received. Thank you!',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('[FEEDBACK ERROR] Details:', error.message, 'Stack:', error.stack);
        res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
    }
});

// ===== ADMIN ROUTES =====

// List all feedbacks
router.get('/admin/feedbacks', adminAuth, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM feedbacks';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const countQuery = status
            ? 'SELECT COUNT(*) FROM feedbacks WHERE status = $1'
            : 'SELECT COUNT(*) FROM feedbacks';
        const countResult = await pool.query(countQuery, status ? [status] : []);

        res.json({
            feedbacks: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('[ADMIN ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch feedbacks' });
    }
});

// Update status
router.patch('/admin/feedbacks/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['new', 'read', 'archived'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await pool.query(
            'UPDATE feedbacks SET status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({ success: true, message: 'Feedback updated' });
    } catch (error) {
        console.error('[ADMIN ERROR]', error);
        res.status(500).json({ error: 'Failed to update feedback' });
    }
});

// Delete feedback
router.delete('/admin/feedbacks/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM feedbacks WHERE id = $1', [id]);

        res.json({ success: true, message: 'Feedback deleted' });
    } catch (error) {
        console.error('[ADMIN ERROR]', error);
        res.status(500).json({ error: 'Failed to delete feedback' });
    }
});

// Online Users (via Socket.io)
router.get('/admin/online-users', adminAuth, (req, res) => {
    try {
        const { io } = req.app.locals; // Socket.io instance from app.locals

        if (!io) {
            return res.status(503).json({ error: 'Socket service unavailable' });
        }

        // Inspect sockets
        // io.sockets.sockets is a Map in Socket.io v4
        const onlineUsers = Array.from(io.sockets.sockets.values()).map(socket => ({
            id: socket.id,
            // Attempt to retrieve user data attached to socket
            // In SkyJo implementation, dbId or playerName might be attached
            // Let's inspect what we typically attach
            dbId: socket.dbId || null,
            username: socket.playerName || 'Anonyme',
            connectedAt: socket.handshake.time,
            rooms: Array.from(socket.rooms), // List of rooms
        }));

        res.json({
            count: onlineUsers.length,
            users: onlineUsers
        });
    } catch (error) {
        console.error('[ADMIN ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch online users' });
    }
});

// ===== USER MANAGEMENT ROUTES (ADMIN) =====

// Get all users (DB)
router.get('/admin/all-users', adminAuth, async (req, res) => {
    try {
        const { limit = 50, offset = 0, search } = req.query;
        console.log(`[ADMIN] Fetching users (limit=${limit}, offset=${offset}, search=${search})`);

        let query = 'SELECT * FROM users';
        const params = [];

        if (search) {
            query += ' WHERE name ILIKE $1 OR vibe_id ILIKE $1 OR id ILIKE $1';
            params.push(`%${search}%`);
        }

        const limitNum = parseInt(limit) || 50;
        const offsetNum = parseInt(offset) || 0;

        query += ' ORDER BY last_seen DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limitNum, offsetNum);

        const result = await pool.query(query, params);
        console.log(`[ADMIN] Users fetched: ${result.rows.length}`);

        // Count query
        let countQuery = 'SELECT COUNT(*) FROM users';
        const countParams = [];
        if (search) {
            countQuery += ' WHERE name ILIKE $1 OR vibe_id ILIKE $1 OR id ILIKE $1';
            countParams.push(`%${search}%`);
        }
        const countResult = await pool.query(countQuery, countParams);

        // Optional: Inject online status (Skip for now to ensure stability)
        // const { io } = req.app.locals; 

        res.json({
            users: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: limitNum,
            offset: offsetNum
        });

    } catch (error) {
        console.error('[ADMIN ERROR] Fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users', details: error.message, stack: error.stack });
    }
});

// Delete user (and cleanup)
router.delete('/admin/users/:id', adminAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        // Cleanup related tables (Cascading usually handles this if configured, but let's be safe/explicit if FKs missing)
        await client.query('DELETE FROM friends WHERE user_id = $1 OR friend_id = $1', [id]);
        await client.query('DELETE FROM feedbacks WHERE user_id = $1', [id]);
        await client.query('DELETE FROM push_subscriptions WHERE user_id = $1', [id]);
        await client.query('DELETE FROM game_history WHERE user_id = $1', [id]);

        // Delete user
        const result = await client.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        await client.query('COMMIT');

        // Optional: Disconnect socket if online
        const { io } = req.app.locals;
        // Finding socket by dbId is tricky without the map access here, 
        // but the client will disconnect naturally or re-login fail.

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[ADMIN ERROR] Delete user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    } finally {
        client.release();
    }
});


export default router;
