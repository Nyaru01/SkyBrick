import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, X, ShieldAlert, Cpu } from 'lucide-react';
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
const INITIAL_BALL_SPEED = 6;
const MAX_BALL_SPEED = 12;

// Colors
const PLAYER_COLOR = '#3b82f6'; // Blue-500
const AI_COLOR = '#ef4444'; // Red-500

export default function VersusBreakout({ onBackToMenu, aiDifficulty = 'NORMAL' }) {
    const canvasRef = useRef(null);
    const requestRef = useRef();

    // Game State
    const [scorePlayer, setScorePlayer] = useState(0);
    const [scoreAI, setScoreAI] = useState(0); // Score = destroyed bricks of opponent
    const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAME_OVER, VICTORY
    const [winner, setWinner] = useState(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

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
            speed: INITIAL_BALL_SPEED
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
                        status: 1
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
        setWinner(null);

    }, []);

    const launchBall = () => {
        const angle = (Math.random() * Math.PI / 2) - (Math.PI / 4); // -45 to 45 degrees
        const direction = Math.random() > 0.5 ? 1 : -1; // Up or Down

        ballRef.current.dx = INITIAL_BALL_SPEED * Math.sin(angle);
        ballRef.current.dy = INITIAL_BALL_SPEED * Math.cos(angle) * direction;
        ballRef.current.speed = INITIAL_BALL_SPEED;
    };

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            const container = canvas?.parentElement;
            if (canvas && container) {
                canvas.width = container.clientWidth;
                // Optimized height: Balanced between game space and button visibility
                canvas.height = Math.min(800, window.innerHeight - 180);
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

        // Draw Bricks Function
        const drawBricks = (bricks, color) => {
            let activeCount = 0;
            bricks.forEach((col) => {
                col.forEach((b) => {
                    if (b.status === 1) {
                        activeCount++;
                        ctx.beginPath();
                        ctx.roundRect(b.x, b.y, brickWidth, brickHeight, 4);
                        ctx.fillStyle = color;
                        ctx.fill();
                        ctx.closePath();

                        // Collision Ball vs Brick
                        if (b.status === 1 &&
                            ball.x > b.x && ball.x < b.x + brickWidth &&
                            ball.y > b.y && ball.y < b.y + brickHeight) {
                            ball.dy = -ball.dy;
                            b.status = 0;
                            playCardDraw(); // Hit sound
                            return true; // Collision handled
                        }
                    }
                });
            });
            return activeCount;
        };

        // Draw Player Bricks (Bottom) - If hit, AI scores ? No, objective is to break enemy bricks?
        // Let's say: User defends Bottom Bricks. AI defends Top Bricks.
        // Destroying AI bricks -> Player Score increases. 
        // Destroying ALL enemy bricks -> WIN.

        // AI DEFENSE (Top Bricks)
        const activeAiBricks = drawBricks(aiBricksRef.current, AI_COLOR);
        if (activeAiBricks < (BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - scorePlayer) {
            setScorePlayer((BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) - activeAiBricks);
        }

        // PLAYER DEFENSE (Bottom Bricks)
        const activePlayerBricks = drawBricks(playerBricksRef.current, PLAYER_COLOR);
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
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 8;
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

    const startGame = () => {
        playClick();
        initGame();
        setGameState('PLAYING');
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto h-full space-y-4">
            {/* Scores Header */}
            <div className="flex items-center justify-between w-full px-8 py-2 bg-slate-900/50 rounded-2xl border border-white/10">
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">IA (Cible)</span>
                    <span className="text-2xl font-black text-white">{BRICK_COLUMN_COUNT * BRICK_ROW_COUNT - scorePlayer}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Joueur (Défense)</span>
                    <span className="text-2xl font-black text-white">{BRICK_COLUMN_COUNT * BRICK_ROW_COUNT - scoreAI}</span>
                </div>
            </div>

            {/* Game Area */}
            <Card className="relative w-full flex-1 min-h-[500px] overflow-hidden bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full touch-none cursor-none"
                    style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}
                />

                {/* Menu Overlay */}
                <AnimatePresence>
                    {gameState === 'MENU' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10"
                        >
                            <ShieldAlert className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-400 mb-2 drop-shadow-lg text-center">
                                DEFENSE DE MUR
                            </h1>
                            <p className="text-slate-300 mb-8 text-center max-w-xs text-sm">
                                Protégez votre mur de briques en bas. Détruisez le mur de l'IA en haut.
                            </p>

                            <Button
                                onClick={startGame}
                                className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20"
                            >
                                <Play className="w-6 h-6 mr-2" fill="currentColor" />
                                COMBATTRE
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

                    {gameState === 'VICTORY' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/90 backdrop-blur-md z-20"
                        >
                            <Trophy className="w-20 h-20 text-yellow-400 mb-4 animate-bounce" />
                            <h2 className="text-4xl font-black text-white mb-2">VICTOIRE !</h2>
                            <p className="text-emerald-200 mb-8">Vous avez détruit le mur de l'IA.</p>

                            <div className="flex gap-4">
                                <Button
                                    onClick={onBackToMenu}
                                    variant="outline"
                                    className="h-12 w-32 border-white/20 text-white hover:bg-white/10"
                                >
                                    Quitter
                                </Button>
                                <Button
                                    onClick={startGame}
                                    className="h-12 px-6 bg-white text-emerald-900 hover:bg-emerald-100 font-bold"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Rejouer
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'GAME_OVER' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md z-20"
                        >
                            <Cpu className="w-20 h-20 text-red-500 mb-4" />
                            <h2 className="text-4xl font-black text-white mb-2">DÉFAITE...</h2>
                            <p className="text-red-200 mb-8">L'IA a percé votre défense.</p>

                            <div className="flex gap-4">
                                <Button
                                    onClick={onBackToMenu}
                                    variant="outline"
                                    className="h-12 w-32 border-white/20 text-white hover:bg-white/10"
                                >
                                    Quitter
                                </Button>
                                <Button
                                    onClick={startGame}
                                    className="h-12 px-6 bg-red-600 text-white hover:bg-red-500 font-bold"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Revanche
                                </Button>
                            </div>
                        </motion.div>
                    )}


                    {/* Quit Confirmation */}
                    <ConfirmModal
                        isOpen={showQuitConfirm}
                        onClose={() => setShowQuitConfirm(false)}
                        onConfirm={onBackToMenu}
                        title="Abandonner la partie ?"
                        message="Êtes-vous sûr de vouloir quitter ? La progression sera perdue."
                        confirmText="Abandonner"
                        variant="danger"
                    />
                </AnimatePresence>
            </Card>

            <div className="flex justify-center pt-2 pb-6">
                <Button
                    onClick={() => setShowQuitConfirm(true)}
                    className="relative group h-12 px-8 bg-slate-900/40 hover:bg-red-950/20 border border-white/5 hover:border-red-500/30 rounded-full transition-all duration-500 backdrop-blur-md overflow-hidden shadow-lg"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-red-400 transition-colors">
                        <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Abandonner
                    </span>
                </Button>
            </div>
        </div>
    );
}
