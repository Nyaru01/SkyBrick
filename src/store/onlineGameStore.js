
import { create } from 'zustand';
import { io } from 'socket.io-client';
import { AVATARS } from '../lib/avatars';
import { useGameStore } from './gameStore';

// Dynamic socket URL: in production use same origin, in dev use localhost
const SOCKET_URL = import.meta.env.PROD
    ? window.location.origin
    : 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling']
});

// Track if listeners have been set up
let listenersInitialized = false;

export const useOnlineGameStore = create((set, get) => ({
    // Connection State
    isConnected: false,
    socketId: null, // Expose ID
    playerName: '',
    playerEmoji: '🐱',
    roomCode: null,
    isHost: false,
    publicRooms: [], // Available public rooms
    error: null,

    // Game State (synced from server)
    gameState: null,
    players: [],
    totalScores: {},
    roundNumber: 1,
    gameStarted: false,
    onlineStarted: false, // Alias for isConnected/inSession
    activeState: null,    // Alias for gameState
    isGameOver: false,
    gameWinner: null,
    readyStatus: { readyCount: 0, totalPlayers: 0 }, // Track ready players for next round
    timeoutExpired: false, // True when 10s timeout has passed and host can force-start

    // Breakout Online State
    breakoutState: {
        paddleX: 0.5,
        opponentPaddleX: 0.5,
        balls: [],
        playerBricks: null,
        opponentBricks: null,
        score: 0,
        opponentScore: 0,
        lives: 3,
        gameState: null,
        isGameOver: false,
        winner: null
    },

    // Redirection State (when host leaves)
    redirectionState: { active: false, timer: 5, reason: '' },

    // UI Local State
    selectedCardIndex: null,

    // Animation feedback state
    lastAction: null,

    // Notification state for toasts
    lastNotification: null,

    // Animation state
    pendingAnimation: null, // { type, sourceId, targetId, card, onComplete }
    setPendingAnimation: (animation) => set({ pendingAnimation: animation }),
    clearPendingAnimation: () => set({ pendingAnimation: null }),


    // Actions
    connect: () => {
        // Set up listeners only once
        if (!listenersInitialized) {
            listenersInitialized = true;

            socket.on('connect', () => {
                console.log('[Socket] Connected:', socket.id);
                set({ isConnected: true, socketId: socket.id, error: null });
            });

            socket.on('disconnect', () => {
                console.log('[Socket] Disconnected');
                set({ isConnected: false, socketId: null });
            });

            socket.on('error', (msg) => {
                console.log('[Socket] Error:', msg);
                set({ error: msg });
                // Auto-clear error after 3s
                setTimeout(() => set({ error: null }), 3000);
            });

            socket.on('room_created', (roomCode) => {
                console.log('[Socket] Room created:', roomCode);
                set({ roomCode, isHost: true, error: null });
            });

            socket.on('room_list_update', (rooms) => {
                set({ publicRooms: rooms });
            });

            socket.on('new_player_joined', ({ playerName, emoji }) => {
                // Convert avatarId to real emoji (emoji field contains the avatar ID like 'cat')
                // Avatar removed from notification text as per user request for cleaner UI

                set({
                    lastNotification: {
                        type: 'info',
                        message: `${playerName} a rejoint la partie !`,
                        sound: 'join', // Custom flag to trigger sound
                        timestamp: Date.now()
                    }
                });
            });

            socket.on('invitation_sent', () => {
                set({
                    lastNotification: {
                        type: 'success',
                        message: "Invitation envoyée !",
                        timestamp: Date.now()
                    }
                });
            });

            socket.on('invitation_failed', ({ reason }) => {
                set({
                    lastNotification: {
                        type: 'error',
                        message: reason === 'OFFLINE' ? "L'ami est hors ligne" : "Échec de l'invitation",
                        timestamp: Date.now()
                    }
                });
            });

            socket.on('player_list_update', (players) => {
                console.log('[Socket] Player list update:', players.length, 'players, my socket.id:', socket.id);
                // Use socket.id directly - more reliable than state.socketId which may be stale
                const me = players.find(p => p.id === socket.id);
                console.log('[Socket] Found me:', me?.name, 'isHost:', me?.isHost);
                set({ players, isHost: me?.isHost === true });
            });

            socket.on('game_started', ({ gameState, totalScores, roundNumber }) => {
                console.log('[Socket] Game started, round:', roundNumber);
                set({
                    gameState,
                    activeState: gameState,
                    totalScores,
                    roundNumber,
                    gameStarted: true,
                    onlineStarted: true,
                    isGameOver: false,
                    gameWinner: null,
                    selectedCardIndex: null,
                    readyStatus: { readyCount: 0, totalPlayers: 0 },
                    timeoutExpired: false
                });
            });

            socket.on('game_update', ({ gameState, lastAction }) => {
                // If there's an action to animate, do it first
                if (lastAction) {
                    const { type, playerId, cardIndex, cardValue } = lastAction;
                    // We need to find the player to execute animation 
                    // But wait, the `gameState` received is the NEW state (post-action).
                    // This is tricky. In local, we animate THEN update.
                    // Here we receive the update. If we set it immediately, the card teleports.
                    // So we must: 
                    // 1. NOT set gameState immediately.
                    // 2. Set animation.
                    // 3. On animation complete, set gameState.

                    // Helper to get Source/Target IDs
                    let sourceId = null;
                    let targetId = null;
                    let cardToAnimate = null;

                    if (type === 'draw_pile') {
                        sourceId = 'deck-pile';
                        targetId = 'drawn-card-slot';
                        // For draw, we might not know the card if it's hidden, 
                        // but usually if I drew it, I know it? 
                        // Or if opponent drew, I assume it's face down?
                        // The server `lastAction` should probably contain details.
                    } else if (type === 'draw_discard') {
                        sourceId = 'discard-pile';
                        targetId = 'drawn-card-slot';
                        cardToAnimate = { value: cardValue, isRevealed: true }; // We know value if from discard
                    } else if (type === 'replace_card') {
                        // From center to slot
                        sourceId = 'drawn-card-slot';
                        targetId = `card-${playerId}-${cardIndex}`;
                        cardToAnimate = { value: cardValue, isRevealed: true };
                    } else if (type === 'discard_drawn') {
                        // From center to discard
                        sourceId = 'drawn-card-slot';
                        targetId = 'discard-pile';
                        cardToAnimate = { value: cardValue, isRevealed: true };
                    } else if (type === 'discard_and_reveal') {
                        // This is a complex one: Card goes to discard, AND another card is revealed.
                        // Animation: Drawn card -> Discard.
                        sourceId = 'drawn-card-slot';
                        targetId = 'discard-pile';
                        cardToAnimate = { value: cardValue, isRevealed: true };
                    } else if (type === 'undo_draw_discard') {
                        // Undo: Drawn card (Center) -> Discard Pile
                        sourceId = 'drawn-card-slot';
                        targetId = 'discard-pile';
                        // For undo, we don't have 'cardValue' in payload usually, 
                        // but we know what the card WAS because it's in the CURRENT gameState.drawnCard
                        // before we apply the update.
                        const currentDrawn = get().gameState?.drawnCard;
                        cardToAnimate = currentDrawn ? { ...currentDrawn, isRevealed: true } : { value: '?', isRevealed: true };
                    }

                    if (sourceId && targetId) {
                        set({
                            pendingAnimation: {
                                sourceId,
                                targetId,
                                card: cardToAnimate,
                                onComplete: () => {
                                    set({ gameState, lastAction: lastAction || null });
                                }
                            }
                        });
                        return; // Stop here, wait for animation
                    }
                }

                // Default: just update if no animation
                set({
                    gameState,
                    activeState: gameState,
                    lastAction: lastAction || null
                });
            });

            socket.on('game_over', ({ totalScores, winner }) => {
                console.log('[Socket] Game over, winner:', winner);
                set({
                    totalScores,
                    gameWinner: winner,
                    isGameOver: true
                });
            });

            // Handle player leaving
            socket.on('player_left', ({ playerId, playerName, playerEmoji, newHost }) => {
                const { players } = get();
                const updatedPlayers = players.filter(p => p.id !== playerId);

                set({
                    players: updatedPlayers,
                    lastNotification: {
                        type: 'info',
                        message: `${playerName} a quitté la partie`,
                        timestamp: Date.now()
                    }
                });

                // If we became host
                const { socketId } = get();
                const me = updatedPlayers.find(p => p.id === socketId);
                if (me && newHost === me.name) {
                    set({ isHost: true });
                }
            });

            socket.on('game_cancelled', ({ reason }) => {
                console.log('[Socket] Game cancelled:', reason);

                // Set error to trigger HostLeftOverlay (if host left)
                // We DO NOT clear roomCode/onlineStarted yet to allow the Overlay to show
                set({
                    gameStarted: false,
                    gameState: null,
                    // roomCode: null, // REMOVED: Keep roomCode for overlay
                    // players: [],    // REMOVED: Keep players for context
                    isHost: false,
                    error: reason,     // Trigger Overlay
                    lastNotification: {
                        type: 'error',
                        message: reason,
                        timestamp: Date.now()
                    },
                    // onlineStarted: false, // REMOVED: Keep True so VirtualGame stays mounted
                    activeState: null
                });

                // Start countdown to cleanup
                if (reason.includes('hôte') || reason.includes('Pas assez de joueurs')) {
                    get().startRedirection(reason);
                } else {
                    // Immediate cleanup for other reasons
                    get().disconnect();
                }
            });

            // Handle player ready for next round
            socket.on('player_ready_next_round', ({ playerId, playerName, playerEmoji, readyCount, totalPlayers }) => {
                console.log(`[Socket] ${playerName} is ready (${readyCount}/${totalPlayers})`);
                const { socketId } = get();

                // Update ready status
                set({
                    readyStatus: { readyCount, totalPlayers }
                });

                // Only notify if someone else clicked ready
                const isMe = playerId === socketId;
                if (!isMe) {
                    // Convert avatarId to real emoji
                    const avatar = AVATARS.find(a => a.id === playerEmoji);
                    const displayEmoji = avatar?.emoji || '👤';

                    set({
                        lastNotification: {
                            type: 'info',
                            message: `${displayEmoji} ${playerName} veut continuer (${readyCount}/${totalPlayers})`,
                            timestamp: Date.now()
                        }
                    });
                }
            });

            // Handle timeout expired (host can now force start)
            socket.on('timeout_expired', ({ message }) => {
                console.log(`[Socket] Timeout expired: ${message}`);
                const { isHost } = get();
                set({
                    timeoutExpired: true,
                    lastNotification: isHost ? {
                        type: 'info',
                        message: 'Délai expiré - Vous pouvez lancer la manche suivante',
                        timestamp: Date.now()
                    } : {
                        type: 'info',
                        message: 'Délai expiré - En attente de l\'hôte',
                        timestamp: Date.now()
                    }
                });
            });

            socket.on('breakout_init', (data) => {
                const { playerId, playerBricks, opponentBricks } = data;
                console.log("📥 [STORE] Received breakout_init from:", playerId);
                if (playerId !== socket.id) {
                    set(state => ({
                        breakoutState: {
                            ...state.breakoutState,
                            // Map Host BOTTOM to Guest TOP (opponentBricks)
                            // Map Host TOP to Guest BOTTOM (playerBricks)
                            playerBricks: opponentBricks,
                            opponentBricks: playerBricks
                        }
                    }));
                }
            });

            socket.on('breakout_sync', (data) => {
                // Flatten data handling
                const { playerId, paddleX, balls, playerBricks, opponentBricks, score, opponentScore, lives, gameState, isGameOver, winner } = data;

                if (playerId !== socket.id) {
                    const state = get().breakoutState;

                    // Helper to merge bricks without losing X/Y if they exist in state
                    const mergeBricks = (currentBricks, newBricks) => {
                        if (!newBricks) return currentBricks;
                        if (!currentBricks) return newBricks;

                        return newBricks.map((col, c) => {
                            // If dimensions don't match, fallback to new
                            if (!col) return col;
                            return col.map((brick, r) => {
                                const currentBrick = currentBricks[c]?.[r];
                                // If we have existing full data (with x,y), preserve it and only update status/hits
                                if (currentBrick && currentBrick.x !== undefined) {
                                    return {
                                        ...currentBrick,
                                        ...brick,
                                        // Ensure x/y are definitely preserved even if newBrick has them as undefined (shouldn't happen but safety)
                                        x: currentBrick.x,
                                        y: currentBrick.y,
                                        id: currentBrick.id,
                                        type: currentBrick.type || brick.type
                                    };
                                }
                                return brick;
                            });
                        });
                    };

                    set({
                        breakoutState: {
                            ...state,
                            opponentPaddleX: paddleX,
                            balls: balls ?? state.balls,
                            // Map Host OPPONENT bricks to Guest PLAYER bricks
                            playerBricks: mergeBricks(state.playerBricks, opponentBricks),
                            // Map Host PLAYER bricks to Guest OPPONENT bricks
                            opponentBricks: mergeBricks(state.opponentBricks, playerBricks),

                            opponentScore: score ?? state.opponentScore,
                            score: opponentScore ?? state.score,
                            lives: lives ?? state.lives,
                            gameState: gameState ?? state.gameState,
                            isGameOver: isGameOver ?? state.isGameOver,
                            winner: winner ?? state.winner
                        }
                    });
                }
            });

            socket.on('request_breakout_init', () => {
                const { roomCode, breakoutState } = get();
                // Host (or anyone with the full state) replies
                if (breakoutState.playerBricks && breakoutState.playerBricks[0] && breakoutState.playerBricks[0][0].x !== undefined) {
                    console.log('📡 [STORE] Received init request. Resending cached layout...');
                    socket.emit('breakout_init', {
                        roomCode,
                        playerBricks: breakoutState.playerBricks, // Host sends their Bottom
                        opponentBricks: breakoutState.opponentBricks // Host sends their Top
                    });
                }
            });
        }

        // Connect if not already connected
        if (!socket.connected) {
            socket.connect();
        }
    },

    // Get socket ID (for comparing with player IDs)
    getSocketId: () => socket?.id,

    disconnect: () => {
        // socket.disconnect(); // KEEP CONNECTION ALIVE!
        // We only reset the game state locally.
        // If we need to leave a room explicitly, we should emit 'leave_room'
        if (get().roomCode) {
            socket.emit('leave_room', get().roomCode);
        }

        set({
            isConnected: true, // Remain "Connected" to the server (presence), just not in a game
            roomCode: null,
            gameState: null,
            activeState: null,
            gameStarted: false,
            onlineStarted: false,
            isGameOver: false,
            gameWinner: null,
            players: [],
            roundNumber: 1
        });
    },

    leaveRoom: () => {
        const { socket, roomCode } = get();
        if (socket && roomCode) {
            console.log('🚀 [STORE] Leaving room:', roomCode);
            socket.emit('leave_room', { roomCode });
            set({
                roomCode: null,
                players: [],
                isHost: false,
                gameStarted: false,
                onlineStarted: false,
                error: null,
                breakoutState: {
                    playerBricks: null,
                    opponentBricks: null,
                    balls: [],
                    score: 0,
                    opponentScore: 0,
                    lives: 3,
                    gameState: 'MENU',
                    opponentPaddleX: 0.5
                }
            });
        }
    },

    setPlayerInfo: (name, emoji) => {
        set({ playerName: name, playerEmoji: emoji });
    },

    setLastNotification: (notif) => {
        set({ lastNotification: notif });
    },

    createRoom: (isPublic = true, autoInviteFriendId = null) => {
        const { playerName, playerEmoji } = get();
        if (!playerName) {
            set({ error: "Entrez un pseudo !" });
            return;
        }

        // CRITICAL: Ensure listeners are set up before emitting
        get().connect();

        const dbId = useGameStore.getState().userProfile.id;
        const payload = { playerName, emoji: playerEmoji, dbId, isPublic, autoInviteFriendId };

        if (!socket.connected) {
            socket.connect();
            socket.once('connect', () => {
                socket.emit('create_room', payload);
                set({ onlineStarted: true }); // We are now in a room session
            });
        } else {
            socket.emit('create_room', payload);
            set({ onlineStarted: true });
        }
    },

    createRoomAndInvite: (friendId) => {
        const { userProfile } = useGameStore.getState();
        set({
            playerName: userProfile.name,
            playerEmoji: userProfile.avatarId
        });

        get().createRoom(false, friendId); // Create as PRIVATE with ATOMIC AUTO-INVITE
    },

    joinRoom: (code) => {
        const { playerName, playerEmoji } = get();
        if (!playerName) {
            set({ error: "Entrez un pseudo !" });
            return;
        }
        if (!code) {
            set({ error: "Entrez un code de salle !" });
            return;
        }

        // CRITICAL: Ensure listeners are set up before emitting
        get().connect();

        const dbId = useGameStore.getState().userProfile.id;

        if (!socket.connected) {
            socket.connect();
            socket.once('connect', () => {
                socket.emit('join_room', { roomCode: code, playerName, emoji: playerEmoji, dbId });
                set({ onlineStarted: true });
            });
        } else {
            socket.emit('join_room', { roomCode: code, playerName, emoji: playerEmoji, dbId });
            set({ onlineStarted: true });
        }
        set({ roomCode: code });
    },


    startGame: () => {
        const { roomCode } = get();
        if (roomCode) socket.emit('start_game', roomCode);
    },

    startNextRound: () => {
        const { roomCode } = get();
        if (roomCode) socket.emit('next_round', roomCode);
    },

    rematch: () => {
        const { roomCode } = get();
        if (roomCode) socket.emit('rematch', roomCode);
    },

    forceNextRound: () => {
        const { roomCode } = get();
        if (roomCode) socket.emit('force_next_round', roomCode);
    },

    // In-Game Actions
    emitGameAction: (action, payload = {}) => {
        const { roomCode } = get();
        if (roomCode) {
            socket.emit('game_action', { roomCode, action, payload });
            set({ selectedCardIndex: null });
        }
    },

    undoTakeFromDiscard: () => {
        const { roomCode } = get();
        if (roomCode) {
            socket.emit('game_action', { roomCode, action: 'undo_draw_discard' });
        }
    },

    // UI Helpers
    selectCard: (index) => set({ selectedCardIndex: index }),
    clearError: () => set({ error: null }),

    // Breakout Actions
    initOnlineBreakout: (playerBricks, opponentBricks) => {
        const { socket, roomCode } = get();
        if (socket && roomCode) {
            console.log('📡 [STORE] Initializing Online Breakout Layout for room:', roomCode);
            // Cache full layout locally so we can resend it if requested
            set(state => ({
                breakoutState: {
                    ...state.breakoutState,
                    playerBricks,
                    opponentBricks
                }
            }));
            socket.emit('breakout_init', { roomCode, playerBricks, opponentBricks });
        }
    },

    requestBreakoutInit: () => {
        const { socket, roomCode } = get();
        if (socket && roomCode) {
            console.log('📡 [STORE] Sending request_breakout_init...');
            socket.emit('request_breakout_init', { roomCode });
        }
    },

    syncBreakoutState: (state) => {
        const { socket, roomCode } = get();
        if (socket && roomCode) {
            // Flatten state into the main object to match listener expectations
            socket.emit('breakout_sync', { roomCode, ...state });
            // Update local state
            set(prevState => ({
                breakoutState: {
                    ...prevState.breakoutState,
                    ...state
                }
            }));
        }
    },

    startRedirection: (reason) => {
        set({ redirectionState: { active: true, timer: 5, reason } });
        const interval = setInterval(() => {
            const currentTimer = get().redirectionState.timer;
            if (currentTimer <= 1) {
                clearInterval(interval);
                get().disconnect();
                set({ redirectionState: { active: false, timer: 5, reason: '' } });
            } else {
                set({ redirectionState: { ...get().redirectionState, timer: currentTimer - 1 } });
            }
        }, 1000);
    },
}));
