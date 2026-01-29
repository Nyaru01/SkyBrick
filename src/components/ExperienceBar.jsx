import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, Trophy, Lock, Check, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';

/**
 * Experience Bar Component (Compact version)
 * Displays a horizontal bar with 10 bubbles representing XP progress
 */
import { getRewardsList } from '../lib/rewards';

const REWARDS = getRewardsList();

const ExperienceBar = memo(function ExperienceBar({ className }) {
    const currentXP = useGameStore(state => state.currentXP);
    const level = useGameStore(state => state.level);
    const [showRewards, setShowRewards] = useState(false);

    // Calculate global progress to level 11 (max)
    // Assuming each level takes 10 XP
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
                            {/* Animated Halo/Ripple for interactivity hint */}
                            <motion.div
                                className="absolute -inset-2 rounded-xl bg-amber-500/20 blur-md"
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

                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow relative z-10">
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
                                    <Star className="w-4 h-4 text-white fill-white" />
                                </motion.div>
                            </div>
                            {/* Level number badge */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-900 border border-amber-400 flex items-center justify-center z-20">
                                <span className="text-[8px] font-bold text-amber-400">{level}</span>
                            </div>
                        </div>
                        <div className="ml-1">
                            <p className="text-lg font-black text-white uppercase tracking-wider leading-none shadow-black drop-shadow-md">
                                NIVEAU <span className="text-2xl text-amber-400">{level}</span>
                            </p>
                        </div>
                    </motion.button>

                    {/* XP Counter */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400">{currentXP}</span>
                        <span className="text-[10px] text-slate-500">/10</span>
                    </div>
                </div>

                {/* XP Bubbles - More compact */}
                <div className="flex items-center gap-1 p-1.5 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-[#1a4869]">
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
                                    duration: 0.2,
                                    delay: isFilled ? index * 0.02 : 0
                                }}
                                className={cn(
                                    "flex-1 h-2.5 rounded-full transition-colors duration-300",
                                    isFilled
                                        ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-sm shadow-amber-500/30"
                                        : "bg-slate-700/50 border border-slate-600/30"
                                )}
                            >
                                {isFilled && (
                                    <div className="w-full h-full rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Progress text - smaller */}
                <p className="text-center text-xs font-medium text-slate-400 mt-2">
                    {10 - currentXP} victoire{10 - currentXP > 1 ? 's' : ''} avant le niveau {level + 1}
                </p>
            </div>

            {/* Progression Popup - Portalled to body to match z-index */}
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
                                className="absolute inset-0 bg-slate-950/90"
                                onClick={() => setShowRewards(false)}
                            />

                            {/* Modal */}
                            <motion.div
                                key="modal"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="relative w-full max-w-sm bg-[#1e2235] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 relative">
                                    <button
                                        onClick={() => setShowRewards(false)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-amber-400" />
                                        Progression de Carrière
                                    </h3>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Niveau Actuel: {level}</span>
                                            <span>Objectif: {maxLevel}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {REWARDS.map((reward) => {
                                        const isUnlocked = level >= reward.level;
                                        const isNext = level + 1 === reward.level;

                                        return (
                                            <div
                                                key={reward.level}
                                                className={cn(
                                                    "relative p-3 rounded-xl border transition-all",
                                                    isUnlocked
                                                        ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30"
                                                        : isNext
                                                            ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                                            : "bg-white/5 border-white/5 opacity-60 grayscale"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner shrink-0",
                                                        isUnlocked ? "bg-emerald-500/20" : "bg-slate-800"
                                                    )}>
                                                        {reward.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className={cn(
                                                                "text-xs font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                                                                isUnlocked ? "bg-emerald-500 text-emerald-950" : "bg-slate-700 text-slate-300"
                                                            )}>
                                                                Niveau {reward.level}
                                                            </span>
                                                            {isUnlocked ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                                            )}
                                                        </div>
                                                        <p className={cn(
                                                            "text-sm font-medium leading-tight",
                                                            isUnlocked ? "text-white" : "text-slate-300"
                                                        )}>
                                                            {reward.name}
                                                        </p>
                                                        <p className={cn(
                                                            "text-[10px] italic mt-0.5 leading-tight",
                                                            isUnlocked ? "text-slate-400" : "text-slate-500"
                                                        )}>
                                                            {reward.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress bar specific to this level if it's the next one */}
                                                {isNext && (
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-[10px] text-blue-300 mb-1">
                                                            <span>Progression</span>
                                                            <span>{currentXP}/10 XP</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-500"
                                                                style={{ width: `${(currentXP / 10) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="p-3 border-t border-white/5 bg-slate-900/50 text-center">
                                    <p className="text-[10px] text-slate-500">
                                        Gagnez des parties pour monter en niveau et débloquer des récompenses !
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
