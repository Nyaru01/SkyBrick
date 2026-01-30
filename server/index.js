
import express from 'express';
import { createServer } from 'http';
import fs from 'fs';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import webpush from 'web-push';
import dotenv from 'dotenv';
import {
    initializeGame,
    revealInitialCards,
    drawFromPile,
    drawFromDiscard,
    replaceCard,
    discardAndReveal,
    calculateFinalScores,
    endTurn
} from '../src/lib/skyjoEngine.js';

dotenv.config();

import feedbackRoutes from './routes/feedback.js';
import pushRoutes from './routes/push.js';
import { sendInvitationNotification } from './utils/pushNotifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the dist folder (built React app)
app.use(express.static(path.join(__dirname, '../dist')));

// --- Database Configuration ---
// Pool is now imported from ./db.js

const initDb = async () => {
    console.log('[DB] Starting database initialization...');

    // Step 1: Create users table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                emoji TEXT,
                avatar_id TEXT,
                vibe_id TEXT,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                migrated_to_v2 BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('[DB] ✓ Users table ready');
    } catch (e) { console.error('[DB] Users table error:', e.message); }

    // Step 2: Create friends table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS friends (
                user_id TEXT,
                friend_id TEXT,
                status TEXT DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, friend_id)
            );
        `);
        console.log('[DB] ✓ Friends table ready');
    } catch (e) { console.error('[DB] Friends table error:', e.message); }

    // Step 3: Create push_subscriptions table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100),
                subscription JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('[DB] ✓ Push subscriptions table ready');
    } catch (e) { console.error('[DB] Push subscriptions error:', e.message); }

    // Step 4: Create game_history table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_history (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                game_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('[DB] ✓ Game history table ready');
    } catch (e) { console.error('[DB] Game history error:', e.message); }

    // Step 5: Create feedbacks table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'general',
                status VARCHAR(20) DEFAULT 'new',
                device_info JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('[DB] ✓ Feedbacks table ready');
    } catch (e) { console.error('[DB] Feedbacks table error:', e.message); }

    // Step 6: Add missing columns (individual migrations)
    const migrations = [
        { table: 'users', col: 'emoji', sql: 'ALTER TABLE users ADD COLUMN emoji TEXT' },
        { table: 'users', col: 'avatar_id', sql: 'ALTER TABLE users ADD COLUMN avatar_id TEXT' },
        { table: 'users', col: 'vibe_id', sql: 'ALTER TABLE users ADD COLUMN vibe_id TEXT' },
        { table: 'users', col: 'level', sql: 'ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1' },
        { table: 'users', col: 'xp', sql: 'ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0' },
        { table: 'users', col: 'migrated_to_v2', sql: 'ALTER TABLE users ADD COLUMN migrated_to_v2 BOOLEAN DEFAULT FALSE' },
        { table: 'feedbacks', col: 'type', sql: "ALTER TABLE feedbacks ADD COLUMN type VARCHAR(50) DEFAULT 'general'" },
        { table: 'feedbacks', col: 'status', sql: "ALTER TABLE feedbacks ADD COLUMN status VARCHAR(20) DEFAULT 'new'" },
        { table: 'feedbacks', col: 'device_info', sql: 'ALTER TABLE feedbacks ADD COLUMN device_info JSONB' },
        { table: 'push_subscriptions', col: 'username', sql: 'ALTER TABLE push_subscriptions ADD COLUMN username VARCHAR(100)' },
        { table: 'push_subscriptions', col: 'created_at', sql: 'ALTER TABLE push_subscriptions ADD COLUMN created_at TIMESTAMP DEFAULT NOW()' },
        { table: 'push_subscriptions', col: 'updated_at', sql: 'ALTER TABLE push_subscriptions ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()' },
    ];

    for (const m of migrations) {
        try {
            const check = await pool.query(
                `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
                [m.table, m.col]
            );
            if (check.rows.length === 0) {
                await pool.query(m.sql);
                console.log(`[DB] ✓ Added ${m.table}.${m.col}`);
            }
        } catch (e) { console.error(`[DB] Migration ${m.table}.${m.col} error:`, e.message); }
    }

    console.log('[DB] Database initialization complete!');
};

initDb();

// --- Web Push Configuration ---
// --- Web Push Configuration ---
// Config handled in utils/pushNotifications.js
const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;

// Endpoint to expose VAPID public key to client
app.get('/api/config/vapid', (req, res) => {
    if (!vapidPublic) {
        return res.status(500).json({ error: 'VAPID public key not configured' });
    }
    res.json({ key: vapidPublic });
});

// --- Feedback API ---
app.use('/api/feedback', feedbackRoutes);
app.use('/api/push', pushRoutes);

// --- Social & Profile API ---

app.post('/api/social/profile', async (req, res) => {
    const { id, name, emoji, avatarId, vibeId, level, currentXP } = req.body;
    try {
        // Sanitize vibeId: empty string -> null to prevent UNIQUE constraint violation
        const sanitizedVibeId = vibeId && vibeId.trim() !== '' ? vibeId : null;

        await pool.query(`
            INSERT INTO users (id, name, emoji, avatar_id, vibe_id, level, xp, last_seen)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                emoji = EXCLUDED.emoji,
                avatar_id = EXCLUDED.avatar_id,
                vibe_id = EXCLUDED.vibe_id,
                level = EXCLUDED.level,
                xp = EXCLUDED.xp,
                last_seen = CURRENT_TIMESTAMP
        `, [id, name, emoji, avatarId, sanitizedVibeId, level, currentXP]);
        res.json({ status: 'ok' });
    } catch (err) {
        console.error('[API] Profile Sync Error (User ID:', id, '):', err);
        res.status(500).json({ error: 'Sync failed', details: err.message });
    }
});

app.get('/api/social/search', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await pool.query(`
            SELECT id, name, avatar_id, vibe_id FROM users
            WHERE name ILIKE $1 OR vibe_id ILIKE $1
            LIMIT 10
        `, [`%${query}%`]);

        // Inject real-time status
        const searchResultsWithStatus = result.rows.map(u => {
            const sockets = userStatus.get(String(u.id));
            const metadata = userMetadata.get(String(u.id));
            return {
                ...u,
                isOnline: sockets && sockets.size > 0,
                currentStatus: metadata?.status || 'OFFLINE'
            };
        });

        res.json(searchResultsWithStatus);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// --- Migration API (LocalStorage -> DB) ---

app.post('/api/social/migrate', async (req, res) => {
    const { userId, profile, history } = req.body;

    if (!userId || !profile) {
        return res.status(400).json({ error: 'Missing userId or profile' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Sync Profile & Mark as Migrated
        await client.query(`
            INSERT INTO users (id, name, emoji, avatar_id, vibe_id, level, xp, last_seen, migrated_to_v2)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, TRUE)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                emoji = EXCLUDED.emoji,
                avatar_id = EXCLUDED.avatar_id,
                vibe_id = EXCLUDED.vibe_id,
                level = EXCLUDED.level,
                xp = EXCLUDED.xp,
                last_seen = CURRENT_TIMESTAMP,
                migrated_to_v2 = TRUE
        `, [
            userId,
            profile.name || 'Joueur',
            profile.emoji || '🐱',
            profile.avatarId || 'cat',
            profile.vibeId && profile.vibeId.trim() !== '' ? profile.vibeId : null,
            profile.level || 1,
            profile.currentXP || 0
        ]);

        // 2. Sync History (if any)
        if (history && Array.isArray(history) && history.length > 0) {
            for (const game of history) {
                await client.query(`
                    INSERT INTO game_history (id, user_id, game_data, created_at)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (id) DO NOTHING
                `, [game.id, userId, JSON.stringify(game), game.date]);
            }
        }

        await client.query('COMMIT');
        console.log(`[MIGRATION] User ${userId} successfully migrated (${history?.length || 0} games)`);
        res.json({ status: 'ok', migratedCount: history?.length || 0 });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[MIGRATION] Critical Error for user', userId, ':', err);
        res.status(500).json({ error: 'Migration failed', details: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/social/friends/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.avatar_id, u.vibe_id, f.status, f.user_id as requester_id
            FROM users u
            JOIN friends f ON (f.user_id = $1 AND f.friend_id = u.id) OR (f.friend_id = $1 AND f.user_id = u.id)
            WHERE u.id != $1
        `, [userId]);

        // Inject real-time status from memory
        const friendsWithStatus = result.rows.map(f => {
            const sockets = userStatus.get(String(f.id));
            const metadata = userMetadata.get(String(f.id));
            return {
                ...f,
                isOnline: sockets && sockets.size > 0,
                currentStatus: metadata?.status || 'OFFLINE'
            };
        });

        res.json(friendsWithStatus);
    } catch (err) {
        console.error('[API] Fetch friends failed:', err);
        res.status(500).json({ error: 'Fetch friends failed', details: err.message });
    }
});

app.post('/api/social/friends/request', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await pool.query(`
            INSERT INTO friends (user_id, friend_id, status)
            VALUES ($1, $2, 'PENDING')
            ON CONFLICT DO NOTHING
        `, [userId, friendId]);

        // Real-time notification for recipient
        const friendSockets = userStatus.get(String(friendId));
        if (friendSockets && friendSockets.size > 0) {
            friendSockets.forEach(socketId => {
                io.to(socketId).emit('friend_request', { fromUserId: userId });
                io.to(socketId).emit('presence_refresh');
            });
        }

        res.json({ status: 'sent' });
    } catch (err) {
        res.status(500).json({ error: 'Request failed' });
    }
});

app.post('/api/social/friends/accept', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await pool.query(`
            UPDATE friends SET status = 'ACCEPTED'
            WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        `, [userId, friendId]);

        // Refresh lists for both sides immediately
        [userId, friendId].forEach(id => {
            const sockets = userStatus.get(String(id));
            if (sockets) {
                sockets.forEach(socketId => io.to(socketId).emit('presence_refresh'));
            }
        });

        res.json({ status: 'accepted' });
    } catch (err) {
        res.status(500).json({ error: 'Accept failed' });
    }
});

app.post('/api/social/friends/delete', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await pool.query(`
            DELETE FROM friends 
            WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        `, [userId, friendId]);
        res.json({ status: 'deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.get('/api/social/leaderboard/global', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, avatar_id, vibe_id, level, xp FROM users
            ORDER BY level DESC, xp DESC LIMIT 20
        `);

        // Inject real-time status
        const usersWithStatus = result.rows.map(u => {
            const userId = String(u.id);
            const sockets = userStatus.get(userId);
            const metadata = userMetadata.get(userId);
            return {
                ...u,
                isOnline: sockets && sockets.size > 0,
                currentStatus: metadata?.status || 'OFFLINE'
            };
        });

        res.json(usersWithStatus);
    } catch (err) {
        console.error('[API] Global Leaderboard failed:', err);
        res.status(500).json({ error: 'Leaderboard failed', details: err.message });
    }
});

app.get('/api/social/leaderboard/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Includes user and their accepted friends
        const result = await pool.query(`
            SELECT u.id, u.name, u.avatar_id, u.vibe_id, u.level, u.xp FROM users u
            WHERE u.id = $1 OR u.id IN (
                SELECT CASE WHEN user_id = $1 THEN friend_id ELSE user_id END
                FROM friends WHERE (user_id = $1 OR friend_id = $1) AND status = 'ACCEPTED'
            )
            ORDER BY level DESC, xp DESC
        `, [userId]);

        // Inject real-time status
        const usersWithStatus = result.rows.map(u => {
            const userId = String(u.id);
            const sockets = userStatus.get(userId);
            const metadata = userMetadata.get(userId);
            return {
                ...u,
                isOnline: sockets && sockets.size > 0,
                currentStatus: metadata?.status || 'OFFLINE'
            };
        });

        res.json(usersWithStatus);
    } catch (err) {
        console.error('[API] Friend Leaderboard failed:', err);
        res.status(500).json({ error: 'Friend leaderboard failed', details: err.message });
    }
});



// --- Server Utilities ---

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.locals.io = io;

const rooms = new Map();
const userStatus = new Map(); // userId -> Set of socketIds
const userMetadata = new Map(); // userId -> {status, etc}
const pendingDisconnections = new Map(); // userId -> setTimeout ID
const connectionAttempts = new Map(); // userId -> { count, lastAttempt }

const getPublicRooms = () => {
    const publicRooms = [];
    for (const [code, room] of rooms.entries()) {
        if (!room.gameStarted && room.players.length < 8 && room.isPublic) {
            publicRooms.push({
                code,
                hostName: room.players.find(p => p.isHost)?.name || 'Inconnu',
                playerCount: room.players.length,
                emoji: room.players.find(p => p.isHost)?.emoji || '🎮'
            });
        }
    }
    return publicRooms;
};

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const startNextRoundForRoom = (roomCode, room, ioInstance) => {
    room.playersReadyForNextRound = new Set();
    if (room.nextRoundTimeout) {
        clearTimeout(room.nextRoundTimeout);
        room.nextRoundTimeout = null;
    }

    if (!room.roundScored) {
        const roundScores = calculateFinalScores(room.gameState);
        roundScores.forEach(score => {
            const currentTotal = room.totalScores[score.playerId] || 0;
            const additional = score.finalScore || 0;
            room.totalScores[score.playerId] = currentTotal + additional;
        });
        room.roundScored = true;
    }

    const maxScore = Math.max(...Object.values(room.totalScores));
    if (maxScore >= 100) {
        room.isGameOver = true;
        const minScore = Math.min(...Object.values(room.totalScores));
        const winnerId = Object.keys(room.totalScores).find(id => room.totalScores[id] === minScore);
        const winnerPlayer = room.players.find(p => p.id === winnerId);
        room.gameWinner = { id: winnerId, name: winnerPlayer?.name, emoji: winnerPlayer?.emoji, score: minScore };
        ioInstance.to(roomCode).emit('game_over', { totalScores: room.totalScores, winner: room.gameWinner });

        // Return players to 'ONLINE' status
        room.players.forEach(p => {
            const stringId = String(p.dbId);
            userMetadata.set(stringId, { status: 'ONLINE' });
            io.emit('user_presence_update', { userId: stringId, status: 'ONLINE' });
        });
    } else {
        room.roundNumber++;
        room.roundScored = false;
        const gamePlayers = room.players.map(p => ({ id: p.id, name: p.name, emoji: p.emoji }));
        room.gameState = initializeGame(gamePlayers);
        ioInstance.to(roomCode).emit('game_started', { gameState: room.gameState, totalScores: room.totalScores, roundNumber: room.roundNumber });
    }
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.emit('room_list_update', getPublicRooms());

    socket.on('register_user', ({ id, name, emoji, vibeId }) => {
        const stringId = String(id);
        const now = Date.now();

        // --- 1. RATE LIMITING ---
        const attempt = connectionAttempts.get(stringId) || { count: 0, lastAttempt: 0 };
        if (attempt.count >= 3 && (now - attempt.lastAttempt) < 5000) {
            console.warn(`[RATE LIMIT] ${name} (${stringId}) connecting too fast`);
            socket.emit('error', 'Trop de connexions. Attends 5 secondes.');
            socket.disconnect(true);
            return;
        }
        if (now - attempt.lastAttempt > 5000) attempt.count = 0;
        attempt.count++;
        attempt.lastAttempt = now;
        connectionAttempts.set(stringId, attempt);

        socket.dbId = stringId;
        socket.playerName = name;

        // --- 2. MULTI-TAB PRESENCE ---
        // Cancel any pending disconnection for this user
        if (pendingDisconnections.has(stringId)) {
            console.log(`[PRESENCE] Cancelling offline timer for ${stringId} (Active socket)`);
            clearTimeout(pendingDisconnections.get(stringId));
            pendingDisconnections.delete(stringId);
        }

        // Ensure user has a socket pool
        if (!userStatus.has(stringId)) {
            userStatus.set(stringId, new Set());
        }

        const pool = userStatus.get(stringId);
        pool.add(socket.id);

        // Update metadata
        userMetadata.set(stringId, { status: 'ONLINE', lastSeen: Date.now() });

        // Broadcast presence update
        io.emit('user_presence_update', { userId: stringId, status: 'ONLINE' });
        console.log(`[USER] Registered: ${name} (${stringId}). Socket: ${socket.id}. Pool size: ${pool.size}`);
    });

    socket.on('create_room', ({ playerName, emoji, dbId, isPublic = true, autoInviteFriendId }) => {
        const roomCode = generateRoomCode();
        const effectiveDbId = dbId || socket.dbId;
        rooms.set(roomCode, {
            gameState: null,
            players: [{ id: socket.id, dbId: effectiveDbId, name: playerName, emoji, isHost: true }],
            totalScores: {},
            roundNumber: 1,
            gameStarted: false,
            isGameOver: false,
            gameWinner: null,
            isPublic: !!isPublic
        });
        socket.join(roomCode);
        socket.emit('room_created', roomCode);

        // ATOMIC INVITE v2: Invitation with Retry and Feedback
        if (autoInviteFriendId) {
            const stringFriendId = String(autoInviteFriendId);
            console.log(`[ATOMIC INVITE] Starting retry loop for ${stringFriendId}`);

            const sendWithRetry = async (retriesLeft) => {
                const sockets = userStatus.get(stringFriendId);
                if (sockets && sockets.size > 0) {
                    console.log(`[ATOMIC INVITE] Success on attempt ${4 - retriesLeft}. Sending to ${sockets.size} sockets.`);
                    sockets.forEach(socketId => {
                        io.to(socketId).emit('game_invitation', { fromName: playerName, roomCode });
                    });
                    socket.emit('invitation_sent', { friendId: stringFriendId });
                    return true;
                }

                if (retriesLeft > 0) {
                    const delay = (4 - retriesLeft) * 300; // 300ms, 600ms, 900ms
                    console.log(`[ATOMIC INVITE] Friend ${stringFriendId} offline. Retrying in ${delay}ms...`);
                    setTimeout(() => sendWithRetry(retriesLeft - 1), delay);
                    return false;
                }

                console.log(`[ATOMIC INVITE] Final Failure for ${stringFriendId}`);
                socket.emit('invitation_failed', { reason: 'OFFLINE', friendId: stringFriendId });
                return false;
            };

            sendWithRetry(3); // Start with 3 retries
        }

        io.to(roomCode).emit('player_list_update', rooms.get(roomCode).players);
        io.emit('room_list_update', getPublicRooms());
    });

    socket.on('join_room', ({ roomCode, playerName, emoji, dbId }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) { socket.emit('error', 'Salle introuvable'); return; }
        if (room.gameStarted) { socket.emit('error', 'La partie a déjà commencé'); return; }
        if (room.players.some(p => p.id === socket.id)) return;
        if (room.players.length >= 8) { socket.emit('error', 'Salle pleine'); return; }

        const effectiveDbId = dbId || socket.dbId;
        room.players.push({ id: socket.id, dbId: effectiveDbId, name: playerName, emoji, isHost: false });
        socket.join(roomCode.toUpperCase());
        io.to(roomCode.toUpperCase()).emit('player_list_update', room.players);
        io.emit('room_list_update', getPublicRooms());
        socket.to(roomCode.toUpperCase()).emit('new_player_joined', { playerName, emoji });
    });

    socket.on('start_game', (roomCode) => {
        const room = rooms.get(roomCode);
        if (!room) return;
        // Include dbId for robust player identification on client (reconnects)
        const gamePlayers = room.players.map(p => ({ id: p.id, name: p.name, emoji: p.emoji, dbId: p.dbId }));
        room.gameState = initializeGame(gamePlayers);
        room.gameStarted = true;

        // Update presence to IN_GAME
        room.players.forEach(p => {
            if (p.dbId) {
                const stringId = String(p.dbId);
                userMetadata.set(stringId, { status: 'IN_GAME' });
                io.emit('user_presence_update', { userId: stringId, status: 'IN_GAME' });
            }
        });

        io.emit('room_list_update', getPublicRooms());
        if (Object.keys(room.totalScores).length === 0) gamePlayers.forEach(p => room.totalScores[p.id] = 0);
        io.to(roomCode).emit('game_started', { gameState: room.gameState, totalScores: room.totalScores, roundNumber: room.roundNumber });
    });

    socket.on('game_action', ({ roomCode, action, payload }) => {
        const room = rooms.get(roomCode);
        if (!room || !room.gameState) return;
        const pIdx = room.gameState.players.findIndex(p => p.id === socket.id);
        if (pIdx === -1) return;

        let lastAction = { type: action, playerId: socket.id, playerName: room.gameState.players[pIdx]?.name, card: null, timestamp: Date.now() };

        try {
            let newState = { ...room.gameState };
            if (newState.phase === 'INITIAL_REVEAL') {
                if (action === 'reveal_initial') newState = revealInitialCards(newState, pIdx, payload.cardIndices);
            } else {
                if (room.gameState.players[room.gameState.currentPlayerIndex].id !== socket.id) return;
                switch (action) {
                    case 'draw_pile': newState = drawFromPile(newState); break;
                    case 'draw_discard': newState = drawFromDiscard(newState); break;
                    case 'replace_card':
                        const replacedCard = room.gameState.players[pIdx].hand[payload.cardIndex];
                        lastAction.card = replacedCard ? { ...replacedCard, isRevealed: true } : null;
                        newState = replaceCard(newState, payload.cardIndex);
                        newState = endTurn(newState);
                        break;
                    case 'discard_and_reveal': newState = discardAndReveal(newState, payload.cardIndex); newState = endTurn(newState); break;
                    case 'discard_drawn':
                        if (!newState.drawnCard) return;
                        lastAction.card = { ...newState.drawnCard, isRevealed: true };
                        newState = { ...newState, discardPile: [...newState.discardPile, { ...newState.drawnCard, isRevealed: true }], drawnCard: null, turnPhase: 'MUST_REVEAL' };
                        break;
                    case 'reveal_hidden':
                        const player = newState.players[pIdx];
                        const newHand = player.hand.map((card, i) => i === payload.cardIndex ? { ...card, isRevealed: true } : card);
                        newState.players[pIdx] = { ...player, hand: newHand };
                        newState.turnPhase = 'DRAW';
                        newState = endTurn(newState);
                        break;
                    case 'undo_draw_discard':
                        if (newState.turnPhase !== 'MUST_REPLACE' || !newState.drawnCard) return;
                        newState = { ...newState, discardPile: [...newState.discardPile, newState.drawnCard], drawnCard: null, turnPhase: 'DRAW' };
                        lastAction.type = 'undo_draw_discard';
                        lastAction.card = null;
                        break;
                }
            }
            room.gameState = newState;
            io.to(roomCode).emit('game_update', { gameState: newState, lastAction });
        } catch (e) {
            socket.emit('error', e.message);
        }
    });

    socket.on('invite_friend', async ({ friendId, roomCode, fromName }) => {
        const stringFriendId = String(friendId);
        console.log(`[INVITE] From ${fromName} to ${stringFriendId} for room ${roomCode}`);
        const sockets = userStatus.get(stringFriendId);
        if (sockets && sockets.size > 0) {
            console.log(`[INVITE] Sending to ${sockets.size} sockets of ${stringFriendId}`);
            sockets.forEach(socketId => {
                io.to(socketId).emit('game_invitation', { fromName, roomCode });
            });
        } else {
            console.log(`[INVITE] Target ${stringFriendId} OFFLINE (Socket not found)`);
        }

        // Always Try Push Notification (even if offline, OR especially if offline)
        sendInvitationNotification(String(socket.dbId), fromName, friendId, roomCode)
            .then(res => {
                if (res.success) {
                    console.log('[PUSH] Invitation sent successfully');
                    socket.emit('debug_push_log', { type: 'success', message: 'Push sent to server gateway' });
                } else {
                    console.log('[PUSH] Failed to send invitation:', res.error || res.reason);
                    socket.emit('debug_push_log', { type: 'error', message: res.error || res.reason });
                }
            })
            .catch(err => {
                console.error('[PUSH] Unexpected error:', err);
                socket.emit('debug_push_log', { type: 'error', message: err.message });
            });
    });

    const handlePlayerLeave = (socket) => {
        for (const [roomCode, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                const leavingPlayer = room.players[playerIndex];
                room.players.splice(playerIndex, 1);

                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                } else {
                    let newHostName = null;
                    // If host left, assign new host
                    if (leavingPlayer.isHost) {
                        room.players[0].isHost = true;
                        newHostName = room.players[0].name;
                    }

                    io.to(roomCode).emit('player_left', { playerId: socket.id, playerName: leavingPlayer.name, newHost: newHostName });
                    io.to(roomCode).emit('player_list_update', room.players);

                    if (room.gameStarted && room.players.length < 2) {
                        room.gameStarted = false;
                        room.gameState = null;
                        const reason = leavingPlayer.isHost ? "L'hôte a quitté la partie" : "Pas assez de joueurs";
                        io.to(roomCode).emit('game_cancelled', { reason });
                    }
                }
                io.emit('room_list_update', getPublicRooms());
                socket.leave(roomCode); // Ensure socket leaves the room channel
                break;
            }
        }
    };

    socket.on('chat_typing', ({ toId, isTyping }) => {
        const friendSockets = userStatus.get(String(toId));
        if (friendSockets) {
            friendSockets.forEach(socketId => {
                io.to(socketId).emit('chat_typing', { fromId: socket.dbId, isTyping });
            });
        }
    });

    socket.on('private_message', ({ toId, text }) => {
        if (!socket.dbId) {
            console.warn('[CHAT] Message drop: No dbId for sender socket:', socket.id);
            return;
        }

        console.log(`[CHAT] Private message from ${socket.dbId} (${socket.playerName}) to ${toId}: ${text}`);

        const msg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            fromId: socket.dbId,
            toId: String(toId),
            text,
            timestamp: Date.now()
        };

        // Send to recipient
        const recipientSockets = userStatus.get(String(toId));
        if (recipientSockets && recipientSockets.size > 0) {
            console.log(`[CHAT] Sending to ${recipientSockets.size} sockets for recipient ${toId}`);
            recipientSockets.forEach(sid => io.to(sid).emit('private_message', msg));
        } else {
            console.warn(`[CHAT] Recipient ${toId} has no active sockets!`);
        }

        // Send back to sender's other tabs
        const senderSockets = userStatus.get(socket.dbId);
        if (senderSockets) {
            senderSockets.forEach(sid => {
                if (sid !== socket.id) {
                    console.log(`[CHAT] Syncing to sender other socket: ${sid}`);
                    io.to(sid).emit('private_message', msg);
                }
            });
        }
    });

    socket.on('leave_room', (code) => {
        handlePlayerLeave(socket);
    });

    socket.on('disconnect', () => {
        if (socket.dbId) {
            const stringId = String(socket.dbId);
            const sockets = userStatus.get(stringId);
            if (sockets) {
                sockets.delete(socket.id);
                console.log(`[USER] Socket detached: ${socket.id} from ${stringId}. Remaining: ${sockets.size}`);
                if (sockets.size === 0) {
                    // GRACE PERIOD: Wait 10 seconds before marking OFFLINE
                    // This is long enough for most mobile micro-disconnects/reloads
                    console.log(`[PRESENCE] Starting 10s grace period for ${stringId}`);
                    const timer = setTimeout(() => {
                        // ULTIMATE CHECK: Did they really stay disconnected?
                        // We check the userStatus Map which is updated by any new socket registration
                        const currentSockets = userStatus.get(stringId);

                        if (!currentSockets || currentSockets.size === 0) {
                            userStatus.delete(stringId);
                            userMetadata.delete(stringId);
                            io.emit('user_presence_update', { userId: stringId, status: 'OFFLINE' });
                            console.log(`[USER] Offline (Confirmed): ${stringId}`);
                        } else {
                            console.log(`[USER] Offline cancelled for ${stringId} (Active sockets found: ${currentSockets.size})`);
                        }
                        pendingDisconnections.delete(stringId);
                    }, 10000); // 10s is safer for mobile
                    pendingDisconnections.set(stringId, timer);
                }
            }
        }
        handlePlayerLeave(socket);
    });
});

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            db: 'connected',
            env_db_url: !!process.env.DATABASE_URL,
            table_feedbacks: (await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedbacks')")).rows[0].exists
        });
    } catch (error) {
        console.error('[HEALTH ERROR]', error);
        res.status(500).json({
            status: 'error',
            db: 'disconnected',
            error: error.message,
            env_db_url: !!process.env.DATABASE_URL
        });
    }
});

// Version Check Endpoint
app.get('/api/version', (req, res) => {
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        res.json({ version: packageJson.version, t: Date.now() });
    } catch (error) {
        console.error('[VERSION CHECK]', error);
        res.status(500).json({ error: 'Version check failed' });
    }
});

app.get('*', (req, res) => {
    // If it's an API request that didn't match anything, return 404 JSON instead of HTML
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
    }

    res.sendFile(path.join(__dirname, '../dist', 'index.html'), (err) => {
        if (err) {
            // In dev mode, dist/index.html doesn't exist. 
            // Return 200 with HTML only for root or frontend-y paths, 404 otherwise.
            if (req.path === '/' || !req.path.includes('.')) {
                res.status(200).send('<h1>SkyJo Server Running</h1>');
            } else {
                res.status(404).send('Not found');
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
