import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, ShieldAlert, RotateCcw, Monitor, Wifi, Globe, Smartphone, Crown, X, Palette, Sparkles, Cpu, Users, Layers, ArrowLeftRight, CreditCard as IDCard, Pause, Play, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import ConfirmModal from './ui/ConfirmModal';
import { useFeedback } from '../hooks/useFeedback';
import { useGameStore } from '../store/gameStore';
import { useReactiveAudio } from '../hooks/useReactiveAudio';
import { useOnlineGameStore } from '../store/onlineGameStore';

import { THEMES } from '../data/themes';

// Constants
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 16;
const BALL_RADIUS = 8;
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 8;
const BRICK_PADDING = 8;
const SPEED_PROFILES = {
    'NOVICE': { initial: 3, max: 6, acceleration: 1.005, label: 'Novice', color: 'text-cyan-400', paddleWidth: 160 },
    'EXPERT': { initial: 6, max: 10, acceleration: 1.03, label: 'Expert', color: 'text-purple-400', paddleWidth: 100 },
    'OVERCLOCK': { initial: 8, max: 15, acceleration: 1.05, label: 'Turbo', color: 'text-red-500', paddleWidth: 80 }
};

const BONUS_CHANCE = 0.15;

export default function VersusBreakout({
    onBackToMenu,
    onStartOnline,
    onPlayingStateChange,
    aiDifficulty = 'NORMAL',
    isOnline = false,
    autoStart = false
}) {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const soundEnabled = useGameStore(state => state.soundEnabled);
    const { currentTheme, setTheme } = useGameStore();
    const theme = THEMES[currentTheme] || THEMES['CYBERPUNK'];

    // Online Store
    const isHost = useOnlineGameStore(state => state.isHost);
    const syncBreakoutState = useOnlineGameStore(state => state.syncBreakoutState);
    const initOnlineBreakout = useOnlineGameStore(state => state.initOnlineBreakout);
    const onlineBreakoutState = useOnlineGameStore(state => state.breakoutState);
    const socketId = useOnlineGameStore(state => state.socketId);
    const players = useOnlineGameStore(state => state.players);
    const setLastNotification = useOnlineGameStore(state => state.setLastNotification);
    const requestBreakoutInit = useOnlineGameStore(state => state.requestBreakoutInit);

    // Game State
    const [scorePlayer, setScorePlayer] = useState(0);
    const [scoreAI, setScoreAI] = useState(0);
    const [gameState, setGameState] = useState((isOnline || autoStart) ? 'PLAYING' : 'MENU'); // MENU, PLAYING, GAME_OVER, VICTORY
    const [gameMode, setGameMode] = useState(isOnline ? 'ONLINE' : 'AI'); // BRICKS, AI, ONLINE
    const [selectedDifficulty, setSelectedDifficulty] = useState('EXPERT');
    const [lives, setLives] = useState(3);
    const [winner, setWinner] = useState(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [isBossMode, setIsBossMode] = useState(false);
    const [bossHp, setBossHp] = useState(100);
    const [showUnlockNotification, setShowUnlockNotification] = useState(null); // { themeId, themeName }
    const [initialStateReceived, setInitialStateReceived] = useState(!isOnline || isHost);

    // Ref to track state for async timeouts (prevents closure staleness)
    const isStateReceivedRef = useRef(initialStateReceived);
    useEffect(() => {
        isStateReceivedRef.current = initialStateReceived;
    }, [initialStateReceived]);

    // Bonus State
    const [playerBonus, setPlayerBonus] = useState(null); // { type: 'SUPER_BALL' | 'WIDE_PADDLE' | 'MULTI_BALL' }
    const [aiBonusAvailable, setAiBonusAvailable] = useState(null); // Changed to object for specific type
    const [playerPaddleWidth, setPlayerPaddleWidth] = useState(PADDLE_WIDTH);
    const [aiPaddleWidth, setAiPaddleWidth] = useState(PADDLE_WIDTH);
    const [shieldActive, setShieldActive] = useState(false);
    const [laserActive, setLaserActive] = useState(false);

    const bonusLockRef = useRef(false);
    const aiFrozenUntilRef = useRef(0); // Timestamp when AI unfreezes
    const gameStartTimeRef = useRef(0); // To track duration for pity bonus
    const pityBonusGivenRef = useRef(false);

    const { playClick, playVictory, playStart, playError, playCardFlip, playCardPlace, playCardDraw, playHover, playPause } = useFeedback();
    const { play: playMusic, stop: stopMusic, getBass } = useReactiveAudio('/Music/stranger-things-124008.mp3', soundEnabled);

    useEffect(() => {
        if (onPlayingStateChange) {
            onPlayingStateChange(gameState === 'PLAYING');
        }

        // Only start music if playing AND (if online) initial state is received
        const shouldPlayMusic = gameState === 'PLAYING' && (!isOnline || initialStateReceived);

        if (shouldPlayMusic) {
            playMusic();
        } else {
            stopMusic();
        }
    }, [gameState, initialStateReceived, isOnline, onPlayingStateChange, playMusic, stopMusic]);


    // Game Objects Refs
    const ballsRef = useRef([{ x: 0, y: 0, dx: 0, dy: 0, speed: SPEED_PROFILES.EXPERT.initial, isSuperCharged: false, isAttached: true }]);
    const playerPaddleRef = useRef({ x: 0 });
    const aiPaddleRef = useRef({ x: 0 });
    const playerBricksRef = useRef([]);
    const aiBricksRef = useRef([]);
    const canvasSizeRef = useRef({ width: 0, height: 0 });
    const particlesRef = useRef([]);
    const shakeRef = useRef(0);
    const bonusTimerRef = useRef(null);
    const frameCountRef = useRef(0);

    // AI State
    const aiTargetXRef = useRef(0);

    // Visual Effects State
    // particlesRef already declared above
    const shockwavesRef = useRef([]);
    const timeScaleRef = useRef(1.0);
    const projectilesRef = useRef([]);
    const laserTimerRef = useRef(null);
    const bossRef = useRef({ x: 0, y: 50, width: 200, height: 60, dx: 2, lastAttack: 0 });

    // Shockwave Utility
    const createShockwave = (x, y, color) => {
        if (shockwavesRef.current.length > 20) return; // Limit
        shockwavesRef.current.push({
            x, y,
            radius: 10,
            maxRadius: 100,
            alpha: 1,
            color
        });
    };

    // Particles Utility - Next Gen Physics
    const createParticles = (x, y, color) => {
        // burst count
        const count = 6;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            particlesRef.current.push({
                x,
                y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                gravity: 0.15,
                friction: 0.96,
                size: Math.random() * 3 + 2,
                life: 1.0,
                decay: Math.random() * 0.03 + 0.01,
                color
            });
        }
    };

    // Initialize Game
    const createBricks = useCallback((isTop) => {
        const canvas = canvasRef.current;
        if (!canvas) return [];
        if (isBossMode) return [];
        if (gameMode === 'BRICKS' && !isTop) return [];

        const width = canvas.width;
        const height = canvas.height;
        const brickWidth = (width - ((BRICK_COLUMN_COUNT + 1) * BRICK_PADDING)) / BRICK_COLUMN_COUNT;

        const bricks = [];
        const brickTotalHeight = BRICK_ROW_COUNT * (20 + BRICK_PADDING);

        // Layout Logic:
        // Solo (BRICKS): Bricks at Top (80), Paddle at Bottom (H-100)
        // Versus (AI/ONLINE): Bricks at Edges, Paddles "Inside" (guarding bricks)
        let startY;
        if (gameMode === 'BRICKS') {
            startY = 80;
        } else {
            // Versus Mode
            if (isTop) {
                startY = 20; // AI Bricks at Top (Margin)
            } else {
                startY = height - 20 - brickTotalHeight; // Player Bricks at Bottom (Margin)
            }
        }

        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            bricks[c] = [];
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const isBonus = Math.random() < BONUS_CHANCE;
                let bonusType = isBonus ? (['SUPER_BALL', 'WIDE_PADDLE', 'MULTI_BALL', 'BULLET_TIME', 'SHIELD', 'LASER'][Math.floor(Math.random() * 6)]) : null;
                const isReinforced = isTop ? (r >= BRICK_ROW_COUNT - 2) : (r <= 1);
                const hits = isTop ? (r === BRICK_ROW_COUNT - 1 ? 3 : (r === BRICK_ROW_COUNT - 2 ? 2 : 1))
                    : (r === 0 ? 3 : (r === 1 ? 2 : 1));

                let specialType = null;
                if (!isBonus && !isReinforced && Math.random() < 0.05) specialType = 'EXPLOSIVE';
                if (!isBonus && !isReinforced && !specialType && Math.random() < 0.02) specialType = 'GOLDEN';

                if (specialType === 'GOLDEN') {
                    bonusType = 'SUPER_BALL';
                }

                bricks[c][r] = {
                    id: `brick-${isTop ? 'top' : 'bottom'}-${c}-${r}`,
                    x: (c * (brickWidth + BRICK_PADDING)) + BRICK_PADDING,
                    y: startY + (r * (20 + BRICK_PADDING)),
                    status: 1,
                    hitsRemaining: specialType === 'GOLDEN' ? 3 : hits,
                    maxHits: specialType === 'GOLDEN' ? 3 : hits,
                    isReinforced: hits > 1,
                    isBonus: isBonus || specialType === 'GOLDEN',
                    bonusType,
                    specialType
                };
            }
        }
        return bricks;
    }, [isBossMode, gameMode]);

    const initGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.width;
        const height = canvas.height;
        const brickWidth = (width - ((BRICK_COLUMN_COUNT + 1) * BRICK_PADDING)) / BRICK_COLUMN_COUNT;

        const initialPaddleWidth = SPEED_PROFILES[selectedDifficulty].paddleWidth || PADDLE_WIDTH;
        playerPaddleRef.current = { x: (width - initialPaddleWidth) / 2 };
        aiPaddleRef.current = { x: (width - initialPaddleWidth) / 2 };
        setPlayerPaddleWidth(initialPaddleWidth);
        setAiPaddleWidth(initialPaddleWidth);

        const profile = SPEED_PROFILES[selectedDifficulty];
        ballsRef.current = [{
            x: width / 2,
            y: height / 2,
            dx: 0,
            dy: 0,
            speed: profile.initial,
            isSuperCharged: false,
            isAttached: true
        }];
        if (gameMode !== 'BRICKS') {
            launchBall();
        }

        // Reset specificrefs
        aiFrozenUntilRef.current = 0;
        gameStartTimeRef.current = Date.now();
        pityBonusGivenRef.current = false;


        if (!isOnline || isHost) {
            aiBricksRef.current = createBricks(true);
            playerBricksRef.current = createBricks(false);

            // Host emits initial setup
            if (isOnline && isHost) {
                console.log("📡 [BREAKOUT] Host emitting initial brick layout...");
                initOnlineBreakout(playerBricksRef.current, aiBricksRef.current);

                // Force immediate state sync to ensure guest receives layout
                setTimeout(() => {
                    syncBreakoutState({
                        paddleX: playerPaddleRef.current.x / (width - playerPaddleWidth),
                        balls: ballsRef.current.map(b => ({ x: b.x / width, y: b.y / height, dx: b.dx / width, dy: b.dy / height })),
                        playerBricks: playerBricksRef.current.map(col => col.map(b => ({ status: b.status, hits: b.hitsRemaining }))),
                        opponentBricks: aiBricksRef.current.map(col => col.map(b => ({ status: b.status, hits: b.hitsRemaining }))),
                        score: 0,
                        opponentScore: 0,
                        lives: 3,
                        gameState: 'PLAYING'
                    });
                }, 100);
            }
        } else {
            // Guest waits for breakout_init via store sync
            console.log("⏳ [BREAKOUT] Guest waiting for initial layout from Host...");
        }
        canvasSizeRef.current = { width, height, brickWidth };
        particlesRef.current = [];
        shockwavesRef.current = [];

        setScorePlayer(0);
        setScoreAI(0);
        setPlayerBonus(null);
        setAiBonusAvailable(null);
        // setPlayerPaddleWidth and setAiPaddleWidth now handled at start of initGame
        if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
        if (laserTimerRef.current) clearInterval(laserTimerRef.current);
        setWinner(null);
        setShieldActive(false);
        setLaserActive(false);
        setIsZenMode(false);
        setIsBossMode(false);
        setBossHp(100);
        projectilesRef.current = [];

    }, [selectedDifficulty, gameMode, isBossMode, createBricks, isOnline, isHost, initOnlineBreakout, playerPaddleWidth, syncBreakoutState]);

    // Auto-init for Online/AutoStart
    const hasInitedRef = useRef(false);
    useEffect(() => {
        if ((isOnline || autoStart) && gameState === 'PLAYING' && !hasInitedRef.current) {
            console.log("🚀 [BREAKOUT] Auto-starting game session...");
            // Small delay to ensure canvas is ready
            const timer = setTimeout(() => {
                initGame();
                hasInitedRef.current = true;
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOnline, autoStart, gameState, initGame]);

    // Guest: Watch for initial bricks from store
    useEffect(() => {
        if (isOnline && !isHost && !initialStateReceived && onlineBreakoutState.playerBricks && onlineBreakoutState.opponentBricks) {
            // Check if it's a "full" brick (has 'x' property) to avoid premature lock release by simplified sync
            const firstCol = onlineBreakoutState.playerBricks[0];
            const firstBrick = firstCol ? firstCol[0] : null;

            if (firstBrick && firstBrick.x !== undefined) {
                console.log("🎯 [BREAKOUT] Guest received FULL initial state! Populating...");

                // Mapping: Store already did the swap, just apply.
                playerBricksRef.current = onlineBreakoutState.playerBricks;
                aiBricksRef.current = onlineBreakoutState.opponentBricks;

                setInitialStateReceived(true);
            } else {
                console.log("⏳ [BREAKOUT] Guest received data but it's not the full layout yet... waiting.");
            }
        }
    }, [isOnline, isHost, initialStateReceived, onlineBreakoutState.playerBricks, onlineBreakoutState.opponentBricks]);

    // Safety Timeout for Guest - Plan Part 5
    // Safety Timeout & Polling for Guest
    useEffect(() => {
        let pollTimer;
        let fallbackTimer;

        if (isOnline && !isHost && !initialStateReceived && gameState === 'PLAYING') {
            console.log("⏳ [GUEST] Waiting for init... Starting polling request.");

            // Poll every 1s
            const doRequest = () => {
                console.log("📡 [GUEST] Requesting Initial Layout...");
                requestBreakoutInit();
            };

            doRequest();
            pollTimer = setInterval(doRequest, 1000);

            // Hard fallback after 15s
            fallbackTimer = setTimeout(() => {
                // Check Ref to ensure we have the LATEST state (closure safe)
                // Using initialStateReceived directly as a ref is not provided in the original code.
                // Assuming initialStateReceived state is the source of truth.
                if (!initialStateReceived) {
                    console.error("❌ [GUEST] Timeout: No initial state received after 15s. Generating fallback layout...");
                    clearInterval(pollTimer);

                    // Fallback: Generate bricks locally
                    aiBricksRef.current = createBricks(true);
                    playerBricksRef.current = createBricks(false);
                    setLastNotification({
                        type: 'error',
                        message: 'Synchronisation différée : terrain généré en mode secours.',
                        timestamp: Date.now()
                    });
                    setInitialStateReceived(true);
                } else {
                    console.log("✅ [GUEST] State already received, timeout cancelled.");
                    clearInterval(pollTimer);
                }
            }, 15000);

            return () => {
                clearInterval(pollTimer);
                clearTimeout(fallbackTimer);
            };
        }
    }, [isOnline, isHost, initialStateReceived, gameState, createBricks, requestBreakoutInit, setLastNotification]);

    const launchBall = useCallback(() => {
        ballsRef.current.forEach(ball => {
            if (ball.isAttached) {
                const profile = SPEED_PROFILES[selectedDifficulty];
                const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8);
                ball.dx = profile.initial * Math.sin(angle);
                ball.dy = -profile.initial * Math.cos(angle);
                ball.speed = profile.initial;
                ball.isAttached = false;
                ball.isSuperCharged = false;
            }
        });
    }, [selectedDifficulty]);

    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            const container = canvas?.parentElement;
            if (canvas && container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                canvasSizeRef.current = {
                    width: canvas.width,
                    height: canvas.height,
                    brickWidth: (canvas.width - ((BRICK_COLUMN_COUNT + 1) * BRICK_PADDING)) / BRICK_COLUMN_COUNT
                };
                if (gameState === 'MENU') {
                    initGame();
                }
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [gameState, initGame]);

    useEffect(() => {
        const handleMove = (clientX) => {
            if (gameState !== 'PLAYING') return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const relativeX = clientX - rect.left;
            if (relativeX > 0 && relativeX < canvas.width) {
                playerPaddleRef.current.x = relativeX - playerPaddleWidth / 2;
                if (playerPaddleRef.current.x < 0) playerPaddleRef.current.x = 0;
                if (playerPaddleRef.current.x + playerPaddleWidth > canvas.width) playerPaddleRef.current.x = canvas.width - playerPaddleWidth;
            }
        };
        const onMouseMove = (e) => handleMove(e.clientX);
        const onTouchMove = (e) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        };
        const onTouchStart = (e) => {
            if (e.touches.length > 1) e.preventDefault(); // Prevent zoom
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchstart', onTouchStart, { passive: false });

        const onCanvasClick = () => {
            if (gameState === 'PLAYING') {
                if (laserActive) {
                    fireLaser();
                } else {
                    launchBall();
                }
            }
        };
        const canvas = canvasRef.current;
        if (canvas) canvas.addEventListener('pointerdown', onCanvasClick);

        // Prevent pull-to-refresh
        const originalOverscroll = document.body.style.overscrollBehavior;
        document.body.style.overscrollBehavior = 'none';

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchstart', onTouchStart);
            if (canvas) canvas.removeEventListener('pointerdown', onCanvasClick);
            document.body.style.overscrollBehavior = originalOverscroll;
        };
    }, [gameState, playerPaddleWidth, launchBall, laserActive]);

    const fireLaser = useCallback(() => {
        if (!laserActive) return;

        const paddleX = playerPaddleRef.current.x;
        const width = canvasSizeRef.current.width;

        // Add 2 projectiles
        projectilesRef.current.push(
            { x: paddleX + 10, y: canvasSizeRef.current.height - 40, width: 4, height: 12, dy: -8, color: '#f00' },
            { x: paddleX + playerPaddleWidth - 14, y: canvasSizeRef.current.height - 40, width: 4, height: 12, dy: -8, color: '#f00' }
        );
        playCardDraw(); // Pew pew sound

        // Visual recoil
        shakeRef.current += 2;
    }, [laserActive, playerPaddleWidth, playCardDraw]);

    const explodeBrick = (col, row, isAi) => {
        const bricks = isAi ? aiBricksRef.current : playerBricksRef.current;
        if (!bricks[col] || !bricks[col][row]) return;

        // Loop 3x3 area
        for (let c = col - 1; c <= col + 1; c++) {
            for (let r = row - 1; r <= row + 1; r++) {
                if (bricks[c] && bricks[c][r] && bricks[c][r].status === 1) {
                    const b = bricks[c][r];
                    b.status = 0;
                    b.hitsRemaining = 0;
                    createParticles(b.x + canvasSizeRef.current.brickWidth / 2, b.y + 10, '#ef4444');
                    createShockwave(b.x + canvasSizeRef.current.brickWidth / 2, b.y + 10, '#ef4444');
                    // Recursion for chain reaction (optional, limiting depth implicit by only targeting status 1)
                    if (b.specialType === 'EXPLOSIVE') {
                        explodeBrick(c, r, isAi);
                    }
                }
            }
        }
        playError(); // Explosion sound (using Error sound for now as it's hefty)
        shakeRef.current = 20;
    };

    const updateAI = useCallback(() => {
        if (gameMode !== 'AI' || isOnline) return; // Only AI in AI mode

        // Frozen Logic
        if (Date.now() < aiFrozenUntilRef.current) return;

        const ball = ballsRef.current[0]; // AI largely targets first ball
        if (!ball) return;
        const aiPaddle = aiPaddleRef.current;
        const width = canvasSizeRef.current.width;
        let targetX = ball.x - PADDLE_WIDTH / 2;

        // AI Reaction Speeds based on SELECTED DIFFICULTY
        let reactionSpeed = 0.08;
        if (selectedDifficulty === 'NOVICE') {
            reactionSpeed = 0.022; // Even slower (was 0.035)

            // Vision Limit for Novice: Only react if ball is in top 60% of screen or moving UP towards AI
            const height = canvasSizeRef.current.height;
            if (ball.y > height * 0.6 && ball.dy > 0) {
                // Ball is deep in player territory and moving away -> AI slows down / stops
                reactionSpeed = 0.005;
                targetX = width / 2 - PADDLE_WIDTH / 2; // Lazily drift to center
            }
        }
        if (selectedDifficulty === 'EXPERT') reactionSpeed = 0.09;
        if (selectedDifficulty === 'OVERCLOCK') reactionSpeed = 0.15;

        // Error Margin for Novice (Simulate human error)
        if (selectedDifficulty === 'NOVICE' && Math.random() < 0.03) {
            targetX += (Math.random() - 0.5) * 120; // Increased jitter (was 60)
        }

        const dx = targetX - aiPaddle.x;
        aiPaddle.x += dx * reactionSpeed;
        if (aiPaddle.x < 0) aiPaddle.x = 0;
        if (aiPaddle.x + PADDLE_WIDTH > width) aiPaddle.x = width - PADDLE_WIDTH;

        // AI Bonus Usage Logic
        if (aiBonusAvailable && Math.random() < 0.005) { // 0.5% chance per frame to use bonus
            activateAiBonus();
        }
    }, [selectedDifficulty, gameMode, aiBonusAvailable]);

    // Pity Timer Check
    useEffect(() => {
        if (gameState !== 'PLAYING' || gameMode !== 'AI' || selectedDifficulty !== 'NOVICE') return;

        const timer = setInterval(() => {
            if (!pityBonusGivenRef.current && Date.now() - gameStartTimeRef.current > 60000) {
                // Grant Pity Bonus (Laser)
                pityBonusGivenRef.current = true;
                setPlayerBonus({ type: 'LASER' });
                setLastNotification({
                    type: 'success',
                    message: 'Renfort : Missiles auto-guidés activés !',
                    timestamp: Date.now()
                });
                playVictory();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, gameMode, selectedDifficulty, setLastNotification, playVictory]);

    const update = useCallback(() => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Ensure state captures current dimensions
        const { width, height } = canvasSizeRef.current;

        // DYNAMIC LAYOUT CALCULATIONS (Responsive)
        // Recalculate brick positions based on current height to prevent desync
        const verticalMargin = 30;
        const brickTotalHeight = BRICK_ROW_COUNT * (20 + BRICK_PADDING);
        const paddleGap = 15;
        const brickWidth = (width - ((BRICK_COLUMN_COUNT + 1) * BRICK_PADDING)) / BRICK_COLUMN_COUNT;

        // Update AI Bricks (Top)
        if (aiBricksRef.current) {
            aiBricksRef.current.forEach((col, c) => {
                col.forEach((b, r) => {
                    b.x = (c * (brickWidth + BRICK_PADDING)) + BRICK_PADDING;
                    b.y = verticalMargin + (r * (20 + BRICK_PADDING));
                });
            });
        }

        // Update Player Bricks (Bottom)
        if (playerBricksRef.current) {
            const startY = height - verticalMargin - brickTotalHeight;
            playerBricksRef.current.forEach((col, c) => {
                col.forEach((b, r) => {
                    b.x = (c * (brickWidth + BRICK_PADDING)) + BRICK_PADDING;
                    b.y = startY + (r * (20 + BRICK_PADDING));
                });
            });
        }

        // --- ONLINE SYNC ---
        if (isOnline) {
            if (isHost) {
                // ... existing host sync logic
                if (onlineBreakoutState.opponentPaddleX !== undefined) {
                    aiPaddleRef.current.x = (1 - onlineBreakoutState.opponentPaddleX) * (width - aiPaddleWidth);
                }

                frameCountRef.current++;
                if (frameCountRef.current % 3 === 0) {
                    syncBreakoutState({
                        paddleX: playerPaddleRef.current.x / (width - playerPaddleWidth),
                        balls: ballsRef.current.map(b => ({ x: b.x / width, y: b.y / height, dx: b.dx / width, dy: b.dy / height })),
                        playerBricks: playerBricksRef.current.map(col => col.map(b => ({ status: b.status, hits: b.hitsRemaining }))),
                        opponentBricks: aiBricksRef.current.map(col => col.map(b => ({ status: b.status, hits: b.hitsRemaining }))),
                        score: scorePlayer,
                        opponentScore: scoreAI,
                        lives: lives,
                        gameState: gameState,
                        winner: winner,
                        isGameOver: gameState === 'GAME_OVER' || gameState === 'VICTORY'
                    });
                }
            } else {
                // ... existing guest sync logic
                syncBreakoutState({
                    paddleX: playerPaddleRef.current.x / (width - playerPaddleWidth)
                });

                if (onlineBreakoutState.balls && onlineBreakoutState.balls.length > 0) {
                    ballsRef.current = onlineBreakoutState.balls.map(b => ({
                        x: b.x * width,
                        y: b.y * height,
                        dx: b.dx * width,
                        dy: b.dy * height,
                        speed: Math.sqrt(b.dx * b.dx + b.dy * b.dy) * width || 5,
                        isAttached: false
                    }));
                }

                // FIX: Sync Host paddle position for Guest
                if (onlineBreakoutState.opponentPaddleX !== undefined) {
                    aiPaddleRef.current.x = (1 - onlineBreakoutState.opponentPaddleX) * (width - aiPaddleWidth);
                }

                if (onlineBreakoutState.playerBricks) {
                    playerBricksRef.current.forEach((col, c) => {
                        col.forEach((b, r) => {
                            // Guest bottom = Host TOP (which is Guest's playerBricks from store thanks to swap)
                            if (onlineBreakoutState.playerBricks?.[c]?.[r]) {
                                b.status = onlineBreakoutState.playerBricks[c][r].status;
                                b.hitsRemaining = onlineBreakoutState.playerBricks[c][r].hits;
                            }
                        });
                    });
                    aiBricksRef.current.forEach((col, c) => {
                        col.forEach((b, r) => {
                            // Guest TOP = Host BOTTOM (which is Guest's opponentBricks from store thanks to swap)
                            if (onlineBreakoutState.opponentBricks?.[c]?.[r]) {
                                b.status = onlineBreakoutState.opponentBricks[c][r].status;
                                b.hitsRemaining = onlineBreakoutState.opponentBricks[c][r].hits;
                            }
                        });
                    });
                }

                if (onlineBreakoutState.score !== undefined) setScorePlayer(onlineBreakoutState.score);
                if (onlineBreakoutState.opponentScore !== undefined) setScoreAI(onlineBreakoutState.opponentScore);
                if (onlineBreakoutState.lives !== undefined) setLives(onlineBreakoutState.lives);
                if (onlineBreakoutState.winner !== undefined) setWinner(onlineBreakoutState.winner);
                if (onlineBreakoutState.gameState) setGameState(onlineBreakoutState.gameState);

                // --- SKIP PHYSICS FOR GUEST ---
                // We proceed to render only
            }
        }

        const skipPhysics = isOnline && !isHost;

        // ... Rendering starts 

        const playerPaddle = playerPaddleRef.current;
        const aiPaddle = aiPaddleRef.current;
        const balls = ballsRef.current;
        const brickHeight = 20;

        // Paddle Positions Logic (USING SAME CONSTANTS)
        let playerPaddleY, aiPaddleY;

        if (gameMode === 'BRICKS') {
            playerPaddleY = height - 100;
            aiPaddleY = -100; // Hidden
        } else {
            // Re-use logic for perfect sync
            const topBricksBottom = verticalMargin + brickTotalHeight;
            aiPaddleY = topBricksBottom + paddleGap;

            playerPaddleY = height - verticalMargin - brickTotalHeight - paddleGap - PADDLE_HEIGHT;
        }

        // Apply Screenshake
        ctx.save();
        if (shakeRef.current > 0) {
            const sx = (Math.random() - 0.5) * shakeRef.current;
            const sy = (Math.random() - 0.5) * shakeRef.current;
            ctx.translate(sx, sy);
            shakeRef.current *= 0.9;
            if (shakeRef.current < 0.5) shakeRef.current = 0;
        }

        // Clear Canvas Completely First (Prevent Trails)
        ctx.clearRect(0, 0, width, height);

        // Apply Base Background
        // If theme background is transparent/rgba, we need a base color (e.g., slate-950)
        ctx.fillStyle = '#020617'; // Slate 950 base
        ctx.fillRect(0, 0, width, height);

        // DRAW ZONES (Versus Mode Only)
        if (gameMode !== 'BRICKS') {
            // AI Zone (Top) - Reddish Tint
            const gradientAi = ctx.createLinearGradient(0, 0, 0, height / 2);
            gradientAi.addColorStop(0, 'rgba(239, 68, 68, 0.15)'); // Red-500 low alpha
            gradientAi.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = gradientAi;
            ctx.fillRect(0, 0, width, height / 2);

            // Player Zone (Bottom) - Blueish Tint
            const gradientPlayer = ctx.createLinearGradient(0, height, 0, height / 2);
            gradientPlayer.addColorStop(0, 'rgba(59, 130, 246, 0.15)'); // Blue-500 low alpha
            gradientPlayer.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.fillStyle = gradientPlayer;
            ctx.fillRect(0, height / 2, width, height / 2);
        }

        // Render Theme Background
        const bass = getBass(); // 0-255
        const pulse = bass / 500; // 0.0 - 0.5

        ctx.fillStyle = theme.colors.background; // Theme background (can be transparent overlay now)
        ctx.fillRect(0, 0, width, height);

        // Dynamic Background Effects based on Theme
        if (theme.effects.background === 'pulse') {
            // Cyberpunk Grid/Pulse
            ctx.fillStyle = `rgba(15, 23, 42, ${0.2 + pulse})`;
            ctx.fillRect(0, 0, width, height);
        } else if (theme.effects.background === 'wave') {
            // Zen Wave
            ctx.fillStyle = `rgba(6, 78, 59, 0.1)`;
            ctx.fillRect(0, 0, width, height);
            // Add subtle wave drawing here if needed
        } else if (theme.effects.background === 'grid') {
            // Retro Grid
            ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
            ctx.fillRect(0, 0, width, height);
            // Draw grid lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x < width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for (let y = 0; y < height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();
        }

        // --- DRAW PARTICLES ---
        particlesRef.current = particlesRef.current.filter(p => p.life > 0).slice(-100); // Optimization: Limit max particles
        particlesRef.current.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.life -= 0.02;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        // --- DRAW SHIELD ---
        // --- DRAW SHIELD ---
        if (shieldActive) {
            const shieldY = height - 20;
            // Glowing Line
            ctx.shadowBlur = 20;
            ctx.shadowColor = theme.colors.shield;
            ctx.strokeStyle = theme.colors.shield;
            ctx.lineWidth = 6;
            ctx.lineCap = "round";

            ctx.beginPath();
            ctx.moveTo(10, shieldY); // Padding
            ctx.lineTo(width - 10, shieldY);
            ctx.stroke();

            // Inner Core
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 40;
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Subtle Energy Haze (Gradient)
            const gradient = ctx.createLinearGradient(0, shieldY - 20, 0, shieldY + 10);
            gradient.addColorStop(0, "rgba(0, 242, 255, 0)");
            gradient.addColorStop(1, "rgba(0, 242, 255, 0.2)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, shieldY - 20, width, 30);
        }

        // --- DRAW PROJECTILES ---
        projectilesRef.current.forEach((p, index) => {
            p.y += p.dy;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.shadowBlur = 0;

            // Projectile Collision
            if (p.y < 0) {
                p.remove = true;
            } else {
                // Check Bricks
                // Simple collision check against player bricks (since player shoots)
                // For AI support we would need owner of projectile
                const bricks = gameMode === 'AI' ? aiBricksRef.current : []; // Player shoots at AI bricks
                // Wait, if solo mode? 
                const targetBricks = gameMode === 'AI' ? aiBricksRef.current : aiBricksRef.current.concat(playerBricksRef.current);
                // Actually in solo, only aiBricksRef are used (top bricks).

                // Let's refine target bricks based on mode
                const targets = aiBricksRef.current; // Targets are always top bricks for player?
                // In Versus, player shoots up at AI bricks. In Bricks, player shoots up at bricks.

                targets.forEach(col => {
                    col.forEach(b => {
                        if (b.status === 1 && !p.remove) {
                            if (p.x > b.x && p.x < b.x + brickWidth &&
                                p.y > b.y && p.y < b.y + 20) {
                                p.remove = true;
                                b.hitsRemaining--;
                                if (b.hitsRemaining <= 0) {
                                    b.status = 0;
                                    playCardDraw();
                                    createParticles(b.x + brickWidth / 2, b.y + 10, '#f00');
                                } else {
                                    playCardPlace();
                                }
                            }
                        }
                    });
                });

                // Check Paddle Collision (AI) - Freeze Mechanic
                if (gameMode === 'AI' && !p.remove) {
                    if (p.x + p.width > aiPaddle.x && p.x < aiPaddle.x + (aiPaddleWidth || PADDLE_WIDTH) &&
                        p.y + p.height > aiPaddleY && p.y < aiPaddleY + PADDLE_HEIGHT) {

                        p.remove = true;
                        // Freeze AI
                        aiFrozenUntilRef.current = Date.now() + 3000; // 3 seconds
                        playCardFlip(); // Sound effect
                        createShockwave(p.x, p.y, '#00f2ff'); // Blue shockwave
                    }
                }

            }
        });
        projectilesRef.current = projectilesRef.current.filter(p => !p.remove);


        // Draw Center Line with Glow (Only in Versus modes)
        if (gameMode !== 'BRICKS') {
            ctx.beginPath();
            ctx.setLineDash([15, 15]);
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.strokeStyle = "rgba(0, 242, 255, 0.15)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.closePath();
        }

        // Draw Player Paddle (Neon Blue)
        // Draw Player Paddle (Neon Blue)
        ctx.fillStyle = theme.colors.primary;
        // Optimization: Remove constant shadowBlur
        // ctx.shadowColor = PLAYER_COLOR;
        // ctx.shadowBlur = 20;
        ctx.beginPath();
        // Fix: Use dynamic width
        const currentPaddleWidth = playerPaddleWidth || PADDLE_WIDTH;
        ctx.roundRect(playerPaddle.x, playerPaddleY, currentPaddleWidth, PADDLE_HEIGHT, 8);
        ctx.fill();

        // Paddle Reflection (Cyber accent)
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(playerPaddle.x + 5, playerPaddleY + 2, currentPaddleWidth - 10, 2);

        // Laser Turrets Visual
        if (laserActive) {
            ctx.fillStyle = "#ef4444"; // Red Turrets
            // Left Turret
            ctx.fillRect(playerPaddle.x + 4, playerPaddleY - 6, 4, 8);
            ctx.fillRect(playerPaddle.x + 5, playerPaddleY - 10, 2, 4);
            // Right Turret
            ctx.fillRect(playerPaddle.x + currentPaddleWidth - 8, playerPaddleY - 6, 4, 8);
            ctx.fillRect(playerPaddle.x + currentPaddleWidth - 7, playerPaddleY - 10, 2, 4);

            // Glow
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 10;
        }

        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.stroke();
        ctx.closePath();
        ctx.shadowBlur = 0;

        // Draw AI Paddle (Neon Purple)
        if (gameMode === 'AI') {
            ctx.fillStyle = theme.colors.secondary;
            // Optimization
            // ctx.shadowColor = AI_COLOR;
            // ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.roundRect(aiPaddle.x, aiPaddleY, aiPaddleWidth || PADDLE_WIDTH, PADDLE_HEIGHT, 8);
            ctx.fill();

            // Paddle Reflection (Cyber accent)
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fillRect(aiPaddle.x + 5, aiPaddleY + PADDLE_HEIGHT - 4, (aiPaddleWidth || PADDLE_WIDTH) - 10, 2);

            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.stroke();
            ctx.closePath();
            ctx.shadowBlur = 0;
        }

        const bonusColors = {
            'SUPER_BALL': { start: '#fcd34d', end: '#b45309', shadow: '#fbbf24' },
            'WIDE_PADDLE': { start: '#22d3ee', end: '#0891b2', shadow: '#06b6d4' },
            'MULTI_BALL': { start: '#d946ef', end: '#701a75', shadow: '#a21caf' }
        };

        // Draw Bricks Function
        const drawBricks = (bricks, baseColor, isAi) => {
            let activeCount = 0;
            bricks.forEach((col, colIndex) => {
                col.forEach((b, rowIndex) => {
                    if (b.status === 1) {
                        activeCount++;
                        const isReinforced = b.isReinforced && b.hitsRemaining > 0;
                        const isBonus = b.isBonus;
                        let gradientStart;
                        let gradientEnd;

                        // Fallback logic for gradients to keep it simple without helper
                        if (isAi) {
                            gradientStart = theme.colors.brickAi;
                            gradientEnd = theme.colors.secondary;
                        } else {
                            gradientStart = theme.colors.brickBase;
                            gradientEnd = theme.colors.primary;
                        }

                        let shadowColor = baseColor;

                        if (isBonus && b.bonusType) {
                            const colors = bonusColors[b.bonusType] || bonusColors['SUPER_BALL'];
                            gradientStart = colors.start;
                            gradientEnd = colors.end;
                            shadowColor = colors.shadow;
                        } else if (b.hitsRemaining === 3) {
                            // Titanium look (Dark Gold/Graphite)
                            gradientStart = '#4b5563';
                            gradientEnd = '#111827';
                            shadowColor = '#fbbf24';
                        } else if (b.hitsRemaining === 2) {
                            // Steel/Reinforced look
                            gradientStart = '#94a3b8';
                            gradientEnd = '#475569';
                            shadowColor = '#64748b';
                        } else if (b.hitsRemaining === 1 && b.isReinforced) {
                            // Damaged reinforced brick look (faded/cracked)
                            gradientStart = isAi ? '#6b21a8' : '#0e7490';
                            gradientEnd = '#1e293b';
                            shadowColor = isAi ? '#7e22ce' : '#0891b2';
                        }

                        if (b.specialType === 'EXPLOSIVE') {
                            gradientStart = '#ef4444'; // Red
                            gradientEnd = '#7f1d1d';
                            shadowColor = '#f87171'; // Pulse color
                        } else if (b.specialType === 'GOLDEN') {
                            gradientStart = '#fcd34d'; // Gold
                            gradientEnd = '#b45309';
                            shadowColor = '#fbbf24';
                        }

                        const gradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + brickHeight);
                        gradient.addColorStop(0, gradientStart);
                        gradient.addColorStop(1, gradientEnd);

                        ctx.beginPath();
                        ctx.roundRect(b.x, b.y, brickWidth, brickHeight, 6);
                        ctx.fillStyle = gradient;
                        // Performance: Only shadow for special bricks
                        if (isBonus || isReinforced || b.specialType) {
                            ctx.shadowColor = shadowColor;
                            ctx.shadowBlur = 10;
                        }
                        ctx.fill();

                        // Add Textures / Damage
                        if (b.hitsRemaining === 3) {
                            // Titanium Border
                            ctx.strokeStyle = "rgba(251,191,36,0.4)";
                            ctx.lineWidth = 2;
                            ctx.stroke();
                        } else if (b.hitsRemaining === 2) {
                            // Steel Border
                            ctx.strokeStyle = "rgba(255,255,255,0.4)";
                            ctx.lineWidth = 2;
                            ctx.stroke();
                        } else {
                            ctx.strokeStyle = "rgba(255,255,255,0.2)";
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }

                        // Damage cracks
                        if (b.hitsRemaining < b.maxHits) {
                            ctx.beginPath();
                            ctx.strokeStyle = "rgba(255,255,255,0.3)";
                            ctx.lineWidth = 1;
                            ctx.moveTo(b.x + brickWidth * 0.2, b.y);
                            ctx.lineTo(b.x + brickWidth * 0.4, b.y + brickHeight * 0.6);
                            ctx.lineTo(b.x + brickWidth * 0.1, b.y + brickHeight);
                            ctx.stroke();
                        }

                        ctx.shadowBlur = 0;
                        ctx.closePath();

                        // Draw Bonus Symbol (Coherence)
                        if (isBonus && b.bonusType) {
                            ctx.fillStyle = "#ffffff";
                            ctx.font = "bold 12px sans-serif";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            let symbol = "";
                            if (b.bonusType === 'SUPER_BALL') symbol = "⚡";
                            if (b.bonusType === 'WIDE_PADDLE') symbol = "↔";
                            if (b.bonusType === 'MULTI_BALL') symbol = "+";
                            ctx.fillText(symbol, b.x + brickWidth / 2, b.y + brickHeight / 2 + 1);
                        }

                        // Collision for each ball - ONLY IF physics master
                        if (!isOnline || isHost) {
                            balls.forEach(ball => {
                                if (ball.x > b.x && ball.x < b.x + brickWidth &&
                                    ball.y > b.y && ball.y < b.y + brickHeight && b.status === 1) {

                                    if (ball.isSuperCharged) {
                                        b.hitsRemaining = 0;
                                        b.status = 0;
                                    } else {
                                        b.hitsRemaining--;
                                        if (b.hitsRemaining <= 0) {
                                            b.status = 0;
                                        }

                                        // Resolve Penetration (Brick Anti-Tunneling)
                                        const overlapX = (brickWidth / 2 + BALL_RADIUS) - Math.abs(ball.x - (b.x + brickWidth / 2));
                                        const overlapY = (brickHeight / 2 + BALL_RADIUS) - Math.abs(ball.y - (b.y + brickHeight / 2));

                                        if (overlapX < overlapY) {
                                            if (ball.x < b.x + brickWidth / 2) ball.x -= overlapX; else ball.x += overlapX;
                                            ball.dx = -ball.dx;
                                        } else {
                                            if (ball.y < b.y + brickHeight / 2) ball.y -= overlapY; else ball.y += overlapY;
                                            ball.dy = -ball.dy;
                                        }
                                    }

                                    if (b.status === 0) {
                                        playCardDraw();
                                        createParticles(b.x + brickWidth / 2, b.y + brickHeight / 2, gradientStart);
                                        createShockwave(b.x + brickWidth / 2, b.y + brickHeight / 2, gradientStart);
                                        if (b.isBonus) {
                                            if (isAi) {
                                                setPlayerBonus({ type: b.bonusType });
                                            } else {
                                                setAiBonusAvailable({ type: b.bonusType });
                                            }
                                        }

                                        if (b.specialType === 'EXPLOSIVE') {
                                            explodeBrick(colIndex, rowIndex, isAi);
                                        }
                                        if (b.specialType === 'GOLDEN') {
                                            if (isAi) setScorePlayer(s => s + 1000); else setScoreAI(s => s + 1000);
                                            createShockwave(b.x, b.y, '#fbbf24');
                                            playVictory();
                                        }
                                    } else {
                                        // Resolve Penetration (Brick Anti-Tunneling)
                                        // Calculate overlap
                                        const overlapX = (brickWidth / 2 + BALL_RADIUS) - Math.abs(ball.x - (b.x + brickWidth / 2));
                                        const overlapY = (brickHeight / 2 + BALL_RADIUS) - Math.abs(ball.y - (b.y + brickHeight / 2));

                                        if (overlapX < overlapY) {
                                            // X collision
                                            if (ball.x < b.x + brickWidth / 2) ball.x -= overlapX; else ball.x += overlapX;
                                        } else {
                                            // Y collision
                                            if (ball.y < b.y + brickHeight / 2) ball.y -= overlapY; else ball.y += overlapY;
                                        }

                                        if (b.hitsRemaining >= 1) {
                                            playCardPlace();
                                            createParticles(ball.x, ball.y, '#94a3b8');
                                        } else {
                                            playCardFlip();
                                            createParticles(ball.x, ball.y, '#ffffff');
                                        }
                                    }

                                    shakeRef.current = 10;
                                }
                            });
                        }
                    }
                });
            });
            return activeCount;
        };


        const activeAiBricks = drawBricks(aiBricksRef.current, theme.colors.brickAi, true);
        if ((!isOnline || isHost) && aiBricksRef.current.length > 0 && activeAiBricks < (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - scorePlayer) {
            setScorePlayer((BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - activeAiBricks);
        }

        // Zen Mode Brick Regen
        if (isZenMode && activeAiBricks === 0) {
            aiBricksRef.current = createBricks(true);
            createShockwave(width / 2, 200, '#fff');
            playVictory();
            useGameStore.getState().unlockAchievement('ZEN_MASTER');
        }

        const activePlayerBricks = (gameMode === 'AI' || gameMode === 'ONLINE') ? drawBricks(playerBricksRef.current, theme.colors.brickBase, false) : 0;
        if ((!isOnline || isHost) && playerBricksRef.current.length > 0 && (gameMode === 'AI' || gameMode === 'ONLINE') && activePlayerBricks < (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - scoreAI) {
            setScoreAI((BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - activePlayerBricks);
        }

        // Victory / Game Over logic (Only host or local calculates this)
        if ((!isOnline || isHost) && !isBossMode && !isZenMode && aiBricksRef.current.length > 0 && activeAiBricks === 0) {
            setWinner('PLAYER');
            setGameState('VICTORY');
            playVictory();
            const wasUntouchable = lives === 3;
            useGameStore.getState().addWin();
            if (wasUntouchable) {
                useGameStore.getState().unlockAchievement('UNTOUCHABLE');
            }
            return;
        }
        if ((!isOnline || isHost) && isBossMode && bossHp <= 0) {
            setWinner('PLAYER');
            setGameState('VICTORY');
            playVictory();
            useGameStore.getState().addWin(true); // wasBossDefeated = true
            return;
        }
        if ((!isOnline || isHost) && gameMode === 'AI' && playerBricksRef.current.length > 0 && activePlayerBricks === 0) {
            setWinner('AI');
            setGameState('GAME_OVER');
            playError();
            return;
        }

        // --- ZEN MODE: INFINITE RESPAWN ---
        if (isZenMode && activePlayerBricks === 0 && playerBricksRef.current.length > 0 && !isOnline) {
            // Generate new bricks smoothly
            playVictory(); // Satisfying sound
            playerBricksRef.current = createBricks(false); // Respawn bottom bricks
            shakeRef.current = 10;
        }

        // Draw Balls
        balls.forEach(ball => {
            // Safety Cap Speed
            const MAX_POSSIBLE_SPEED = 25;
            if (ball.speed > MAX_POSSIBLE_SPEED) ball.speed = MAX_POSSIBLE_SPEED;
            if (Math.abs(ball.dx) > MAX_POSSIBLE_SPEED) ball.dx = (ball.dx > 0 ? 1 : -1) * MAX_POSSIBLE_SPEED;
            if (Math.abs(ball.dy) > MAX_POSSIBLE_SPEED) ball.dy = (ball.dy > 0 ? 1 : -1) * MAX_POSSIBLE_SPEED;

            // Attached ball behavior (Solo mode)
            if (ball.isAttached) {
                ball.x = playerPaddle.x + playerPaddleWidth / 2;
                ball.y = playerPaddleY - BALL_RADIUS - 5;
                ball.dx = 0;
                ball.dy = 0;
            }

            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
            if (ball.isSuperCharged) {
                ctx.fillStyle = "#fbbf24";
                ctx.shadowColor = "#f59e0b";
                ctx.shadowBlur = 30;
            } else {
                ctx.fillStyle = theme.colors.ball;
                ctx.shadowColor = theme.colors.primary;
                ctx.shadowBlur = 20;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.closePath();

            // --- BALL PHYSICS (HOST ONLY) ---
            if (!skipPhysics) {
                if (!ball.isAttached) {
                    // Apply Time Scale
                    const currentSpeedX = ball.dx * (timeScaleRef.current || 1.0);
                    const currentSpeedY = ball.dy * (timeScaleRef.current || 1.0);

                    ball.x += currentSpeedX;
                    ball.y += currentSpeedY;

                    if (ball.x + ball.dx > width - BALL_RADIUS || ball.x + ball.dx < BALL_RADIUS) {
                        ball.dx = -ball.dx;
                        playCardFlip();
                        shakeRef.current = 5;
                    }

                    if (!Number.isFinite(ball.x) || !Number.isFinite(ball.y)) {
                        ball.x = width / 2;
                        ball.y = height / 2;
                        ball.dx = 0;
                        ball.dy = 0;
                        ball.isAttached = true;
                    }

                    if (ball.y + ball.dy < BALL_RADIUS) {
                        ball.dy = -ball.dy;
                        playCardFlip();
                        shakeRef.current = 5;
                    }
                }

                if (ball.y + ball.dy > height - 20 - BALL_RADIUS) {
                    // Shield Logic
                    if (shieldActive) {
                        ball.dy = -Math.abs(ball.dy);
                        playCardFlip();
                        createShockwave(ball.x, ball.y, theme.colors.shield);
                        shakeRef.current = 10;
                    } else {
                        // Normal fall
                        if (isZenMode) {
                            ball.dy = -Math.abs(ball.dy);
                            ball.y = height - 120; // Safety teleport
                            playCardFlip();
                        } else {
                            // Regular modes: Lose life
                            if (balls.length > 1) {
                                ballsRef.current = balls.filter(b => b !== ball);
                            } else {
                                setLives(prev => {
                                    const newLives = prev - 1;
                                    if (newLives <= 0) {
                                        setWinner('AI');
                                        setGameState('GAME_OVER');
                                        playError();
                                        if (isOnline && isHost) {
                                            syncBreakoutState({ gameState: 'GAME_OVER', winner: 'AI', isGameOver: true });
                                        }
                                    } else {
                                        ball.isAttached = true;
                                        ball.dx = 0;
                                        ball.dy = 0;
                                    }
                                    return newLives;
                                });
                            }
                        }
                    }
                }

                const handlePaddleCollision = (paddle, paddleY, isBottom, currentPaddleWidth) => {
                    if (!ball.isAttached &&
                        ball.x + BALL_RADIUS >= paddle.x &&
                        ball.x - BALL_RADIUS <= paddle.x + currentPaddleWidth) {

                        if (isBottom) {
                            ball.y = paddleY - BALL_RADIUS - 0.5;
                        } else {
                            ball.y = paddleY + PADDLE_HEIGHT + 0.5 + BALL_RADIUS;
                        }

                        let collidePoint = (ball.x - (paddle.x + currentPaddleWidth / 2)) / (currentPaddleWidth / 2);
                        let angle = collidePoint * (Math.PI / 3);
                        const profile = SPEED_PROFILES[selectedDifficulty];
                        let speed = Math.min(ball.speed * profile.acceleration, profile.max);
                        ball.speed = speed;
                        ball.dx = speed * Math.sin(angle);
                        ball.dy = isBottom ? -speed * Math.cos(angle) : speed * Math.cos(angle);
                        playCardPlace();
                        shakeRef.current = 12;
                    }
                };

                if (ball.y + BALL_RADIUS >= playerPaddleY && ball.y - BALL_RADIUS <= playerPaddleY + PADDLE_HEIGHT && ball.dy > 0) {
                    handlePaddleCollision(playerPaddle, playerPaddleY, true, playerPaddleWidth);
                }
                if ((gameMode === 'AI' || gameMode === 'ONLINE') && ball.y - BALL_RADIUS <= aiPaddleY + PADDLE_HEIGHT && ball.y + BALL_RADIUS >= aiPaddleY && ball.dy < 0) {
                    handlePaddleCollision(aiPaddle, aiPaddleY, false, aiPaddleWidth);
                }
            }
        });

        // --- BOSS LOGIC ---
        if (isBossMode) {
            const boss = bossRef.current;
            // Boss Movement
            boss.x += boss.dx;
            if (boss.x <= 0 || boss.x + boss.width >= width) {
                boss.dx = -boss.dx;
            }

            // Boss Attack (e.g., spawn bricks or shoot)
            if (Date.now() - boss.lastAttack > 3000) {
                boss.lastAttack = Date.now();
                // Spawn a few bricks randomly
                const col = Math.floor(Math.random() * BRICK_COLUMN_COUNT);
                const r = Math.floor(Math.random() * 2);
                if (aiBricksRef.current[col] && aiBricksRef.current[col][r]) {
                    aiBricksRef.current[col][r].status = 1;
                    aiBricksRef.current[col][r].hitsRemaining = 1;
                    createParticles(aiBricksRef.current[col][r].x, aiBricksRef.current[col][r].y, '#f00');
                }
            }

            // Ball-Boss Collision
            balls.forEach(ball => {
                if (ball.x > boss.x && ball.x < boss.x + boss.width &&
                    ball.y > boss.y && ball.y < boss.y + boss.height) {

                    // Damage Boss
                    setBossHp(prev => Math.max(0, prev - 5));
                    ball.dy = -ball.dy;
                    ball.y = boss.y + boss.height + BALL_RADIUS + 2; // Reposition
                    createShockwave(ball.x, ball.y, '#f00');
                    createParticles(ball.x, ball.y, '#f00');
                    shakeRef.current = 20;
                    playCardFlip();
                }
            });

            // Render Boss
            ctx.fillStyle = "#ef4444";
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.roundRect(boss.x, boss.y, boss.width, boss.height, 12);
            ctx.fill();

            // Health Bar on Boss
            const hpWidth = (bossHp / 100) * boss.width;
            ctx.fillStyle = "#4ade80";
            ctx.fillRect(boss.x, boss.y - 10, hpWidth, 4);

            ctx.shadowBlur = 0;
            ctx.closePath();
        }

        // Update AI state
        if (!isOnline) updateAI();

        ctx.restore();
        requestRef.current = requestAnimationFrame(update);
    }, [gameState, gameMode, playerPaddleWidth, aiPaddleWidth, lives, aiDifficulty, selectedDifficulty, launchBall, playCardDraw, playCardFlip, playCardPlace, playError, playVictory, scorePlayer, scoreAI, updateAI]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => {
            cancelAnimationFrame(requestRef.current);
            if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
            if (laserTimerRef.current) clearInterval(laserTimerRef.current);
        };
    }, [update]);

    const activateBonus = () => {
        if (!playerBonus || bonusLockRef.current) return;
        bonusLockRef.current = true; // LOCK
        playCardPlace();

        const type = playerBonus.type;

        if (type === 'SUPER_BALL') {
            const profile = SPEED_PROFILES[selectedDifficulty];
            ballsRef.current.forEach(ball => {
                ball.isSuperCharged = true;
                ball.speed = profile.max * 1.1; // Balanced boost
            });
            shakeRef.current = 20;
            if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
            bonusTimerRef.current = setTimeout(() => {
                ballsRef.current.forEach(ball => { ball.isSuperCharged = false; });
            }, 6000);
        } else if (type === 'WIDE_PADDLE') {
            setPlayerPaddleWidth(PADDLE_WIDTH * 1.6);
            if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
            bonusTimerRef.current = setTimeout(() => {
                setPlayerPaddleWidth(PADDLE_WIDTH);
            }, 6000);
            shakeRef.current = 10;
        } else if (type === 'MULTI_BALL') {
            const newBalls = [];
            if (ballsRef.current.length > 0) {
                const referenceBall = ballsRef.current[0];
                for (let i = 0; i < 2; i++) {
                    newBalls.push({
                        ...referenceBall,
                        dx: referenceBall.dx + (Math.random() - 0.5) * 4,
                        dy: -Math.abs(referenceBall.dy),
                        speed: referenceBall.speed,
                        isSuperCharged: referenceBall.isSuperCharged
                    });
                }
            }
            ballsRef.current = [...ballsRef.current, ...newBalls];
            if (ballsRef.current.length > 10) ballsRef.current = ballsRef.current.slice(0, 10);
            shakeRef.current = 15;
        } else if (type === 'BULLET_TIME') {
            timeScaleRef.current = 0.3; // Slow motion
            setTimeout(() => {
                timeScaleRef.current = 1.0;
            }, 5000); // 5 seconds of bullet time
        } else if (type === 'SHIELD') {
            setShieldActive(true);
            playVictory(); // Sound hint
        } else if (type === 'LASER') {
            setLaserActive(true);

            // Manual fire logic (handled in onCanvasClick/fireLaser)
            if (laserTimerRef.current) clearInterval(laserTimerRef.current);

            setTimeout(() => {
                setLaserActive(false);
            }, 8000); // 8 seconds of laser
        }

        setPlayerBonus(null);
        // Release lock after short delay to prevent double submissions but allow next bonus
        setTimeout(() => { bonusLockRef.current = false; }, 500);
    };

    // Pity Bonus Check (In Update Loop ideally, but here hook for simplicity or add to update)
    // We'll add it to the update loop main logic for consistency.


    const activateAiBonus = () => {
        if (!aiBonusAvailable) return;
        const type = aiBonusAvailable.type;

        if (type === 'SUPER_BALL') {
            const profile = SPEED_PROFILES[selectedDifficulty];
            ballsRef.current.forEach(ball => {
                ball.isSuperCharged = true;
                ball.speed = profile.max * 1.1;
            });
            setTimeout(() => {
                ballsRef.current.forEach(ball => { ball.isSuperCharged = false; });
            }, 6000);
        } else if (type === 'WIDE_PADDLE') {
            setAiPaddleWidth(PADDLE_WIDTH * 1.6);
            setTimeout(() => {
                setAiPaddleWidth(PADDLE_WIDTH);
            }, 6000);
        } else if (type === 'MULTI_BALL') {
            const newBalls = [];
            if (ballsRef.current.length > 0) {
                const referenceBall = ballsRef.current[0];
                for (let i = 0; i < 2; i++) {
                    newBalls.push({
                        ...referenceBall,
                        dx: referenceBall.dx + (Math.random() - 0.5) * 4,
                        dy: Math.abs(referenceBall.dy), // AI shoots downwards usually
                        speed: referenceBall.speed,
                        isSuperCharged: referenceBall.isSuperCharged
                    });
                }
            }
            ballsRef.current = [...ballsRef.current, ...newBalls];
            if (ballsRef.current.length > 10) ballsRef.current = ballsRef.current.slice(0, 10);
        }
        setAiBonusAvailable(null);
    };

    const cycleTheme = () => {
        const { currentTheme, setTheme, unlockedThemes } = useGameStore.getState();
        const availableThemes = THEMES.map(t => t.id).filter(id => unlockedThemes.includes(id));
        const currentIndex = availableThemes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % availableThemes.length;
        setTheme(availableThemes[nextIndex]);
    };

    const startSolo = () => {
        playClick();
        setIsZenMode(false);
        setIsBossMode(false);
        setGameMode('BRICKS');
        setLives(3);
        initGame();
        setGameState('PLAYING');
    };

    const startAI = () => {
        playClick();
        setIsZenMode(false);
        setIsBossMode(false);
        setGameMode('AI');
        initGame();
        setGameState('PLAYING');
    };

    return (
        <div className="flex flex-col w-full max-w-lg mx-auto h-[100dvh] overflow-hidden bg-slate-950 font-sans">
            {/* Header Score - Modern Glass */}
            {gameState !== 'MENU' && (
                <div className="flex-none p-2 z-[60]">
                    <div className="flex items-center justify-between px-6 py-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter">
                                {gameMode === 'BRICKS' ? 'VIES' : (isOnline ? (players.find(p => p.id !== socketId)?.name || 'ADVERSAIRE') : 'IA SYSTEM')}
                            </span>
                            <span className="text-2xl font-black text-white tabular-nums">
                                {gameMode === 'BRICKS'
                                    ? lives
                                    : (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT - scorePlayer)}
                            </span>
                        </div>
                        {/* Theme Unlock Notification */}
                        <AnimatePresence>
                            {showUnlockNotification && (
                                <motion.div
                                    key="unlock-notification"
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: -100, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(34,211,238,0.3)] z-[100] flex flex-col items-center gap-3 backdrop-blur-xl"
                                >
                                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                        <Trophy className="w-10 h-10 text-cyan-400" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-black text-white italic tracking-tighter">NOUVELLE DÉCOUVERTE !</h3>
                                        <p className="text-sm text-cyan-200/70">Thème <span className="text-cyan-400 font-bold uppercase">{showUnlockNotification.themeName}</span> débloqué.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowUnlockNotification(null)}
                                        className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-sm rounded-xl hover:scale-105 active:scale-95 transition-all"
                                    >
                                        CONTINUER
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Pause / Menu Button */}
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => {
                                    if (!isOnline) {
                                        setGameState('PAUSED');
                                        playPause();
                                    }
                                }}
                                disabled={isOnline}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group ${isOnline
                                    ? 'bg-slate-800 border border-white/5 opacity-50 cursor-not-allowed'
                                    : 'bg-white/5 hover:bg-cyan-500/20 border border-white/10 active:scale-95'
                                    }`}
                                onMouseEnter={() => !isOnline && playHover()}
                            >
                                {isOnline ? (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                ) : (
                                    <Pause className="w-4 h-4 text-white/60 group-hover:text-cyan-400 transition-colors" />
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-tighter">
                                {gameMode === 'BRICKS' ? 'SCORE' : (isOnline ? 'MOI' : 'PLAYER')}
                            </span>
                            <span className="text-2xl font-black text-white tabular-nums">
                                {gameMode === 'BRICKS' ? scorePlayer : (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT - scoreAI)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* LASER BUTTON (MOBILE/DESKTOP) */}
            <AnimatePresence>
                {laserActive && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); fireLaser(); }}
                        className="absolute bottom-32 right-8 z-[70] w-20 h-20 rounded-full bg-red-500/90 border-4 border-red-400 shadow-[0_0_30px_#ef4444] flex items-center justify-center animate-pulse"
                    >
                        <Zap className="w-10 h-10 text-white fill-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Game Area */}
            <div className="flex-1 relative w-full px-1 pb-1">
                <div className="absolute inset-0 overflow-hidden rounded-3xl bg-slate-900 shadow-[inset_0_0_100px_rgba(0,242,255,0.05)] border border-white/5">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full touch-none cursor-none block"
                    />

                    {/* Menu Overlay - Premium Design */}
                    <AnimatePresence>
                        {/* PAUSE OVERLAY */}
                        {gameState === 'PAUSED' && (
                            <motion.div
                                key="pause-overlay"
                                initial={{ opacity: 0, backdropFilter: "blur(0px)", scale: 0.95 }}
                                animate={{ opacity: 1, backdropFilter: "blur(10px)", scale: 1 }}
                                exit={{ opacity: 0, backdropFilter: "blur(0px)", scale: 0.95 }}
                                className="absolute inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-center p-6 space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <h2 className="text-4xl font-black text-white tracking-tighter italic">PAUSE</h2>
                                    <div className="h-1 w-20 bg-cyan-500 mx-auto rounded-full" />
                                </div>

                                {showGuide ? (
                                    <div className="w-full max-w-sm h-[60vh] overflow-y-auto bg-slate-900/90 rounded-2xl border border-white/10 p-4 space-y-6 custom-scrollbar">
                                        <div>
                                            <h3 className="text-lg font-black text-cyan-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <Layers className="w-4 h-4" /> Briques
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                                    <div className="w-8 h-4 bg-cyan-500 rounded-sm" />
                                                    <div className="text-sm"><span className="font-bold text-white">Standard</span> : 1 Coup</div>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                                    <div className="w-8 h-4 bg-purple-600 border border-white/30 rounded-sm" />
                                                    <div className="text-sm"><span className="font-bold text-white">Renforcée</span> : 2-3 Coups</div>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                                    <div className="w-8 h-4 bg-red-500 animate-pulse rounded-sm" />
                                                    <div className="text-sm"><span className="font-bold text-white">Explosive</span> : Boom 💥</div>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                                    <div className="w-8 h-4 bg-amber-400 shadow-[0_0_10px_orange] rounded-sm" />
                                                    <div className="text-sm"><span className="font-bold text-white">Dorée</span> : +1000 Pts</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-black text-emerald-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <Zap className="w-4 h-4" /> Bonus
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-white/5 p-2 rounded flex flex-col items-center text-center gap-1">
                                                    <Zap className="w-4 h-4 text-yellow-400" />
                                                    <span className="font-bold text-slate-200">Super Ball</span>
                                                </div>
                                                <div className="bg-white/5 p-2 rounded flex flex-col items-center text-center gap-1">
                                                    <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                                                    <span className="font-bold text-slate-200">Large Paddle</span>
                                                </div>
                                                <div className="bg-white/5 p-2 rounded flex flex-col items-center text-center gap-1">
                                                    <Users className="w-4 h-4 text-green-400" />
                                                    <span className="font-bold text-slate-200">Multi-Ball</span>
                                                </div>
                                                <div className="bg-white/5 p-2 rounded flex flex-col items-center text-center gap-1">
                                                    <RotateCcw className="w-4 h-4 text-purple-400" />
                                                    <span className="font-bold text-slate-200">Slow Mo</span>
                                                </div>
                                                <div className="bg-white/5 p-2 rounded flex flex-col items-center text-center gap-1">
                                                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                                                    <span className="font-bold text-slate-200">Shield</span>
                                                </div>
                                                <div className="bg-white/5 p-2 rounded flex flex-col items-center text-center gap-1">
                                                    <Zap className="w-4 h-4 text-red-500" />
                                                    <span className="font-bold text-slate-200">Laser</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowGuide(false)}
                                            onMouseEnter={() => playHover()}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                                        >
                                            RETOUR
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col w-full max-w-xs gap-4">
                                        <button
                                            onClick={() => {
                                                setGameState('PLAYING');
                                                playClick();
                                            }}
                                            onMouseEnter={() => playHover()}
                                            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-black text-lg rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                            REPRENDRE
                                        </button>

                                        <button
                                            onClick={() => setShowGuide(true)}
                                            onMouseEnter={() => playHover()}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-sm rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-cyan-500/20"
                                        >
                                            <Monitor className="w-4 h-4" />
                                            GUIDE DU JEU
                                        </button>

                                        <button
                                            onClick={() => {
                                                onBackToMenu();
                                                playClick();
                                            }}
                                            onMouseEnter={() => playHover()}
                                            className="w-full py-4 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-slate-300 font-bold text-sm rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            QUITTER LA PARTIE
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {isOnline && !isHost && !initialStateReceived && (
                            <motion.div
                                key="guest-sync-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mb-6 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                />
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">SYNCHRONISATION</h2>
                                <p className="text-cyan-400 font-bold animate-pulse text-sm">Réception du terrain de l'hôte...</p>
                                <div className="mt-8 pt-8 border-t border-white/5 w-full flex flex-col items-center">
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">En attente de l'autorité</p>
                                    <p className="text-[10px] text-cyan-500/50 font-mono">SKYBRICK_VERSUS_v1.0.4_SYNC</p>
                                </div>
                            </motion.div>
                        )}

                        {gameState === 'MENU' && (
                            <motion.div
                                key="game-menu-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-20"
                            >
                                {/* THEME SELECTOR - Top Right */}
                                <div className="absolute top-6 right-6 z-50">
                                    <button
                                        onClick={cycleTheme}
                                        className="flex items-center gap-3 px-4 py-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full shadow-xl hover:bg-white/5 active:scale-95 transition-all group"
                                    >
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">
                                            THEME
                                        </span>
                                        <div className="w-px h-3 bg-white/20" />
                                        <div className="flex items-center gap-2">
                                            <Palette className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                                            <span className="text-xs font-black text-white tracking-wide uppercase" style={{ color: theme.colors.primary }}>
                                                {theme.label}
                                            </span>
                                        </div>
                                    </button>
                                </div>

                                {/* Title Section */}
                                <div className="text-center mb-10 z-10">
                                    <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                                        SKYBRICK
                                    </h1>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-[0.6em] uppercase mt-2 mr-[-0.6em]">
                                        Versus Edition
                                    </p>
                                </div>

                                {/* Main Card Container */}
                                <div className="w-full max-w-sm bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">

                                    {/* Difficulty Selector - Segmented Control */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end px-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Puissance Système</span>
                                            <span className={`text-[10px] font-black uppercase ${SPEED_PROFILES[selectedDifficulty].color}`}>
                                                {SPEED_PROFILES[selectedDifficulty].label}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/50 rounded-xl border border-white/5">
                                            {Object.entries(SPEED_PROFILES).map(([key, config]) => (
                                                <button
                                                    key={`diff-${key}`}
                                                    onClick={() => { playClick(); setSelectedDifficulty(key); }}
                                                    className={`relative py-3 rounded-lg text-xs font-bold transition-all overflow-hidden group ${selectedDifficulty === key
                                                        ? 'text-white shadow-lg'
                                                        : 'text-slate-500 hover:text-slate-300'
                                                        }`}
                                                >
                                                    {selectedDifficulty === key && (
                                                        <motion.div
                                                            layoutId="difficulty-highlight"
                                                            className={`absolute inset-0 bg-white/10 ${config.color.replace('text-', 'bg-')}/20 border border-white/10`}
                                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                        />
                                                    )}
                                                    <span className="relative z-10">{config.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Primary Actions Grid */}
                                    <div className="space-y-6">
                                        {/* SOLO SECTION */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mode Solo</span>
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                            </div>
                                            <button
                                                onClick={startSolo}
                                                className="w-full relative h-24 bg-gradient-to-br from-cyan-900/40 to-slate-900/40 border border-cyan-500/30 rounded-2xl p-4 flex flex-row items-center justify-between gap-4 group overflow-hidden transition-all hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-95"
                                            >
                                                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[10px] text-cyan-200/60 font-bold uppercase tracking-wider">Arcade Classique</span>
                                                    <span className="text-2xl font-black text-white italic tracking-tighter">SOLO RUN</span>
                                                </div>
                                                <IDCard className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                                            </button>

                                            {/* ZEN MODE ENTRY */}
                                            <button
                                                onClick={() => {
                                                    playClick();
                                                    setGameMode('BRICKS');
                                                    setIsZenMode(true);
                                                    setIsBossMode(false);
                                                    setLives(Infinity);
                                                    initGame();
                                                    setGameState('PLAYING');
                                                }}
                                                className="w-full relative h-16 bg-gradient-to-br from-emerald-900/40 to-slate-900/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-row items-center justify-between gap-4 group overflow-hidden transition-all hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 mt-2"
                                            >
                                                <div className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[10px] text-emerald-200/60 font-bold uppercase tracking-wider">Méditation Infinie</span>
                                                    <span className="text-lg font-black text-white italic tracking-tighter">MODE ZEN</span>
                                                </div>
                                                <Sparkles className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>

                                        {/* VERSUS SECTION */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modes Versus & Boss</span>
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={startAI}
                                                    className="relative h-20 bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-500/30 rounded-2xl p-3 flex flex-col justify-center items-center gap-1 group overflow-hidden transition-all hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,0,255,0.2)] active:scale-95"
                                                >
                                                    <div className="absolute inset-0 bg-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <Cpu className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-black text-white">DUEL IA</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setGameState('PLAYING');
                                                        setIsBossMode(true);
                                                        setBossHp(100);
                                                        startSolo();
                                                    }}
                                                    className="relative h-20 bg-gradient-to-br from-red-900/40 to-slate-900/40 border border-red-500/30 rounded-2xl p-3 flex flex-col justify-center items-center gap-1 group overflow-hidden transition-all hover:border-red-400/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95"
                                                >
                                                    <div className="absolute inset-0 bg-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <ShieldAlert className="w-5 h-5 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-black text-white">BOSS RUSH</span>
                                                </button>
                                            </div>

                                            <button
                                                onClick={onStartOnline}
                                                className="w-full relative h-16 bg-slate-900/40 border border-white/10 rounded-2xl p-3 flex flex-row justify-center items-center gap-2 group overflow-hidden transition-all hover:border-white/30 hover:bg-white/5 active:scale-95"
                                            >
                                                <Users className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-black text-slate-300 group-hover:text-white uppercase tracking-tighter">Multi Joueur Online</span>
                                            </button>
                                        </div>
                                    </div>

                                </div>

                                {/* Footer Link */}
                                <button
                                    onClick={onBackToMenu}
                                    className="mt-8 py-2 px-6 rounded-full text-[10px] font-bold text-slate-600 hover:text-white hover:bg-white/5 transition-all uppercase tracking-[0.2em]"
                                >
                                    Retour au Réseau
                                </button>
                            </motion.div>
                        )}

                        {gameState === 'VICTORY' && (
                            <motion.div
                                key="game-victory-overlay"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90 backdrop-blur-xl z-30 p-8 text-center"
                            >
                                <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                                    <Trophy className="w-16 h-16 text-emerald-400 animate-bounce" />
                                </div>
                                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter">INCROYABLE !</h2>
                                <p className="text-emerald-400 font-bold mb-8 uppercase tracking-widest text-sm">Système IA maîtrisé</p>
                                <div className="flex gap-4 w-full">
                                    <Button onClick={onBackToMenu} variant="outline" className="flex-1 h-14 border-white/10 text-white font-bold rounded-2xl">QUITTER</Button>
                                    <Button onClick={gameMode === 'BRICKS' ? startSolo : startAI} className="flex-1 h-14 bg-emerald-500 text-white font-black rounded-2xl shadow-lg">REJOUER</Button>
                                </div>
                            </motion.div>
                        )}

                        {gameState === 'GAME_OVER' && (
                            <motion.div
                                key="game-over-overlay"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-xl z-30 p-8 text-center"
                            >
                                <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.4)]">
                                    <ShieldAlert className="w-16 h-16 text-red-400" />
                                </div>
                                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter">SYSTÈME CRITIQUE</h2>
                                <p className="text-red-400 font-bold mb-8 uppercase tracking-widest text-sm">Défense de mur compromise</p>
                                <div className="flex gap-4 w-full">
                                    <Button onClick={onBackToMenu} variant="outline" className="flex-1 h-14 border-white/10 text-white font-bold rounded-2xl">QUITTER</Button>
                                    <Button onClick={gameMode === 'BRICKS' ? startSolo : startAI} className="flex-1 h-14 bg-red-600 text-white font-black rounded-2xl shadow-lg">REVANCHE</Button>
                                </div>
                            </motion.div>
                        )}

                        {/* BONUS BUTTON - Bottom Left Corner */}
                        {playerBonus && gameState === 'PLAYING' && (
                            <div key="player-bonus-container" className="absolute bottom-6 left-6 flex flex-col items-center z-[70]">
                                <motion.button
                                    key="bonus-button"
                                    initial={{ scale: 0, opacity: 0, y: 30 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0, opacity: 0, y: 30 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={activateBonus}
                                    className="relative w-20 h-20 group"
                                >
                                    {/* Rotating Outer Ring */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className={`absolute inset-0 rounded-full border-2 border-dashed opacity-50 ${playerBonus.type === 'SUPER_BALL' ? 'border-amber-400' :
                                            playerBonus.type === 'WIDE_PADDLE' ? 'border-cyan-400' : 'border-purple-400'
                                            }`}
                                    />

                                    {/* Central Gem */}
                                    <div className={`absolute inset-2 bg-slate-950/80 backdrop-blur-xl rounded-full border flex items-center justify-center shadow-2xl transition-all duration-500 ${playerBonus.type === 'SUPER_BALL' ? 'border-amber-500/50 shadow-amber-500/20' :
                                        playerBonus.type === 'WIDE_PADDLE' ? 'border-cyan-500/50 shadow-cyan-500/20' :
                                            'border-purple-500/50 shadow-purple-500/20'
                                        }`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${playerBonus.type === 'SUPER_BALL' ? 'from-amber-400 to-orange-600' :
                                            playerBonus.type === 'WIDE_PADDLE' ? 'from-cyan-400 to-blue-600' :
                                                'from-purple-500 to-indigo-700'
                                            } shadow-lg`}>
                                            {playerBonus.type === 'SUPER_BALL' && <Zap className="w-6 h-6 text-white fill-current" />}
                                            {playerBonus.type === 'WIDE_PADDLE' && <ArrowLeftRight className="w-6 h-6 text-white" />}
                                            {playerBonus.type === 'MULTI_BALL' && <Layers className="w-6 h-6 text-white" />}
                                        </div>
                                    </div>

                                    {/* Pulse Glow */}
                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none ${playerBonus.type === 'SUPER_BALL' ? 'bg-amber-400' :
                                        playerBonus.type === 'WIDE_PADDLE' ? 'bg-cyan-400' : 'bg-purple-400'
                                        }`} />
                                </motion.button>

                                <span className="mt-2 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                                    {playerBonus.type === 'SUPER_BALL' ? 'SUPER CHARGE' :
                                        playerBonus.type === 'WIDE_PADDLE' ? 'PADDLE EXTENSION' : 'TRIPLE CORE'}
                                </span>
                            </div>
                        )}

                        <ConfirmModal
                            key="quit-confirm-modal"
                            isOpen={showQuitConfirm}
                            onClose={() => setShowQuitConfirm(false)}
                            onConfirm={onBackToMenu}
                            title="INTERROMPRE ?"
                            message="La session de jeu SkyBrick sera terminée."
                            confirmText="OUI, QUITTER"
                            variant="danger"
                        />
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

