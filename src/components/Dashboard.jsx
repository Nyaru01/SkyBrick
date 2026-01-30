import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Settings, Trophy, Sparkles, History, Undo2, BarChart3, Play, LogOut, CheckCircle2, Users, HelpCircle, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, selectPlayers, selectRounds, selectThreshold, selectGameStatus } from '../store/gameStore';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { useOnlineGameStore, socket } from '../store/onlineGameStore';
import { useFeedback } from '../hooks/useFeedback';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import ScoreInput from './ScoreInput';
import RoundHistory from './RoundHistory';
import GameOver from './GameOver';
import GameSetup from './GameSetup';
import GameHistory from './GameHistory';
import Stats from './Stats';
import VirtualGame from './VirtualGame';
import BottomNav from './Navbar';
import SettingsPage from './SettingsPage';
import ConfirmModal from './ui/ConfirmModal';
import SocialDashboard from './SocialMenu';
import Tutorial from './Tutorial';
import LevelUpCelebration from './LevelUpCelebration';
import Changelog from './Changelog';
import GameMenu from './GameMenu';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useSocialStore } from '../store/socialStore';
import { FeedbackModal } from './FeedbackModal';
import { AdminDashboard } from './AdminDashboard';
import ChatPopup from './ChatPopup';

// Variants d'animation pour les transitions de pages
const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

const pageTransition = {
    type: "tween",
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94]
};

export default function Dashboard() {
    const players = useGameStore(selectPlayers);
    const rounds = useGameStore(selectRounds);
    const threshold = useGameStore(selectThreshold);
    const gameStatus = useGameStore(selectGameStatus);
    const addRound = useGameStore(state => state.addRound);
    const resetGame = useGameStore(state => state.resetGame);
    const undoLastRound = useGameStore(state => state.undoLastRound);
    const level = useGameStore(state => state.level);
    const lastAcknowledgedLevel = useGameStore(state => state.lastAcknowledgedLevel);
    const acknowledgeLevelUp = useGameStore(state => state.acknowledgeLevelUp);
    const hasSeenTutorial = useGameStore(state => state.hasSeenTutorial);
    const setHasSeenTutorial = useGameStore(state => state.setHasSeenTutorial);
    const achievements = useGameStore(state => state.achievements);
    const syncProfileWithBackend = useGameStore(state => state.syncProfileWithBackend);
    const userProfile = useGameStore(state => state.userProfile);
    const playerLevel = useGameStore(state => state.level);
    const playerCardSkin = useGameStore(state => state.cardSkin);
    const setCardSkin = useGameStore(state => state.setCardSkin);
    const generateSkyId = useGameStore(state => state.generateSkyId);
    const runMigration = useGameStore(state => state.runMigration);
    const migratedToV2 = useGameStore(state => state.migratedToV2);
    const isFeedbackOpen = useGameStore(state => state.isFeedbackOpen);
    const setIsFeedbackOpen = useGameStore(state => state.setIsFeedbackOpen);
    const isAdminOpen = useGameStore(state => state.isAdminOpen);
    const setIsAdminOpen = useGameStore(state => state.setIsAdminOpen);
    const adminAuthToken = useGameStore(state => state.adminAuthToken);
    const setAdminAuthToken = useGameStore(state => state.setAdminAuthToken);

    const virtualGameState = useVirtualGameStore(state => state.gameState);

    // 🔥 États du jeu en ligne (Store synchro avec le plan de fix)
    const onlineGameStarted = useOnlineGameStore(state => state.gameStarted);
    const onlineStarted = useOnlineGameStore(state => state.onlineStarted);
    const activeState = useOnlineGameStore(state => state.activeState);
    const leaveRoom = useOnlineGameStore(state => state.leaveRoom);
    const roomCode = useOnlineGameStore(state => state.roomCode);

    const disconnectOnline = useOnlineGameStore(state => state.disconnect);
    const joinRoom = useOnlineGameStore(state => state.joinRoom);
    const setOnlinePlayerInfo = useOnlineGameStore(state => state.setPlayerInfo);

    const gameInvitation = useSocialStore(state => state.gameInvitation);
    const setGameInvitation = useSocialStore(state => state.setGameInvitation);
    const fetchFriends = useSocialStore(state => state.fetchFriends);
    const unreadCount = useSocialStore(state => Object.values(state.unreadMessages).reduce((a, b) => a + b, 0));
    const friends = useSocialStore(state => state.friends);
    const activeChatId = useSocialStore(state => state.activeChatId);
    const setActiveChatId = useSocialStore(state => state.setActiveChatId);
    const { playClick, playAchievement, playSocialNotify } = useFeedback();

    const [activeTab, setActiveTab] = useState('home');
    const [virtualScreen, setVirtualScreen] = useState('menu');
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    // 🔥 LOGIQUE DE VERROUILLAGE (Fix Plan)
    // On considère qu'on est en session si on a un code de room
    const isGameInProgress = !!onlineGameStarted && !!activeState;
    const isInLobby = !!roomCode && !onlineGameStarted;
    const isInOnlineSession = isGameInProgress || isInLobby;

    // 🔥 Tab effective : force 'virtual' pendant toute la session en ligne ou game local
    const effectiveTab = isInOnlineSession ? 'virtual' : activeTab;

    // Activer la musique uniquement pendant une partie (virtuelle ou comptage manuel)
    const isManualGameActive = gameStatus === 'PLAYING' && (effectiveTab === 'game' || effectiveTab === 'home');
    const isVirtualGameActive = effectiveTab === 'virtual' && (!!virtualGameState || onlineGameStarted);

    useBackgroundMusic(isManualGameActive);

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        variant: "danger"
    });

    useEffect(() => {
        if (!hasSeenTutorial) {
            setTimeout(() => {
                setIsTutorialOpen(true);
                setHasSeenTutorial(true);
            }, 0);
        }
    }, [hasSeenTutorial, setHasSeenTutorial]);

    useEffect(() => {
        if (!userProfile?.vibeId) {
            generateSkyId();
        }
        if (userProfile?.id) {
            syncProfileWithBackend(userProfile);
            fetchFriends(String(userProfile.id));
        }
    }, [userProfile?.id, userProfile?.vibeId, syncProfileWithBackend, fetchFriends, generateSkyId]);
    // Migration Local -> DB pour la V2
    useEffect(() => {
        if (!migratedToV2) {
            runMigration();
        }
    }, [syncProfileWithBackend, userProfile.vibeId, generateSkyId, migratedToV2, runMigration]);

    useEffect(() => {
        if (unreadCount > 0) {
            playSocialNotify();
        }
    }, [unreadCount, playSocialNotify]);

    useEffect(() => {
        if (achievements && achievements.length > 0) {
            playAchievement();
        }
    }, [achievements?.length, playAchievement]);

    // Debug logs pour le plan de fix
    useEffect(() => {
        if (isInOnlineSession) {
            console.log('🔍 [DASH] Online Session Active:', {
                isGameInProgress,
                isInLobby,
                roomCode,
                effectiveTab,
                activeTab
            });
        }
    }, [isInOnlineSession, isGameInProgress, isInLobby, roomCode, effectiveTab, activeTab]);

    // Listen for debug push logs
    useEffect(() => {
        const handleDebugLog = (log) => {
            if (log.type === 'error') {
                toast.error(`Push Error: ${log.message}`, { duration: 5000 });
            } else {
                toast.success(`Push Debug: ${log.message}`, { duration: 3000, icon: '📡' });
            }
        };

        socket.on('debug_push_log', handleDebugLog);

        return () => {
            socket.off('debug_push_log', handleDebugLog);
        };
    }, []);

    const handleQuitOnlineGame = () => {
        setConfirmConfig({
            isOpen: true,
            title: "Quitter la partie ?",
            message: "Es-tu sûr de vouloir quitter la session en ligne ?",
            variant: "danger",
            onConfirm: () => {
                leaveRoom();
                setActiveTab('home');
            }
        });
    };

    // Presence is now handled in SocketProvider - no duplicate logic here

    useEffect(() => {
        console.log("[DASH] Dashboard MOUNTED");
        return () => {
            console.log("[DASH] Dashboard UNMOUNTED");
        };
    }, []);

    useEffect(() => {
        console.log(`[DASH] ActiveTab set to: ${activeTab}, effectiveTab: ${effectiveTab}`);
    }, [activeTab, effectiveTab]);

    // Auto-switch to 'game' tab when the game starts (but NOT if we are in virtual mode)
    useEffect(() => {
        if (gameStatus === 'PLAYING' && activeTab !== 'virtual' && !isInOnlineSession) {
            console.log("[DASH] gameStatus is PLAYING and not in virtual tab, auto-switching to 'game' tab");
            setTimeout(() => setActiveTab('game'), 0);
        }
    }, [gameStatus, activeTab, isInOnlineSession]);

    // Reset scroll when switching tabs
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    // Calculate totals
    const playerTotals = players.map(p => ({
        ...p,
        score: rounds.reduce((sum, r) => sum + (r.scores[p.id] || 0), 0)
    })).sort((a, b) => a.score - b.score);

    const leadingPlayer = playerTotals[0];

    const renderContent = () => {
        switch (effectiveTab) {
            case 'home':
                if (gameStatus === 'SETUP') {
                    return (
                        <motion.div
                            key="setup"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                            className="flex flex-col items-center justify-center min-h-[60vh]"
                        >
                            <GameSetup
                                onNavigate={setActiveTab}
                                onOpenTutorial={() => setIsTutorialOpen(true)}
                            />
                        </motion.div>
                    );
                }
                return (
                    <motion.div
                        key="home"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                        className="space-y-6"
                    >
                        <Card className="glass-premium shadow-xl card-hover-lift">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-slate-900 dark:text-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Menu Principal
                                    </div>
                                    <button
                                        onClick={() => setIsTutorialOpen(true)}
                                        className="p-2 hover:bg-sky-500/10 rounded-xl transition-colors text-skyjo-blue group"
                                        title="Revoir le tutoriel"
                                    >
                                        <HelpCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                    <p>Partie en cours avec <strong>{players.length} joueurs</strong>.</p>
                                    <p>Seuil de fin : <strong>{threshold} points</strong>.</p>
                                </div>
                                <div className="grid gap-3">
                                    <Button
                                        onClick={() => setActiveTab('game')}
                                        className="w-full bg-skyjo-blue hover:bg-skyjo-blue/90 h-14 rounded-2xl font-black text-lg shadow-xl shadow-skyjo-blue/20 transition-all active:scale-95 group"
                                    >
                                        <Play className="mr-2 h-6 w-6" />
                                        Reprendre la partie
                                    </Button>

                                    <Button
                                        variant="danger"
                                        onClick={() => setConfirmConfig({
                                            isOpen: true,
                                            title: "Quitter la partie ?",
                                            message: "Voulez-vous vraiment quitter et réinitialiser la partie ?",
                                            onConfirm: () => { resetGame(); setActiveTab('home'); },
                                            variant: "danger"
                                        })}
                                        className="w-full h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-200 dark:border-red-900/50 justify-center font-bold"
                                    >
                                        Arrêter la partie
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-emerald-900 font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-amber-500" />
                                        En tête
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-800">{leadingPlayer?.name}</div>
                                </div>
                                <div className="text-4xl font-black text-emerald-600 drop-shadow-sm">{leadingPlayer?.score}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                );

            case 'rounds':
                return (
                    <motion.div
                        key="rounds"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <History className="h-5 w-5 text-teal-600 dark:text-teal-400" /> Manches de la partie
                        </h2>
                        <RoundHistory rounds={rounds} players={players} isFullPage={true} />
                        {rounds.length === 0 && (
                            <div className="text-center py-10 text-slate-500 dark:text-slate-400 font-medium">
                                Aucune manche jouée.
                            </div>
                        )}
                    </motion.div>
                );


            case 'virtual':
                if (!virtualGameState && !onlineGameStarted && virtualScreen !== 'lobby' && virtualScreen !== 'ai-setup') {
                    return (
                        <motion.div
                            key="game-menu"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <GameMenu
                                setScreen={(screen) => {
                                    setVirtualScreen(screen);
                                    setActiveTab('virtual');
                                }}
                                playerCardSkin={playerCardSkin}
                                playerLevel={playerLevel}
                                setCardSkin={setCardSkin}
                            />
                        </motion.div>
                    );
                }
                return (
                    <motion.div
                        key="virtual"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        {gameStatus === 'PLAYING' && (
                            <div className="mb-4 p-4 bg-skyjo-blue/10 border border-skyjo-blue/30 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-skyjo-blue flex items-center justify-center shadow-lg">
                                        <Play className="h-5 w-5 text-white" fill="white" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-sm">Partie en cours</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Comptage manuel</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => setActiveTab('game')} className="bg-skyjo-blue h-9 px-4 rounded-xl font-bold text-xs">
                                    Reprendre
                                </Button>
                            </div>
                        )}
                        <VirtualGame
                            initialScreen={virtualScreen}
                            onBackToMenu={() => {
                                setVirtualScreen('menu');
                                if (!isInOnlineSession) setActiveTab('home');
                            }}
                        />
                    </motion.div>
                );

            case 'pastGames':
                return (
                    <motion.div
                        key="pastGames"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <GameHistory />
                    </motion.div>
                );

            case 'social':
                return (
                    <motion.div
                        key="social"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <SocialDashboard
                            setActiveTab={setActiveTab}
                            setVirtualScreen={setVirtualScreen}
                        />
                    </motion.div>
                );

            case 'stats':
                return (
                    <motion.div
                        key="stats"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <Stats />
                    </motion.div>
                );

            case 'settings':
                return (
                    <motion.div
                        key="settings"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <SettingsPage onViewChangelog={() => setActiveTab('changelog')} />
                    </motion.div>
                );

            case 'changelog':
                return (
                    <motion.div
                        key="changelog"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActiveTab('settings')}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-lg mb-4"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Changelog />
                    </motion.div>
                );

            case 'game':
            default:
                return (
                    <motion.div
                        key="game"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                        className="space-y-6 pt-12 pb-24"
                    >
                        {/* Main Game Container with glassmorphism */}
                        <Card className="glass-premium dark:glass-dark shadow-2xl overflow-hidden">
                            {/* Header with Stop Game */}
                            <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5">
                                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md animate-float overflow-hidden bg-slate-900 border border-skyjo-blue/30">
                                        <img
                                            src="/Gemini_Generated_Image_auzhtfauzhtfauzh.png"
                                            alt="Skyjo Logo"
                                            className="w-full h-full object-cover scale-110"
                                        />
                                    </div>
                                    Partie en cours
                                </h2>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => setIsTutorialOpen(true)}
                                        className="p-2 text-slate-400 hover:text-skyjo-blue transition-colors"
                                        title="Règles du jeu"
                                    >
                                        <HelpCircle className="w-5 h-5" />
                                    </button>
                                    <div className="flex gap-2">
                                        {rounds.length > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50/80 border-amber-300 bg-white/50 dark:bg-white/10 dark:text-amber-400 dark:border-amber-600"
                                                onClick={() => setConfirmConfig({
                                                    isOpen: true,
                                                    title: "Annuler manche ?",
                                                    message: "Voulez-vous vraiment annuler la dernière manche ?",
                                                    onConfirm: undoLastRound,
                                                    variant: "danger"
                                                })}
                                            >
                                                <Undo2 className="h-4 w-4 mr-1" />
                                                Annuler
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50/80 border-red-300 bg-white/50 dark:bg-white/10 dark:text-red-400 dark:border-red-600"
                                            onClick={() => setConfirmConfig({
                                                isOpen: true,
                                                title: "Arrêter la partie ?",
                                                message: "Arrêter et réinitialiser la partie ?",
                                                onConfirm: () => { resetGame(); setActiveTab('home'); },
                                                variant: "danger"
                                            })}
                                        >
                                            Arrêter
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* History List */}
                            {rounds.length > 0 && (
                                <div className="p-4 border-b border-white/20 dark:border-white/10">
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Manches précédentes</h3>
                                    <RoundHistory rounds={rounds} players={players} isFullPage={false} showHeader={false} />
                                </div>
                            )}


                            {/* Embedded Score Input - Always visible for continuous entry */}
                            <div className="p-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-px bg-gradient-to-r from-transparent via-skyjo-blue to-transparent flex-1"></div>
                                    <span className="text-xs font-bold text-skyjo-blue dark:text-blue-400 uppercase tracking-wider bg-sky-100 dark:bg-sky-900/50 px-3 py-1 rounded-full shadow-sm">
                                        Nouvelle Manche {rounds.length + 1}
                                    </span>
                                    <div className="h-px bg-gradient-to-r from-transparent via-skyjo-blue to-transparent flex-1"></div>
                                </div>

                                <ScoreInput
                                    key={rounds.length} // Force reset when round increases
                                    players={playerTotals}
                                    rounds={rounds}
                                    isEmbedded={true}
                                    onSave={(scores, finisher) => {
                                        addRound(scores, finisher);
                                        setTimeout(() => {
                                            document.getElementById('score-input-section')?.scrollIntoView({ behavior: 'smooth' });
                                        }, 100);
                                    }}
                                />
                            </div>
                        </Card>
                    </motion.div>
                );
        }
    };

    // Determines if we are in an active virtual game (local or online)
    // (Déjà déclaré plus haut pour la musique)

    return (
        <div className="min-h-screen">
            {/* Bouton Quitter Spécifique au jeu en ligne (Fix Plan) */}

            <div className={`max-w-3xl mx-auto p-3 ${isVirtualGameActive ? 'pb-2' : 'pb-24'}`}>
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
                {gameStatus === 'FINISHED' && <GameOver />}
            </div>
            {!isInOnlineSession && !isVirtualGameActive && (
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            )}

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
            />

            {
                level > lastAcknowledgedLevel && (
                    <LevelUpCelebration
                        level={level}
                        onComplete={() => acknowledgeLevelUp()}
                    />
                )
            }

            <Tutorial
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />

            <AnimatePresence>
                {gameInvitation && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.8, x: '-50%' }}
                        className="fixed bottom-24 left-1/2 z-[100] bg-slate-900/90 backdrop-blur-xl border border-skyjo-blue/50 rounded-3xl p-4 shadow-2xl flex items-center gap-4 min-w-[320px] max-w-[90vw]"
                    >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg animate-float shrink-0" style={{ backgroundColor: '#9850E1' }}>
                            <Play className="h-6 w-6 text-white" fill="white" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color: '#9850E1' }}>Invitation de {gameInvitation.fromName}</p>
                            <p className="text-white font-bold text-sm">Partie en ligne</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button
                                size="sm"
                                className="rounded-xl hover:opacity-90 font-black text-xs px-4 h-10 transition-transform active:scale-95"
                                style={{ backgroundColor: '#9850E1', boxShadow: '0 4px 14px rgba(152, 80, 225, 0.4)' }}
                                onClick={() => {
                                    const { userProfile } = useGameStore.getState();
                                    setOnlinePlayerInfo(userProfile.name, userProfile.avatarId);

                                    joinRoom(gameInvitation.roomCode);
                                    setGameInvitation(null);
                                    setVirtualScreen('lobby');
                                    setActiveTab('virtual');
                                }}
                            >
                                Rejoindre
                            </Button>
                            <button
                                onClick={() => setGameInvitation(null)}
                                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Chat Notification Banner */}
            <AnimatePresence>
                {unreadCount > 0 && activeTab !== 'social' && !activeChatId && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, transition: { duration: 0.2 } }}
                        onClick={() => {
                            // If only one friend has unread messages, open that chat directly
                            const unreadEntries = Object.entries(useSocialStore.getState().unreadMessages).filter(([_, count]) => count > 0);
                            if (unreadEntries.length === 1) {
                                const [friendId] = unreadEntries[0];
                                useSocialStore.getState().setActiveChatId(friendId);
                            } else {
                                setActiveTab('social');
                            }
                        }}
                        className="fixed bottom-[88px] left-1/2 z-[90] w-[92%] max-w-sm cursor-pointer shadow-[0_20px_50px_rgba(245,158,11,0.3)]"
                    >
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-[1px]">
                            <div className="flex items-center gap-4 bg-slate-950/40 backdrop-blur-3xl rounded-[2.45rem] p-4 pr-6">
                                {/* Animated Glow Aspect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                                <div className="relative h-14 w-14 flex-shrink-0">
                                    <div className="absolute inset-0 bg-amber-500 blur-xl opacity-40 animate-pulse" />
                                    <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-inner">
                                        <Users className="h-7 w-7 text-slate-900" />
                                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-amber-500">
                                            <span className="text-[10px] font-black text-amber-600">{unreadCount}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-black text-base leading-tight">Nouveau Message !</h4>
                                    <p className="text-amber-100/70 text-xs font-medium truncate">Appuie pour lire la conversation</p>
                                </div>

                                <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    <Play className="h-4 w-4 rotate-0 ml-0.5" fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                username={userProfile?.name}
            />

            {isAdminOpen && (
                <AdminDashboard
                    adminPassword={adminAuthToken}
                    onClose={() => setIsAdminOpen(false)}
                />
            )}

            <AnimatePresence>
                {activeChatId && (
                    <ChatPopup
                        friend={friends.find(f => String(f.id) === String(activeChatId))}
                        onClose={() => setActiveChatId(null)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}
