// Dashboard.jsx - VERSION FIXÉE
import { useState, useEffect } from 'react';
import { useOnlineGameStore } from '../stores/onlineGameStore';
import Home from './Home';
import Stats from './Stats';
import VirtualGame from './VirtualGame';
import Settings from './Settings';
import BottomNav from './BottomNav';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  
  // 🔥 États du jeu en ligne depuis le store
  const onlineStarted = useOnlineGameStore(state => state.onlineStarted);
  const activeState = useOnlineGameStore(state => state.activeState);
  const leaveRoom = useOnlineGameStore(state => state.leaveRoom);

  // 🔥 Déterminer si le jeu est actif
  const isGameInProgress = onlineStarted && activeState?.started === true;
  const isInLobby = activeState?.roomId && !activeState?.started;
  const isInOnlineSession = isGameInProgress || isInLobby;

  // 🔥 Tab effective : force 'virtual' pendant toute la session en ligne
  const effectiveTab = isInOnlineSession ? 'virtual' : activeTab;

  // Logs de debug
  useEffect(() => {
    console.log('[DASH] Dashboard MOUNTED');
    return () => {
      console.log('[DASH] Dashboard UNMOUNTED');
    };
  }, []);

  useEffect(() => {
    console.log('[DASH] ActiveTab set to:', activeTab);
    console.log('[DASH] EffectiveTab is:', effectiveTab);
    console.log('[DASH] Game state:', { 
      isGameInProgress, 
      isInLobby, 
      isInOnlineSession 
    });
  }, [activeTab, effectiveTab, isGameInProgress, isInLobby, isInOnlineSession]);

  // 🔥 Handler pour quitter le jeu
  const handleQuitGame = () => {
    const confirmQuit = window.confirm(
      'Êtes-vous sûr de vouloir quitter la partie en cours ?'
    );
    
    if (confirmQuit) {
      leaveRoom(); // Appelle la méthode du store pour quitter proprement
      setActiveTab('home'); // Retour à l'accueil
    }
  };

  // 🔥 Fonction de rendu du contenu
  const renderContent = () => {
    switch (effectiveTab) {
      case 'home':
        return <Home />;
      case 'stats':
        return <Stats />;
      case 'virtual':
        return <VirtualGame />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* 🔥 Bouton Quitter visible pendant le jeu */}
      {isGameInProgress && (
        <button 
          className="quit-game-btn"
          onClick={handleQuitGame}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 9999,
            padding: '8px 16px',
            background: 'rgba(255, 59, 48, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          🚪 Quitter
        </button>
      )}

      {/* 🔥 Contenu principal */}
      <div className="dashboard-content">
        {renderContent()}
      </div>

      {/* 🔥 Navigation en bas - CACHÉE pendant le jeu */}
      {!isInOnlineSession && (
        <BottomNav 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      
      {/* 🔥 Indicateur de session en ligne (optionnel) */}
      {isInOnlineSession && (
        <div 
          className="online-session-indicator"
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'rgba(52, 199, 89, 0.9)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
          }}
        >
          🟢 {isGameInProgress ? 'Partie en ligne' : 'En attente...'}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
