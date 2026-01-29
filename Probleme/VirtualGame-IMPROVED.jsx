// VirtualGame.jsx - PARTIE CONCERNÉE (snippets)

const VirtualGame = () => {
  const [screen, setScreen] = useState('lobby'); // 'lobby' ou 'game'
  
  const activeState = useOnlineGameStore(state => state.activeState);
  const onlineStarted = useOnlineGameStore(state => state.onlineStarted);
  const profile = useProfileStore(state => state.profile);

  // ... autres states ...

  useEffect(() => {
    console.log('[VG] Component MOUNTED');
    return () => {
      console.log('[VG] Component UNMOUNTED');
    };
  }, []);

  // 🔥 EFFET AMÉLIORÉ : Auto-navigation vers l'écran de jeu
  useEffect(() => {
    const hasActiveState = activeState && Object.keys(activeState).length > 0;
    const gameIsStarted = activeState?.started === true;
    
    console.log('[VG] Auto-nav check:', {
      onlineStarted,
      hasActiveState,
      gameIsStarted,
      currentScreen: screen,
      roomId: activeState?.roomId
    });

    // 🔥 Transition lobby → game quand le jeu démarre
    if (onlineStarted && hasActiveState && gameIsStarted && screen === 'lobby') {
      console.log('[VG] ✅ Transitioning to game screen!');
      setScreen('game');
    }
    
    // 🔥 Retour au lobby quand le jeu se termine
    if (!onlineStarted && screen === 'game') {
      console.log('[VG] ⬅️ Game ended, returning to lobby');
      setScreen('lobby');
    }
    
    // 🔥 Si on est dans le lobby mais qu'il n'y a pas de room active, reset
    if (screen === 'lobby' && !hasActiveState && !activeState?.roomId) {
      console.log('[VG] 🔄 No active room, ensuring lobby screen');
      // On est déjà sur lobby, rien à faire
    }
  }, [onlineStarted, activeState, screen]);

  // 🔥 FONCTION : Retour au menu (appelée par un bouton dans le jeu)
  const onBackToMenu = () => {
    console.log('[VG] 🔙 User requested back to menu');
    // Ne pas appeler directement setScreen('lobby') ici
    // Laisser le store gérer ça via leaveRoom()
    useOnlineGameStore.getState().leaveRoom();
  };

  console.log('[VG] Rendering...', {
    screen,
    initialScreen,
    onlineStarted,
    hasActiveState: !!activeState,
    gameStarted: activeState?.started
  });

  // 🔥 RENDU CONDITIONNEL
  return (
    <div className="virtual-game-container">
      {screen === 'lobby' && (
        <LobbyScreen 
          /* props */
        />
      )}
      
      {screen === 'game' && (
        <GameScreen 
          onBackToMenu={onBackToMenu}
          /* autres props */
        />
      )}
    </div>
  );
};

export default VirtualGame;
