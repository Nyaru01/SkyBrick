Guide : Créer un Casse-Brique Mobile en React
Voici comment transformer votre base existante en un casse-brique optimisé mobile :
🎯 Architecture Recommandée
Basé sur votre stack Skyjo, je recommande :
javascript// Structure de store Zustand pour le casse-brique
const useBrickStore = create((set, get) => ({
  // État du jeu
  paddle: { x: 150, width: 80, height: 12 },
  ball: { x: 200, y: 300, vx: 3, vy: -4, radius: 8 },
  bricks: [], // [{x, y, width, height, hits, color}]
  score: 0,
  lives: 3,
  gameState: 'menu', // 'menu' | 'playing' | 'paused' | 'gameover'
  
  // Actions
  movePaddle: (x) => set({ paddle: { ...get().paddle, x } }),
  updateBall: () => { /* physique */ },
  // ...
}));
📱 Contrôles Tactiles (Mobile-First)
jsx// Hook pour gérer le touch
const useTouchControls = (canvasRef, paddleWidth) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouch = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left - paddleWidth / 2;
      
      // Contrainte dans les limites du canvas
      const clampedX = Math.max(0, Math.min(x, canvas.width - paddleWidth));
      movePaddle(clampedX);
    };

    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchstart', handleTouch, { passive: false });

    return () => {
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [canvasRef, paddleWidth]);
};
🎨 Rendu Canvas avec Effets Visuels
jsxconst BrickGame = () => {
  const canvasRef = useRef(null);
  const { paddle, ball, bricks, updateGame } = useBrickStore();

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      // Clear avec effet de traînée (trail)
      ctx.fillStyle = 'rgba(10, 10, 30, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dessiner la raquette (glassmorphism)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffff';
      ctx.fillRect(paddle.x, canvas.height - 40, paddle.width, paddle.height);

      // Dessiner la balle avec glow
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ff00ff';
      ctx.shadowBlur = 20;
      ctx.fill();

      // Dessiner les briques
      bricks.forEach(brick => {
        const gradient = ctx.createLinearGradient(
          brick.x, brick.y, brick.x, brick.y + brick.height
        );
        gradient.addColorStop(0, brick.color);
        gradient.addColorStop(1, adjustBrightness(brick.color, -20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      });

      updateGame(); // Mise à jour physique
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={640}
      className="touch-none" // Empêcher le scroll
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    />
  );
};
⚙️ Physique & Collisions
javascript// Dans votre store
updateGame: () => {
  const { ball, paddle, bricks, lives } = get();
  
  // Mouvement
  let newX = ball.x + ball.vx;
  let newY = ball.y + ball.vy;
  let newVX = ball.vx;
  let newVY = ball.vy;

  // Collisions murs
  if (newX - ball.radius < 0 || newX + ball.radius > 360) {
    newVX = -newVX;
    playSound('wall'); // Intégrer votre système audio
  }
  if (newY - ball.radius < 0) {
    newVY = -newVY;
    playSound('wall');
  }

  // Collision raquette
  if (
    newY + ball.radius > 640 - 40 &&
    newX > paddle.x &&
    newX < paddle.x + paddle.width
  ) {
    newVY = -Math.abs(newVY);
    // Effet de spin basé sur où la balle touche la raquette
    const hitPos = (newX - paddle.x) / paddle.width - 0.5;
    newVX += hitPos * 2;
    playSound('paddle');
  }

  // Collision briques
  const newBricks = bricks.filter(brick => {
    if (
      newX > brick.x &&
      newX < brick.x + brick.width &&
      newY > brick.y &&
      newY < brick.y + brick.height
    ) {
      newVY = -newVY;
      playSound('brick');
      addScore(10);
      addParticles(brick.x, brick.y, brick.color); // Effet visuel
      return brick.hits > 1; // Brique détruite ou pas
    }
    return true;
  });

  // Balle perdue
  if (newY > 650) {
    set({ lives: lives - 1 });
    resetBall();
    if (lives <= 1) set({ gameState: 'gameover' });
    return;
  }

  set({
    ball: { ...ball, x: newX, y: newY, vx: newVX, vy: newVY },
    bricks: newBricks
  });
}
🎨 Intégration Style Skyjo (Glassmorphism)
jsxconst GameUI = () => (
  <div className="fixed inset-0 pointer-events-none">
    {/* Header Score (comme votre Pill) */}
    <div className="absolute top-4 left-1/2 -translate-x-1/2 
                    bg-white/10 backdrop-blur-xl border border-white/20
                    rounded-full px-6 py-3 shadow-2xl">
      <div className="flex gap-6 text-white font-bold">
        <span>❤️ {lives}</span>
        <span>🎯 {score}</span>
      </div>
    </div>

    {/* Bouton Pause */}
    <button className="absolute top-4 right-4 pointer-events-auto
                       bg-purple-500/20 backdrop-blur-md p-3 rounded-full">
      <Pause className="w-6 h-6 text-white" />
    </button>
  </div>
);
🚀 Optimisations Mobile
javascript// Dans votre composant principal
useEffect(() => {
  // Empêcher le zoom sur double-tap
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Empêcher le pull-to-refresh
  document.body.style.overscrollBehavior = 'none';

  // Forcer l'orientation portrait
  if (screen.orientation?.lock) {
    screen.orientation.lock('portrait').catch(() => {});
  }
}, []);
💡 Fonctionnalités Premium à Ajouter
Inspirées de votre architecture Skyjo :

Power-ups : Stocker dans le store comme vos cartes spéciales
Niveaux progressifs : Système similaire à votre XP/Niveau
Leaderboard : Réutiliser votre système Supabase
Skins de raquette : Déblocables par niveau (comme vos avatars)
Mode multijoueur : Adapter votre onlineGameStore pour un versus à 2 raquettes