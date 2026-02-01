import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Star, Trophy, Palette, User } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';

const REWARDS = [
    { level: 1, type: 'AVATAR', name: 'Recrue Cyber', icon: User, description: 'Avatar par défaut' },
    { level: 2, type: 'SKIN', name: 'Skin Royal', icon: Palette, description: 'Un dos de carte majestueux' },
    { level: 3, type: 'AVATAR', name: 'Néon Runner', icon: User, description: 'Avatar style rétro-futuriste' },
    { level: 5, type: 'AVATAR', name: 'Sky King', icon: Trophy, description: 'L\'ultime avatar de souverain' },
    { level: 10, type: 'SKIN', name: 'Matrix Code', icon: Palette, description: 'Effet de code qui défile' }
];

export default function RewardsTrack() {
    const level = useGameStore(state => state.level);
    const currentXP = useGameStore(state => state.currentXP);
    const progress = (currentXP / 10) * 100;

    return (
        <div className="space-y-6">
            {/* XP Progress Header */}
            <div className="glass-premium p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter">NIVEAU {level}</h3>
                        <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest">{currentXP} / 10 XP</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <Star className="w-6 h-6 text-cyan-400 fill-cyan-400" />
                    </div>
                </div>

                <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden border border-white/5 p-1">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                    />
                </div>
            </div>

            {/* Rewards Timeline */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Récompenses de Progression</h4>

                <div className="relative space-y-3">
                    {/* Vertical Line */}
                    <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-slate-800" />

                    {REWARDS.map((reward, index) => {
                        const isUnlocked = level >= reward.level;
                        const Icon = reward.icon;

                        return (
                            <motion.div
                                key={reward.level}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                                    isUnlocked
                                        ? "bg-slate-900/60 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.05)]"
                                        : "bg-slate-950/40 border-white/5 opacity-60"
                                )}
                            >
                                {/* Level Badge / Connection Point */}
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10 border-2",
                                    isUnlocked
                                        ? "bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                                        : "bg-slate-900 border-slate-800 text-slate-600"
                                )}>
                                    <span className="font-black text-lg italic">{reward.level}</span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h5 className={cn("font-bold text-sm", isUnlocked ? "text-white" : "text-slate-400")}>
                                            {reward.name}
                                        </h5>
                                        {isUnlocked ? (
                                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                        ) : (
                                            <Lock className="w-3 h-3 text-slate-600" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">{reward.description}</p>
                                </div>

                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                    isUnlocked ? "bg-white/10 text-cyan-400" : "bg-white/5 text-slate-700"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
