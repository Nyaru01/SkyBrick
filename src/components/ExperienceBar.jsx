import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, Trophy, Lock, Check, X, Shield, Cpu } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { getRewardsList } from '../lib/rewards';

const REWARDS = getRewardsList();

const ExperienceBar = memo(function ExperienceBar({ className }) {
    const currentXP = useGameStore(state => state.currentXP);
    const level = useGameStore(state => state.level);
    const [showRewards, setShowRewards] = useState(false);

    // Calculate global progress to level 19 (max)
    const maxLevel = 19;
    const totalLevels = maxLevel - 1;
    const progressPercent = Math.min(100, Math.max(0, ((level - 1) / totalLevels) * 100));

    return (
        <>
            <div className={cn("w-full relative z-30", className)}>
                {/* Header: Level Badge + XP Counter */}
                <div className="flex items-center justify-between mb-1.5">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowRewards(true)}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <div className="relative">
                            {/* Animated Halo/Ripple - Cyber Blue */}
                            <motion.div
                                className="absolute -inset-2 rounded-xl bg-cyan-500/20 blur-md"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-shadow relative z-10 overflow-hidden">
                                <div className="absolute inset-0 bg-grid-white/[0.1] -z-10" />
                                <motion.div
                                    animate={{
                                        rotate: [0, -20, 20, -10, 10, 0],
                                        scale: [1, 1.15, 1.15, 1.1, 1.1, 1]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        repeatDelay: 2,
                                        ease: "linear"
                                    }}
                                >
                                    <Shield className="w-4 h-4 text-white fill-white" />
                                </motion.div>
                            </div>
                            {/* Level number badge */}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-center z-20 shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                                <span className="text-[8px] font-black text-cyan-400">{level}</span>
                            </div>
                        </div>
                        <div className="ml-1">
                            <p className="text-sm font-black text-white uppercase tracking-wider leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                NIVEAU <span className="text-xl text-cyan-400 font-mono italic">{level}</span>
                            </p>
                        </div>
                    </motion.button>

                    {/* XP Counter */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                        <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                        <span className="text-xs font-black text-cyan-400 tabular-nums">{currentXP}</span>
                        <span className="text-[10px] text-slate-500 font-bold">/ 10</span>
                    </div>
                </div>

                {/* XP Bubbles - Cyber Style */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/40 backdrop-blur-md border border-white/5 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-50 pointer-events-none" />
                    {[...Array(10)].map((_, index) => {
                        const isFilled = index < currentXP;

                        return (
                            <motion.div
                                key={index}
                                initial={false}
                                animate={{
                                    scale: isFilled ? 1 : 0.85,
                                    opacity: isFilled ? 1 : 0.4
                                }}
                                transition={{
                                    duration: 0.3,
                                    delay: isFilled ? index * 0.03 : 0
                                }}
                                className={cn(
                                    "flex-1 h-3 rounded-md transition-all duration-500",
                                    isFilled
                                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                                        : "bg-slate-800/80 border border-white/5"
                                )}
                            >
                                {isFilled && (
                                    <div className="w-full h-full rounded-md bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-[pulse_2s_infinite]" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Progress text - smaller */}
                <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                    <Cpu className="w-3 h-3" />
                    Plus que {10 - currentXP} victoire{10 - currentXP > 1 ? 's' : ''} pour passer au palier {level + 1}
                </p>
            </div>

            {/* Progression Popup */}
            {createPortal(
                <AnimatePresence mode="wait">
                    {showRewards && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 font-sans pointer-events-auto">
                            {/* Backdrop */}
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-950/95"
                                onClick={() => setShowRewards(false)}
                            />

                            {/* Modal */}
                            <motion.div
                                key="modal"
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-sm bg-slate-900 rounded-[2.5rem] border-2 border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[85vh] z-10"
                            >
                                <div className="absolute inset-0 bg-grid-slate-800/[0.1] pointer-events-none" />

                                {/* Header */}
                                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 relative">
                                    <button
                                        onClick={() => setShowRewards(false)}
                                        className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-90"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                            <Trophy className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Progression</h3>
                                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em]">Protocol Systems_V2</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Interface Status</span>
                                            <span className="text-xs font-black text-cyan-400">{Math.round(progressPercent)}% COMPLETE</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden p-0.5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {REWARDS.map((reward) => {
                                        const isUnlocked = level >= reward.level;
                                        const isNext = level + 1 === reward.level;

                                        return (
                                            <div
                                                key={reward.level}
                                                className={cn(
                                                    "relative p-4 rounded-3xl border-2 transition-all duration-500",
                                                    isUnlocked
                                                        ? "bg-slate-800/40 border-cyan-500/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]"
                                                        : isNext
                                                            ? "bg-slate-800/80 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)] group/next"
                                                            : "bg-slate-950 border-white/5 opacity-40 grayscale"
                                                )}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0 transition-transform duration-500",
                                                        isUnlocked ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-900 text-slate-600",
                                                        isNext && "group-hover/next:scale-110"
                                                    )}>
                                                        {reward.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border",
                                                                isUnlocked
                                                                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                                                                    : "border-slate-700 bg-slate-800 text-slate-500"
                                                            )}>
                                                                LVL {reward.level}
                                                            </span>
                                                            {isUnlocked ? (
                                                                <Check className="w-4 h-4 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                                            ) : isNext ? (
                                                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                                            ) : (
                                                                <Lock className="w-4 h-4 text-slate-700" />
                                                            )}
                                                        </div>
                                                        <p className={cn(
                                                            "text-base font-black uppercase tracking-tight leading-none",
                                                            isUnlocked ? "text-white" : "text-slate-500"
                                                        )}>
                                                            {reward.name}
                                                        </p>
                                                        <p className={cn(
                                                            "text-xs mt-1 leading-relaxed opacity-60",
                                                            isUnlocked ? "text-slate-300" : "text-slate-600"
                                                        )}>
                                                            {reward.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress bar for next level */}
                                                {isNext && (
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <div className="flex justify-between text-[10px] font-black uppercase text-cyan-500 mb-1.5 tracking-widest">
                                                            <span>Sync Progress</span>
                                                            <span>{currentXP} / 10 XP</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden p-0.5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(currentXP / 10) * 100}%` }}
                                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-white/5 bg-slate-950/50 text-center">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                        Dominance du système requise pour débloquer
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
});

export default ExperienceBar;
