import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, X, ShieldAlert, Cpu, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import ConfirmModal from './ui/ConfirmModal';
import { useFeedback } from '../hooks/useFeedback';

// Constants
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 16;
const BALL_RADIUS = 8;
const BRICK_ROW_COUNT = 3;
const BRICK_COLUMN_COUNT = 8; // Fewer columns for better mobile fit
const BRICK_PADDING = 8;
const INITIAL_BALL_SPEED = 4;
const MAX_BALL_SPEED = 8;

// Colors
const PLAYER_COLOR = '#3b82f6'; // Blue-500
const AI_COLOR = '#ef4444'; // Red-500
const BONUS_COLOR = '#f59e0b'; // Amber-500 (Gold)
const BONUS_CHANCE = 0.15; // 15% chance

export default function VersusBreakout({ onBackToMenu, aiDifficulty = 'NORMAL' }) {
    const canvasRef = useRef(null);
    const requestRef = useRef();

    // Game State
    const [scorePlayer, setScorePlayer] = useState(0);
    const [scoreAI, setScoreAI] = useState(0); // Score = destroyed bricks of opponent
    const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAME_OVER, VICTORY
    const [winner, setWinner] = useState(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    // Bonus State
    const [playerBonusAvailable, setPlayerBonusAvailable] = useState(false);
    const [aiBonusAvailable, setAiBonusAvailable] = useState(false);

    const { playClick, playError, playVictory, playCardPlace, playCardFlip, playCardDraw } = useFeedback();

    // Game Objects Refs
    const ballRef = useRef({ x: 0, y: 0, dx: 0, dy: 0, speed: INITIAL_BALL_SPEED });
    const playerPaddleRef = useRef({ x: 0 }); // Bottom
    const aiPaddleRef = useRef({ x: 0 }); // Top
    const playerBricksRef = useRef([]); // Bottom defense
    const aiBricksRef = useRef([]); // Top defense
    const canvasSizeRef = useRef({ width: 0, height: 0 });

    // AI State
    const aiTargetXRef = useRef(0);

    // Initialize Game
    const initGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.width;
        const height = canvas.height;

        // Paddles
        playerPaddleRef.current = { x: (width - PADDLE_WIDTH) / 2 };
        aiPaddleRef.current = { x: (width - PADDLE_WIDTH) / 2 };

        // Ball (Starts in middle)
        ballRef.current = {
            x: width / 2,
            y: height / 2,
            dx: 0,
            dy: 0,
            speed: INITIAL_BALL_SPEED,
            isSuperCharged: false
        };
        // Random Launch
        launchBall();

        // Bricks Generation
        // AI Bricks (Top Defense)
        // Player Bricks (Bottom Defense)

        const brickWidth = (width - ((BRICK_COLUMN_COUNT + 1) * BRICK_PADDING)) / BRICK_COLUMN_COUNT;

        const createBricks = (isTop) => {
            const bricks = [];
            // Wall Defense Mode: Bricks are at the very edges (Behind paddles)
            // Top Bricks (AI Wall): Start near 0
            // Bottom Bricks (Player Wall): Start near Bottom

            const brickTotalHeight = BRICK_ROW_COUNT * (20 + BRICK_PADDING);

            const startY = isTop
                ? 10 // Top Edge
                : height - 10 - brickTotalHeight; // Bottom Edge

            for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
                bricks[c] = [];
                for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                    bricks[c][r] = {
                        x: (c * (brickWidth + BRICK_PADDING)) + BRICK_PADDING,
                        y: startY + (r * (20 + BRICK_PADDING)),
                        status: 1,
                        isBonus: Math.random() < BONUS_CHANCE
                    };
                }
            }
            return bricks;
        };

        aiBricksRef.current = createBricks(true);
        playerBricksRef.current = createBricks(false);
        canvasSizeRef.current = { width, height, brickWidth };

        setScorePlayer(0);
        setScoreAI(0);
        setPlayerBonusAvailable(false);
        setAiBonusAvailable(false);
        setWinner(null);

    }, []);

    const launchBall = () => {
        const angle = (Math.random() * Math.PI / 2) - (Math.PI / 4); // -45 to 45 degrees
        const direction = Math.random() > 0.5 ? 1 : -1; // Up or Down

        ballRef.current.dx = INITIAL_BALL_SPEED * Math.sin(angle);
        ballRef.current.dy = INITIAL_BALL_SPEED * Math.cos(angle) * direction;
        ballRef.current.speed = INITIAL_BALL_SPEED;
        ballRef.current.isSuperCharged = false;
    };

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            const container = canvas?.parentElement;
            if (canvas && container) {
                canvas.width = container.clientWidth;
                // Match the container's height exactly to avoid 
                // stretching/squashing or bottom gaps (logic vs visual mismatch)
                canvas.height = container.clientHeight;

                // Update Render Ref
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

    // Input Handling (Mouse/Touch)
    useEffect(() => {
        const handleMove = (clientX) => {
            if (gameState !== 'PLAYING') return;
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const relativeX = clientX - rect.left;

            if (relativeX > 0 && relativeX < canvas.width) {
                playerPaddleRef.current.x = relativeX - PADDLE_WIDTH / 2;
                // Clamp
                if (playerPaddleRef.current.x < 0) playerPaddleRef.current.x = 0;
                if (playerPaddleRef.current.x + PADDLE_WIDTH > canvas.width) playerPaddleRef.current.x = canvas.width - PADDLE_WIDTH;
            }
        };

        const onMouseMove = (e) => handleMove(e.clientX);
        const onTouchMove = (e) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('touchmove', onTouchMove);
        };
    }, [gameState]);

    // AI Logic
    const updateAI = useCallback(() => {
        const ball = ballRef.current;
        const aiPaddle = aiPaddleRef.current;
        const width = canvasSizeRef.current.width;

        // Simple Target Tracking with error/delay based on difficulty
        // Only move if ball is moving towards AI (dy < 0) OR if it's protecting
        let targetX = ball.x - PADDLE_WIDTH / 2;

        // Add some "human" delay/error
        let reactionSpeed = 0.08; // Normal default
        if (aiDifficulty === 'EASY') reactionSpeed = 0.05;
        if (aiDifficulty === 'HARD') reactionSpeed = 0.15;

        const dx = targetX - aiPaddle.x;
        aiPaddle.x += dx * reactionSpeed;

        // Clamp
        if (aiPaddle.x < 0) aiPaddle.x = 0;
        if (aiPaddle.x + PADDLE_WIDTH > width) aiPaddle.x = width - PADDLE_WIDTH;

    }, [aiDifficulty]);

    // Game Loop
    const update = useCallback(() => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const { width, height, brickWidth } = canvasSizeRef.current;
        const playerPaddle = playerPaddleRef.current;
        const aiPaddle = aiPaddleRef.current;
        const ball = ballRef.current;
        const brickHeight = 20;

        // Calculated Visual Positions
        const playerPaddleY = height - 130;
        const aiPaddleY = 130 - PADDLE_HEIGHT;

        // Clear
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, width, height); // Slight trail for effect? Maybe simpler clear for performance

        // --- DRAW ---

        // Center Line
        ctx.beginPath();
        ctx.setLineDash([10, 10]);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.closePath();

        // Draw Player Paddle (Bottom - Now ABOVE the wall)
        // Wall is at Bottom, so Paddle is slightly higher up


        ctx.fillStyle = PLAYER_COLOR;
        ctx.shadowColor = PLAYER_COLOR;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(playerPaddle.x, playerPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT, 8);
        ctx.fill();
        ctx.closePath();

        // Draw AI Paddle (Top - Now BELOW the wall)
        // Wall is at Top, so Paddle is slightly lower down


        ctx.fillStyle = AI_COLOR;
        ctx.shadowColor = AI_COLOR;
        ctx.beginPath();
        ctx.roundRect(aiPaddle.x, aiPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT, 8);
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;

        // Draw Bricks Function (Solar Glass Style)
        const drawBricks = (bricks, baseColor, isAi) => {
            let activeCount = 0;
            bricks.forEach((col) => {
                col.forEach((b) => {
                    if (b.status === 1) {
                        activeCount++;

                        // Style Definition
                        const isRed = baseColor === AI_COLOR;
                        const isBonus = b.isBonus;

                        let gradientStart, gradientEnd;

                        if (isBonus) {
                            gradientStart = '#fcd34d'; // Amber-300
                            gradientEnd = '#b45309'; // Amber-700
                        } else {
                            gradientStart = isRed ? '#ef4444' : '#3b82f6';
                            gradientEnd = isRed ? '#7f1d1d' : '#1e3a8a';
                        }

                        // Gradient Fill
                        const gradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + brickHeight);
                        gradient.addColorStop(0, gradientStart);
                        gradient.addColorStop(1, gradientEnd);

                        ctx.beginPath();
                        ctx.roundRect(b.x, b.y, brickWidth, brickHeight, 4);
                        ctx.fillStyle = gradient;
                        // Glass Glow Effect
                        ctx.shadowColor = baseColor;
                        ctx.shadowBlur = 15;
                        ctx.fill();

                        // Glass Border (Inner Light)
                        ctx.strokeStyle = "rgba(255,255,255,0.3)";
                        ctx.lineWidth = 1;
                        ctx.stroke();

                        ctx.shadowBlur = 0; // Reset shadow
                        ctx.closePath();

                        // Shine/Reflection (Top half)
                        ctx.beginPath();
                        ctx.roundRect(b.x, b.y, brickWidth, brickHeight / 2, { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 });
                        ctx.fillStyle = "rgba(255,255,255,0.1)";
                        ctx.fill();
                        ctx.closePath();

                        // Collision Ball vs Brick
                        if (b.status === 1 &&
                            ball.x > b.x && ball.x < b.x + brickWidth &&
                            ball.y > b.y && ball.y < b.y + brickHeight) {

                            // Normal Bounce unless Super Charged
                            if (!ball.isSuperCharged) {
                                ball.dy = -ball.dy;
                            }
                            b.status = 0;
                            playCardDraw(); // Hit sound

                            // Check Bonus
                            if (b.isBonus) {
                                if (isAi) {
                                    setPlayerBonusAvailable(true);
                                } else {
                                    setAiBonusAvailable(true);
                                }
                            }

                            return true; // Collision handled
                        }
                    }
                });
            });
            return activeCount;
        };

        // AI DEFENSE (Top Bricks)
        const activeAiBricks = drawBricks(aiBricksRef.current, AI_COLOR, true);
        if (activeAiBricks < (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - scorePlayer) {
            setScorePlayer((BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - activeAiBricks);
        }

        // PLAYER DEFENSE (Bottom Bricks)
        const activePlayerBricks = drawBricks(playerBricksRef.current, PLAYER_COLOR, false);
        if (activePlayerBricks < (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - scoreAI) {
            setScoreAI((BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - activePlayerBricks);
        }

        // Check Win Condition
        if (activeAiBricks === 0) {
            setWinner('PLAYER');
            setGameState('VICTORY');
            playVictory();
            return;
        }
        if (activePlayerBricks === 0) {
            setWinner('AI');
            setGameState('GAME_OVER');
            playError();
            return;
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);

        if (ball.isSuperCharged) {
            ctx.fillStyle = "#fbbf24"; // Amber-400
            ctx.shadowColor = "#f59e0b";
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 8;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();

        // --- UPDATE PHYSICS ---

        updateAI();

        ball.x += ball.dx;
        ball.y += ball.dy;

        // Walls (Left/Right)
        if (ball.x + ball.dx > width - BALL_RADIUS || ball.x + ball.dx < BALL_RADIUS) {
            ball.dx = -ball.dx;
            playCardFlip();
        }

        // Top/Bottom Walls (Goals/Resets)
        // If ball goes past paddles without hitting them?
        // Let's make it bounce off top/bottom walls BUT if it hits the "Zone" behind bricks it resets?
        // Actually, normally in Arkanoid VS, you lose a life if ball passes you. 
        // Here we have bricks to protect. So ball should bounce off top/bottom of screen if bricks are gone? 
        // Or ball passes through and resets? 
        // Let's implement: bounces off top/bottom screen edges to keep ball in play until bricks are hit?
        // NO, simpler: Bounces off Top/Bottom walls. The Bricks are the "Lives". 

        if (ball.y + ball.dy > height - BALL_RADIUS) {
            ball.dy = -ball.dy;
            playCardFlip();
        }
        if (ball.y + ball.dy < BALL_RADIUS) {
            ball.dy = -ball.dy;
            playCardFlip();
        }

        // Paddle Collisions
        // Player Paddle (Bottom)
        // Visual Y: height - 130


        if (ball.y + BALL_RADIUS >= playerPaddleY &&
            ball.y - BALL_RADIUS <= playerPaddleY + PADDLE_HEIGHT &&
            ball.dy > 0) {

            if (ball.x >= playerPaddle.x && ball.x <= playerPaddle.x + PADDLE_WIDTH) {
                // Return ball
                let collidePoint = ball.x - (playerPaddle.x + PADDLE_WIDTH / 2);
                collidePoint = collidePoint / (PADDLE_WIDTH / 2);
                let angle = collidePoint * (Math.PI / 3);
                let speed = Math.min(ball.speed * 1.05, MAX_BALL_SPEED);
                ball.speed = speed;

                ball.dx = speed * Math.sin(angle);
                ball.dy = -speed * Math.cos(angle);
                playCardPlace();
            }
        }

        // AI Paddle (Top)
        // Visual Y: 130 - PADDLE_HEIGHT


        if (ball.y - BALL_RADIUS <= aiPaddleY + PADDLE_HEIGHT &&
            ball.y + BALL_RADIUS >= aiPaddleY &&
            ball.dy < 0) {

            if (ball.x >= aiPaddle.x && ball.x <= aiPaddle.x + PADDLE_WIDTH) {
                // Return ball
                let collidePoint = ball.x - (aiPaddle.x + PADDLE_WIDTH / 2);
                collidePoint = collidePoint / (PADDLE_WIDTH / 2);
                let angle = collidePoint * (Math.PI / 3);
                let speed = Math.min(ball.speed * 1.05, MAX_BALL_SPEED);
                ball.speed = speed;

                ball.dx = speed * Math.sin(angle);
                ball.dy = Math.abs(speed * Math.cos(angle)); // Ensure goes down
                playCardPlace();
            }
        }


        requestRef.current = requestAnimationFrame(update);
    }, [gameState, aiDifficulty, playCardDraw, playCardFlip, playCardPlace, playError, playVictory, scorePlayer, scoreAI, updateAI]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, [update]);

    const activateBonus = () => {
        if (playerBonusAvailable) {
            playCardPlace(); // Sound
            ballRef.current.isSuperCharged = true;
            ballRef.current.speed = MAX_BALL_SPEED * 1.5; // BOOST SPEED
            console.log("BOOM! Super Charge Activated!");
            setPlayerBonusAvailable(false);
        }
    };

    const startGame = () => {
        playClick();
        initGame();
        setGameState('PLAYING');
    };

    return (
        <div className="flex flex-col w-full max-w-lg mx-auto h-[100dvh] overflow-hidden bg-slate-900">
            {/* Scores Header (Fixed Height) */}
            <div className="flex-none p-4 z-10">
                <div className="flex items-center justify-between w-full px-6 py-2 bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl shadow-lg">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">IA</span>
                        <span className="text-xl font-black text-white">{BRICK_COLUMN_COUNT * BRICK_ROW_COUNT - scorePlayer}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-500/50">VS</div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">JOUEUR</span>
                        <span className="text-xl font-black text-white">{BRICK_COLUMN_COUNT * BRICK_ROW_COUNT - scoreAI}</span>
                    </div>
                </div>
            </div>

            {/* Game Area (Fills remaining space) */}
            <div className="flex-1 relative w-full min-h-0">
                <div className="absolute inset-0 overflow-hidden rounded-3xl mx-2 bg-slate-900/50 border border-white/5 shadow-2xl">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full touch-none cursor-none block"
                        style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}
                    />

                    {/* Menu Overlay (Inside Relative Container) */}
                    <AnimatePresence>
                        {gameState === 'MENU' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20"
                            >
                                <ShieldAlert className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
                                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-400 mb-2 drop-shadow-lg text-center">
                                    DEFENSE DE MUR
                                </h1>
                                <Button
                                    onClick={startGame}
                                    className="h-12 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20"
                                >
                                    <Play className="w-5 h-5 mr-2" fill="currentColor" />
                                    JOUER
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onBackToMenu}
                                    className="mt-4 text-slate-400 hover:text-white"
                                >
                                    Retour
                                </Button>
                            </motion.div>
                        )}

                        {/* Victory/Game Over Overlays... */}
                        {gameState === 'VICTORY' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/90 backdrop-blur-md z-30"
                            >
                                <Trophy className="w-16 h-16 text-yellow-400 mb-2 animate-bounce" />
                                <h2 className="text-3xl font-black text-white mb-1">VICTOIRE !</h2>
                                <div className="flex gap-3 mt-6">
                                    <Button onClick={onBackToMenu} variant="outline" className="border-white/20 text-white">Quitter</Button>
                                    <Button onClick={startGame} className="bg-white text-emerald-900 font-bold">Rejouer</Button>
                                </div>
                            </motion.div>
                        )}

                        {gameState === 'GAME_OVER' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md z-30"
                            >
                                <Cpu className="w-16 h-16 text-red-500 mb-2" />
                                <h2 className="text-3xl font-black text-white mb-1">DÉFAITE...</h2>
                                <div className="flex gap-3 mt-6">
                                    <Button onClick={onBackToMenu} variant="outline" className="border-white/20 text-white">Quitter</Button>
                                    <Button onClick={startGame} className="bg-red-600 text-white font-bold">Revanche</Button>
                                </div>
                            </motion.div>
                        )}

                        {/* BONUS BUTTON (Inside Game Area) */}
                        {playerBonusAvailable && gameState === 'PLAYING' && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={activateBonus}
                                className="absolute bottom-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.6)] border-4 border-white/50 flex items-center justify-center z-40 animate-pulse cursor-pointer"
                            >
                                <Zap className="w-8 h-8 text-white drop-shadow-md" fill="currentColor" />
                            </motion.button>
                        )}

                        {/* Quit Confirmation (Overlay) */}
                        <ConfirmModal
                            isOpen={showQuitConfirm}
                            onClose={() => setShowQuitConfirm(false)}
                            onConfirm={onBackToMenu}
                            title="Quitter ?"
                            message="La progression sera perdue."
                            confirmText="Oui, quitter"
                            variant="danger"
                        />
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer / Controls (Fixed Height) */}
            <div className="flex-none p-4 flex justify-center z-10">
                <Button
                    onClick={() => setShowQuitConfirm(true)}
                    className="h-10 px-6 bg-slate-800/80 hover:bg-red-900/40 border border-white/5 text-slate-400 hover:text-red-400 rounded-full text-xs font-bold tracking-widest backdrop-blur transition-all"
                >
                    ABANDONNER
                </Button>
            </div>
        </div>
    );
}
