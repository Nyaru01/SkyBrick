import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, X, ShieldAlert, Cpu, Zap, Sparkles, Users, ArrowLeftRight, Layers, Palette } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import ConfirmModal from './ui/ConfirmModal';
import { useFeedback } from '../hooks/useFeedback';
import { useGameStore } from '../store/gameStore';
import { useReactiveAudio } from '../hooks/useReactiveAudio';

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

export default function VersusBreakout({ onBackToMenu, onStartOnline, onPlayingStateChange, aiDifficulty = 'NORMAL' }) {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const soundEnabled = useGameStore(state => state.soundEnabled);
    const { currentTheme, setTheme } = useGameStore();
    const theme = THEMES[currentTheme] || THEMES['CYBERPUNK'];

    // Game State
    const [scorePlayer, setScorePlayer] = useState(0);
    const [scoreAI, setScoreAI] = useState(0);
    const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAME_OVER, VICTORY
    const [gameMode, setGameMode] = useState('AI'); // BRICKS, AI, ONLINE
    const [selectedDifficulty, setSelectedDifficulty] = useState('EXPERT');
    const [lives, setLives] = useState(3);
    const [winner, setWinner] = useState(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    // Bonus State
    const [playerBonus, setPlayerBonus] = useState(null); // { type: 'SUPER_BALL' | 'WIDE_PADDLE' | 'MULTI_BALL' }
    const [aiBonusAvailable, setAiBonusAvailable] = useState(null); // Changed to object for specific type
    const [playerPaddleWidth, setPlayerPaddleWidth] = useState(PADDLE_WIDTH);
    const [aiPaddleWidth, setAiPaddleWidth] = useState(PADDLE_WIDTH);
    const [shieldActive, setShieldActive] = useState(false);
    const [laserActive, setLaserActive] = useState(false);

    const { playClick, playError, playVictory, playCardPlace, playCardFlip, playCardDraw } = useFeedback();
    const { play: playMusic, stop: stopMusic, getBass } = useReactiveAudio('/Music/stranger-things-124008.mp3', soundEnabled);

    useEffect(() => {
        if (onPlayingStateChange) {
            onPlayingStateChange(gameState === 'PLAYING');
        }
        if (gameState === 'PLAYING') {
            playMusic();
        } else {
            stopMusic();
        }
    }, [gameState, onPlayingStateChange, playMusic, stopMusic]);

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
    const bonusLockRef = useRef(false); // Valid locking mechanis

    // AI State
    const aiTargetXRef = useRef(0);

    // Visual Effects State
    // particlesRef already declared above
    const shockwavesRef = useRef([]);
    const timeScaleRef = useRef(1.0);
    const projectilesRef = useRef([]);
    const laserTimerRef = useRef(null);

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
    const initGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.width;
        const height = canvas.height;

        playerPaddleRef.current = { x: (width - PADDLE_WIDTH) / 2 };
        aiPaddleRef.current = { x: (width - PADDLE_WIDTH) / 2 };

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

        const brickWidth = (width - ((BRICK_COLUMN_COUNT + 1) * BRICK_PADDING)) / BRICK_COLUMN_COUNT;

        const createBricks = (isTop) => {
            if (gameMode === 'BRICKS' && !isTop) return []; // No player bricks in solo mode
            const bricks = [];
            const brickTotalHeight = BRICK_ROW_COUNT * (20 + BRICK_PADDING);
            // Increased margin to 80 to avoid edge clipping/menu overlap
            const startY = isTop ? 80 : height - 80 - brickTotalHeight;

            for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
                bricks[c] = [];
                for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                    const isBonus = Math.random() < BONUS_CHANCE;
                    // Add SHIELD and LASER to pool
                    let bonusType = isBonus ? (['SUPER_BALL', 'WIDE_PADDLE', 'MULTI_BALL', 'BULLET_TIME', 'SHIELD', 'LASER'][Math.floor(Math.random() * 6)]) : null;
                    const isReinforced = isTop ? (r >= BRICK_ROW_COUNT - 2) : (r <= 1);
                    const hits = isTop ? (r === BRICK_ROW_COUNT - 1 ? 3 : (r === BRICK_ROW_COUNT - 2 ? 2 : 1))
                        : (r === 0 ? 3 : (r === 1 ? 2 : 1));

                    // Special Types
                    let specialType = null;
                    if (!isBonus && !isReinforced && Math.random() < 0.05) specialType = 'EXPLOSIVE'; // 5% Explosive
                    if (!isBonus && !isReinforced && !specialType && Math.random() < 0.02) specialType = 'GOLDEN'; // 2% Golden

                    if (specialType === 'GOLDEN') {
                        bonusType = 'SUPER_BALL'; // Golden always has good bonus
                        // hits = 3; // Golden is tough (but let's keep standard hits for now or override?)
                        // Let's keep variable hits but maybe guarantee min 2?
                    }

                    bricks[c][r] = {
                        x: (c * (brickWidth + BRICK_PADDING)) + BRICK_PADDING,
                        y: startY + (r * (20 + BRICK_PADDING)),
                        status: 1,
                        hitsRemaining: specialType === 'GOLDEN' ? 3 : hits, // Golden is tough
                        maxHits: specialType === 'GOLDEN' ? 3 : hits,
                        isReinforced: hits > 1,
                        isBonus: isBonus || specialType === 'GOLDEN',
                        bonusType,
                        specialType
                    };
                }
            }
            return bricks;
        };

        aiBricksRef.current = createBricks(true);
        playerBricksRef.current = createBricks(false);
        canvasSizeRef.current = { width, height, brickWidth };
        particlesRef.current = [];
        shockwavesRef.current = [];

        setScorePlayer(0);
        setScoreAI(0);
        setScoreAI(0);
        setPlayerBonus(null);
        setAiBonusAvailable(null);
        setPlayerPaddleWidth(PADDLE_WIDTH);
        setAiPaddleWidth(PADDLE_WIDTH);
        if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
        if (laserTimerRef.current) clearInterval(laserTimerRef.current);
        setWinner(null);
        setShieldActive(false);
        setLaserActive(false);
        projectilesRef.current = [];

    }, [gameMode, selectedDifficulty]);

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
            if (gameState === 'PLAYING') launchBall();
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
    }, [gameState, playerPaddleWidth, launchBall]);

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
        if (gameMode !== 'AI') return; // Only AI in AI mode
        const ball = ballsRef.current[0]; // AI largely targets first ball
        if (!ball) return;
        const aiPaddle = aiPaddleRef.current;
        const width = canvasSizeRef.current.width;
        let targetX = ball.x - PADDLE_WIDTH / 2;
        let reactionSpeed = 0.08;
        if (aiDifficulty === 'EASY') reactionSpeed = 0.05;
        if (aiDifficulty === 'HARD') reactionSpeed = 0.15;
        const dx = targetX - aiPaddle.x;
        aiPaddle.x += dx * reactionSpeed;
        if (aiPaddle.x < 0) aiPaddle.x = 0;
        if (aiPaddle.x + PADDLE_WIDTH > width) aiPaddle.x = width - PADDLE_WIDTH;

        // AI Bonus Usage Logic
        if (aiBonusAvailable && Math.random() < 0.005) { // 0.5% chance per frame to use bonus
            activateAiBonus();
        }
    }, [aiDifficulty, gameMode, aiBonusAvailable]);

    const update = useCallback(() => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const { width, height, brickWidth } = canvasSizeRef.current;
        const playerPaddle = playerPaddleRef.current;
        const aiPaddle = aiPaddleRef.current;
        const balls = ballsRef.current;
        const brickHeight = 20;

        const playerPaddleY = height - 100;
        const aiPaddleY = 100 - PADDLE_HEIGHT;

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

                        // Collision for each ball
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
                });
            });
            return activeCount;
        };



        const activeAiBricks = drawBricks(aiBricksRef.current, theme.colors.brickAi, true);
        if (activeAiBricks < (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - scorePlayer) {
            setScorePlayer((BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - activeAiBricks);
        }

        const activePlayerBricks = gameMode === 'AI' ? drawBricks(playerBricksRef.current, theme.colors.brickBase, false) : 0;
        if (gameMode === 'AI' && activePlayerBricks < (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - scoreAI) {
            setScoreAI((BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - activePlayerBricks);
        }

        if (activeAiBricks === 0) { setWinner('PLAYER'); setGameState('VICTORY'); playVictory(); return; }
        if (gameMode === 'AI' && activePlayerBricks === 0) { setWinner('AI'); setGameState('GAME_OVER'); playError(); return; }

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

            // Physics (only if not attached)
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
                    ball.y = height - 20 - BALL_RADIUS - 5; // Push above shield
                    playVictory();
                    setShieldActive(false); // One-time use
                    createShockwave(ball.x, height - 10, '#00f2ff');
                    shakeRef.current = 10;
                } else if (gameMode === 'BRICKS') {
                    // In solo mode, if only one ball left, lose life
                    if (balls.length === 1) {
                        if (lives > 1) {
                            setLives(prev => prev - 1);
                            playError();
                            ballsRef.current = [{
                                x: playerPaddle.x + playerPaddleWidth / 2,
                                y: playerPaddleY - BALL_RADIUS - 5,
                                dx: 0,
                                dy: 0,
                                speed: SPEED_PROFILES[selectedDifficulty].initial,
                                isSuperCharged: false,
                                isAttached: true
                            }];
                            shakeRef.current = 15;
                        } else {
                            setLives(0);
                            setGameState('GAME_OVER');
                            playError();
                        }
                    } else {
                        // Remove this ball
                        ballsRef.current = ballsRef.current.filter(b => b !== ball);
                    }
                } else {
                    ball.dy = -ball.dy;
                    playCardFlip();
                    shakeRef.current = 5;
                }
            }

            const handlePaddleCollision = (paddle, paddleY, isBottom, currentPaddleWidth) => {
                // Expanded Hitbox for edge cases
                if (!ball.isAttached &&
                    ball.x + BALL_RADIUS >= paddle.x &&
                    ball.x - BALL_RADIUS <= paddle.x + currentPaddleWidth) {

                    // Resolve Penetration (Tunneling Fix)
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
                    ball.dx += collidePoint * 2;
                    playCardPlace();
                    shakeRef.current = 12;
                }
            };

            if (ball.y + BALL_RADIUS >= playerPaddleY && ball.y - BALL_RADIUS <= playerPaddleY + PADDLE_HEIGHT && ball.dy > 0) {
                handlePaddleCollision(playerPaddle, playerPaddleY, true, playerPaddleWidth);
            }
            if (gameMode === 'AI' && ball.y - BALL_RADIUS <= aiPaddleY + PADDLE_HEIGHT && ball.y + BALL_RADIUS >= aiPaddleY && ball.dy < 0) {
                handlePaddleCollision(aiPaddle, aiPaddleY, false, PADDLE_WIDTH);
            }
        });

        // Update AI state
        updateAI();

        ctx.restore();
        requestRef.current = requestAnimationFrame(update);
    }, [gameState, gameMode, playerPaddleWidth, aiPaddleWidth, lives, aiDifficulty, selectedDifficulty, launchBall, playCardDraw, playCardFlip, playCardPlace, playError, playVictory, scorePlayer, scoreAI, updateAI]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
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
            ballsRef.current.forEach(ball => {
                // Add two more balls with slightly different angles
                for (let i = 0; i < 2; i++) {
                    newBalls.push({
                        ...ball,
                        dx: ball.dx + (Math.random() - 0.5) * 4,
                        dy: -Math.abs(ball.dy),
                        speed: ball.speed,
                        isSuperCharged: ball.isSuperCharged
                    });
                }
            });
            ballsRef.current = [...ballsRef.current, ...newBalls];
            ballsRef.current = [...ballsRef.current, ...newBalls];
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

            // Auto fire logic
            if (laserTimerRef.current) clearInterval(laserTimerRef.current);
            laserTimerRef.current = setInterval(() => {
                const paddleX = playerPaddleRef.current.x;
                // Add 2 projectiles
                projectilesRef.current.push(
                    { x: paddleX + 10, y: height - 40, width: 4, height: 12, dy: -8, color: '#f00' },
                    { x: paddleX + playerPaddleWidth - 14, y: height - 40, width: 4, height: 12, dy: -8, color: '#f00' }
                );
                playCardDraw(); // Pew pew sound
            }, 400);

            setTimeout(() => {
                setLaserActive(false);
                if (laserTimerRef.current) clearInterval(laserTimerRef.current);
            }, 8000); // 8 seconds of laser
        }

        setPlayerBonus(null);
        // Release lock after short delay to prevent double submissions but allow next bonus
        setTimeout(() => { bonusLockRef.current = false; }, 500);
    };

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
            ballsRef.current.forEach(ball => {
                for (let i = 0; i < 2; i++) {
                    newBalls.push({
                        ...ball,
                        dx: ball.dx + (Math.random() - 0.5) * 4,
                        dy: -Math.abs(ball.dy), // Shoot downwards for AI? No, keep existing momentum direction but slight angle
                        speed: ball.speed,
                        isSuperCharged: ball.isSuperCharged
                    });
                }
            });
            // Cap max balls to prevent freeze
            if (ballsRef.current.length + newBalls.length < 50) {
                ballsRef.current = [...ballsRef.current, ...newBalls];
            }
        }
        setAiBonusAvailable(null);
    };

    const cycleTheme = () => {
        playClick();
        const themeIds = Object.keys(THEMES);
        const currentIndex = themeIds.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeIds.length;
        setTheme(themeIds[nextIndex]);
    };

    const startSolo = () => {
        playClick();
        setGameMode('BRICKS');
        setLives(3);
        initGame();
        setGameState('PLAYING');
    };

    const startAI = () => {
        playClick();
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
                                {gameMode === 'BRICKS' ? 'VIES' : 'IA SYSTEM'}
                            </span>
                            <span className="text-2xl font-black text-white tabular-nums">
                                {gameMode === 'BRICKS'
                                    ? lives
                                    : (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT - scorePlayer)}
                            </span>
                        </div>

                        {/* Quit Button Integrated in Center */}
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => setShowQuitConfirm(true)}
                                className="w-9 h-9 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center transition-all active:scale-95 group"
                            >
                                <X className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-tighter">
                                {gameMode === 'BRICKS' ? 'SCORE' : 'PLAYER'}
                            </span>
                            <span className="text-2xl font-black text-white tabular-nums">
                                {gameMode === 'BRICKS' ? scorePlayer : (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT - scoreAI)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Area */}
            <div className="flex-1 relative w-full px-1 pb-1">
                <div className="absolute inset-0 overflow-hidden rounded-3xl bg-slate-900 shadow-[inset_0_0_100px_rgba(0,242,255,0.05)] border border-white/5">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full touch-none cursor-none block"
                    />

                    {/* Menu Overlay - Premium Design */}
                    <AnimatePresence>
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
                                                <Card className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>

                                        {/* VERSUS SECTION */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modes Versus</span>
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
                                                    onClick={onStartOnline}
                                                    className="relative h-20 bg-slate-900/40 border border-white/10 rounded-2xl p-3 flex flex-col justify-center items-center gap-1 group overflow-hidden transition-all hover:border-white/30 hover:bg-white/5 active:scale-95"
                                                >
                                                    <Users className="w-5 h-5 text-slate-400 group-hover:text-white mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-black text-slate-300 group-hover:text-white">ONLINE</span>
                                                </button>
                                            </div>
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
                            <div className="absolute bottom-6 left-6 flex flex-col items-center z-[70]">
                                <motion.button
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

