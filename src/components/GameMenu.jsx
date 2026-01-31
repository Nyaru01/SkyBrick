import React from 'react';
import { Bot, ChevronRight, Users, Wifi, HelpCircle, Palette, X, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import SkinCarousel from './SkinCarousel';
import ExperienceBar from './ExperienceBar';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { useGameStore } from '../store/gameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';

export default function GameMenu({
    setScreen,
    playerCardSkin,
    playerLevel,
    setCardSkin
}) {
    const [showRulesModal, setShowRulesModal] = React.useState(false);
    const startAIGame = useVirtualGameStore(state => state.startAIGame);
    const userProfile = useGameStore(state => state.userProfile);
    const connectOnline = useOnlineGameStore(state => state.connect);
    const setPlayerInfo = useOnlineGameStore(state => state.setPlayerInfo);

    const handleStartAIBattle = () => {
        setScreen('ai-setup');
    };

    const handleStartOnline = () => {
        setPlayerInfo(userProfile.name, userProfile.emoji || 'cat');
        connectOnline();
        setScreen('lobby');
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in zoom-in-95 duration-700 min-h-screen flex flex-col pt-8">
            {/* Header section can be even more minimal */}
            <div className="text-center mb-6 space-y-1">
                <h2 className="text-3xl font-black text-white tracking-tighter">MODE VIRTUEL</h2>
                <div className="h-1 w-12 bg-skyjo-blue mx-auto rounded-full" />
            </div>

            <ExperienceBar className="mb-6" />

            <div className="grid gap-4">
                {/* AI Battle */}
                <button
                    onClick={handleStartAIBattle}
                    className="group flex items-center justify-between p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 transition-all active:scale-95 shadow-lg backdrop-blur-md relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-left relative z-10">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Jouer contre l'IA
                        </h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 relative z-10">
                        <Bot className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                </button>
                <button
                    onClick={handleStartOnline}
                    className="group flex items-center justify-between p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 transition-all active:scale-95 shadow-lg backdrop-blur-md"
                >
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-white">Jouer en ligne</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Affrontez vos amis à distance</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-skyjo-blue/10 border border-skyjo-blue/20">
                        <Wifi className="h-6 w-6 text-skyjo-blue group-hover:scale-110 transition-transform" />
                    </div>
                </button>

                {/* Rules Button */}
                <button
                    onClick={() => setShowRulesModal(true)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 transition-colors group backdrop-blur-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <HelpCircle className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-slate-200">Règles du jeu</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Customization Card */}
            <Card className="glass-premium dark:glass-dark shadow-xl relative mt-6 overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl opacity-50 pointer-events-none" />
                <CardHeader className="pb-0 relative z-10">
                    <div className="flex items-center justify-start gap-3 px-1">
                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <Palette className="h-4 w-4 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Personnaliser vos cartes</h3>
                    </div>
                </CardHeader>
                <CardContent className="pt-2 pb-6 px-1">
                    <SkinCarousel
                        skins={[
                            { id: 'classic', name: 'Classique', img: '/card-back.png', level: 1 },
                            { id: 'papyrus', name: 'Papyrus', img: '/card-back-papyrus.jpg', level: 3 },
                            { id: 'neon', name: 'Neon', img: '/card-back-neon.png', level: 5 },
                            { id: 'cyberpunk', name: 'Cyberpunk', img: '/card-back-cyberpunk.png', level: 6 },
                            { id: 'carbon', name: 'Carbon', img: '/card-back-carbon.png', level: 8 },
                            { id: 'obsidian', name: 'Obsidian', img: '/card-back-obsidian.png', level: 12 },
                            { id: 'gold', name: 'Gold', img: '/card-back-gold.png', level: 13 },
                            { id: 'galaxy', name: 'Galaxy', img: '/card-back-galaxy.png', level: 18 }
                        ]}
                        selectedSkinId={playerCardSkin}
                        onSelect={setCardSkin}
                        playerLevel={playerLevel}
                    />
                </CardContent>
            </Card>

            {/* Rules Modal */}
            {showRulesModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowRulesModal(false)}
                    />
                    <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="relative p-6 px-8 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                    <span className="text-3xl">📜</span> Règles du Skyjo
                                </h2>
                                <p className="text-xs font-medium text-white/40 uppercase tracking-widest mt-1">Manuel de jeu officiel v2.0</p>
                            </div>
                            <button
                                onClick={() => setShowRulesModal(false)}
                                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">

                            {/* Goal Card */}
                            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-indigo-400 font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Objectif Ultime
                                    </h3>
                                    <p className="text-indigo-100/90 text-sm font-medium leading-relaxed">
                                        Avoir le <strong>moins de points possible</strong> à la fin de la partie. La partie s'arrête dès qu'un joueur atteint <strong>100 points</strong>.
                                    </p>
                                </div>
                            </div>

                            {/* Steps Grid */}
                            <div className="space-y-4">

                                {/* Step 1 */}
                                <div className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <h3 className="text-amber-400 font-black uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
                                        Mise en place
                                    </h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="w-1 h-1 rounded-full bg-amber-500/50 mt-2 shrink-0" />
                                            <span>Chaque joueur reçoit <strong>12 cartes</strong> (grille 3×4).</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="w-1 h-1 rounded-full bg-amber-500/50 mt-2 shrink-0" />
                                            <span>Retournez <strong>2 cartes</strong> au hasard.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="w-1 h-1 rounded-full bg-amber-500/50 mt-2 shrink-0" />
                                            <span>Le plus gros score commence !</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Step 2 */}
                                <div className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <h3 className="text-blue-400 font-black uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-[10px]">2</span>
                                        Tour de jeu
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-3">À votre tour, choisissez une source :</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 text-center">
                                            <span className="text-xs font-bold text-white block mb-1">LA PIOCHE</span>
                                            <span className="text-[10px] text-slate-400 leading-tight block">Gardez la carte (échange) ou défaussez-la (révélez une carte).</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 text-center">
                                            <span className="text-xs font-bold text-white block mb-1">LA DÉFAUSSE</span>
                                            <span className="text-[10px] text-slate-400 leading-tight block">Prenez la carte visible et échangez-la immédiatement.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pro Tips */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                        <h3 className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest mb-2">Combo Colonne</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            3 cartes identiques dans une colonne ? <strong>BIM !</strong> La colonne est éliminée (0 point).
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                        <h3 className="text-rose-400 font-bold uppercase text-[10px] tracking-widest mb-2">Attention !</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Si vous terminez la manche mais n'avez pas le plus petit score, vos points <strong>doublent</strong> !
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-slate-950/30 text-center">
                            <p className="text-[10px] text-white/20 font-medium">Bonne chance, que le meilleur gagne !</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
