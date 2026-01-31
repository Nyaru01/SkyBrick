import { useState, useEffect, useRef } from 'react';
import {
    Plus, X, User, Sparkles, Gamepad2, RefreshCw,
    CheckCircle, Edit2, ArrowRight, HelpCircle,
    Trophy, Play, Settings, Users, BarChart3,
    Zap, Rocket, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import InstallPWA from './InstallPWA';
import { useGameStore } from '../store/gameStore';
import { useFeedback } from '../hooks/useFeedback';
import { useUpdateCheck } from './UpdatePrompt';
import { cn } from '../lib/utils';
import { AVATARS, getAvatarPath } from '../lib/avatars';
import AvatarSelector from './AvatarSelector';
import ExperienceBar from './ExperienceBar';

export default function GameSetup({ onNavigate, onOpenTutorial }) {
    const userProfile = useGameStore(state => state.userProfile);
    const setConfiguration = useGameStore(state => state.setConfiguration);
    const { playStart, playClick } = useFeedback();
    const { checkForUpdates, isChecking, checkResult } = useUpdateCheck();

    const [openAvatarSelector, setOpenAvatarSelector] = useState(null);



    return (
        <div className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in duration-500 flex flex-col min-h-full">

            {/* 1. Header: User Dashboard Summary */}
            <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-2xl p-4 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-50" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

                {/* Avatar with Level Badge */}
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-cyan-500/30 p-0.5 shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                        <img
                            src={getAvatarPath(userProfile?.avatarId || 'cyber_1')}
                            className="w-full h-full object-cover rounded-xl"
                            alt="Profile"
                        />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg border-2 border-slate-900 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                        {userProfile?.level || 1}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg font-black text-white truncate flex items-center gap-2">
                            {userProfile?.name}
                            <span className="text-[10px] text-cyan-400 font-mono tracking-tighter opacity-70">[{userProfile?.vibeId}]</span>
                        </h2>
                    </div>
                    <ExperienceBar className="!mb-0" />
                </div>
            </div>

            {/* 2. Hero: SkyBrick Arcade Promo */}
            <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative h-64 rounded-[2.5rem] overflow-hidden border-2 border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] group cursor-pointer"
                onClick={() => onNavigate('virtual')}
            >
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="/6JjYjsyJmk.png"
                        alt="SkyBrick ARCADE"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/80 to-transparent" />
                </div>

                {/* Content Overlay - Pro Cyber Clean */}
                <div className="relative h-full flex flex-col items-center justify-end p-8 z-20 pb-10">
                    <div className="relative z-10 w-full flex flex-col items-center">
                        <Button
                            className="w-full max-w-[240px] bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400 text-white font-black h-14 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all group relative overflow-hidden uppercase tracking-[0.2em] text-[11px]"
                            onClick={(e) => { e.stopPropagation(); onNavigate('virtual'); }}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-4">
                                INITIER LA SESSION
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-cyan-400" />
                            </span>
                            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </div>
                </div>

                {/* Cyber Corner Accents - Minimalist */}
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-500/20 m-4 rounded-br-2xl" />
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/20 m-4 rounded-tl-2xl" />
            </motion.div>

            {/* 3. Utility Grid - Refocused */}
            <div className="grid grid-cols-1">
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { playClick(); onNavigate('social'); }}
                    className="flex items-center gap-6 p-6 bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border-2 border-purple-500/20 hover:border-purple-400/50 transition-all group shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <Users className="h-8 w-8 text-purple-400" />
                    </div>
                    <div className="text-left">
                        <span className="block text-lg font-black text-white uppercase tracking-tight">Social Hub</span>
                        <span className="text-[10px] text-purple-400/60 font-black uppercase tracking-[0.2em]">RÉSEAU NEURAL DYS_CONNECTED</span>
                    </div>
                    <ArrowRight className="ml-auto h-6 w-6 text-purple-500/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </motion.button>
            </div>

            {/* 4. Secondary Actions */}
            <div className="flex gap-4 mt-auto">
                <Button
                    variant="ghost"
                    className="flex-1 bg-slate-900/40 border border-white/5 text-[10px] font-black uppercase text-slate-400 gap-2 h-12 rounded-xl hover:text-white hover:bg-slate-800/80"
                    onClick={onOpenTutorial}
                >
                    <HelpCircle className="h-3 w-3" /> Aide & Règles
                </Button>
                <Button
                    variant="ghost"
                    className="flex-1 bg-slate-900/40 border border-white/5 text-[10px] font-black uppercase text-slate-400 gap-2 h-12 rounded-xl hover:text-white hover:bg-slate-800/80"
                    onClick={() => checkForUpdates()}
                    disabled={isChecking}
                >
                    <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
                    {isChecking ? "Vérification..." : "Mise à jour"}
                </Button>
            </div>

            <InstallPWA />



            {/* Avatar Selector Modal */}
            <AvatarSelector
                isOpen={openAvatarSelector !== null}
                onClose={() => setOpenAvatarSelector(null)}
                selectedId={userProfile.avatarId}
                onSelect={(id) => {
                    useGameStore.getState().updateUserProfile({ avatarId: id });
                    setOpenAvatarSelector(null);
                }}
            />
        </div >
    );
}
