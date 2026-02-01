import { useGameStore } from '../store/gameStore';
import { Award, Trophy, Zap, Star } from 'lucide-react';

const ALL_ACHIEVEMENTS = [
    { id: 'FIRST_BYTE', title: 'Premier Octet', description: 'Gagne ta première partie !', icon: Trophy, color: 'text-amber-500' },
    { id: 'BOSS_HUNTER', title: 'Chasseur de Boss', description: 'Vaincs le Boss Core.', icon: Award, color: 'text-red-500' },
    { id: 'ZEN_MASTER', title: 'Maître Zen', description: 'Atteins la sérénité infinie.', icon: Zap, color: 'text-cyan-500' },
    { id: 'UNTOUCHABLE', title: 'Intouchable', description: 'Gagne sans perdre de vie.', icon: Star, color: 'text-purple-500' },
];

export default function AchievementsList() {
    const unlockedAchievements = useGameStore(state => state.achievements || []);

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 px-1">
                <Award className="h-5 w-5 text-amber-500" />
                Succès & Défis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_ACHIEVEMENTS.map((ach) => {
                    const isUnlocked = unlockedAchievements.some(a => a.id === ach.id);
                    const Icon = ach.icon;
                    return (
                        <Card key={ach.id} className={`glass-premium border-white/5 transition-all duration-500 ${isUnlocked ? 'opacity-100 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'opacity-40 grayscale'}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 ${ach.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-white">{ach.title}</h4>
                                    <p className="text-[10px] text-slate-400 leading-tight">{ach.description}</p>
                                </div>
                                {isUnlocked && (
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
