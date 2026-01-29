import { useEffect, useRef } from 'react';
import { Trophy, RefreshCw, AlertTriangle, Crown, Medal } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { useFeedback } from '../hooks/useFeedback';

// Composant médaille avec couleurs et animation
function RankMedal({ rank }) {
    const medals = {
        1: { icon: Crown, className: 'gradient-gold shadow-glow-gold text-white', label: '1er' },
        2: { icon: Medal, className: 'gradient-silver text-slate-700', label: '2ème' },
        3: { icon: Medal, className: 'gradient-bronze text-amber-900', label: '3ème' },
    };

    const medal = medals[rank];
    if (!medal) {
        return (
            <div className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-600/80 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold">
                {rank}
            </div>
        );
    }

    const Icon = medal.icon;
    return (
        <div
            className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center animate-bounce-in",
                medal.className
            )}
            style={{ animationDelay: `${(rank - 1) * 150}ms` }}
        >
            <Icon className="h-5 w-5" strokeWidth={2.5} />
        </div>
    );
}

// Fonction pour lancer l'effet confetti
function fireConfetti() {
    // Premier burst - centre
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#06b6d4', '#f43f5e', '#8b5cf6']
    });

    // Deuxième burst après délai - gauche et droite
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10b981', '#fbbf24']
        });
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#06b6d4', '#8b5cf6']
        });
    }, 250);
}

export default function GameOver() {
    const { players, rounds, threshold, rematch, resetGame } = useGameStore();
    const archiveGame = useGameStore(state => state.archiveGame);
    const hasArchivedRef = useRef(false);
    const { playVictory } = useFeedback();

    // Déclencher le confetti, le son et archiver la partie au montage
    useEffect(() => {
        fireConfetti();
        playVictory();

        // Archive the game only once
        if (!hasArchivedRef.current) {
            archiveGame();
            hasArchivedRef.current = true;
        }
    }, [archiveGame, playVictory]);

    // Calculate totals
    const totals = players.map(p => ({
        ...p,
        score: rounds.reduce((sum, r) => sum + (r.scores[p.id] || 0), 0)
    }));

    // Sort by score ascending (lowest wins)
    const sortedPlayers = [...totals].sort((a, b) => a.score - b.score);
    const winner = sortedPlayers[0];

    // Find who triggered the game over (score >= threshold)
    const breakers = totals.filter(p => p.score >= threshold);

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-lg border-none shadow-2xl bg-white dark:bg-slate-800 animate-scale-in">
                {/* Header Victoire Premium */}
                <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-8 text-center text-white rounded-t-2xl relative overflow-hidden">
                    {/* Effet shimmer overlay */}
                    <div className="absolute inset-0 animate-shimmer opacity-30 pointer-events-none" />

                    {/* Trophée animé */}
                    <div className="relative z-10">
                        <div className="bg-white/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-gold backdrop-blur-md animate-float">
                            <Trophy className="h-12 w-12 text-yellow-300 drop-shadow-lg" />
                        </div>
                        <h2 className="text-3xl font-extrabold mb-1 drop-shadow-md">🏆 Victoire !</h2>
                        <p className="text-emerald-50 font-semibold text-lg">{winner.name} remporte la partie</p>
                        <div className="mt-5 text-7xl font-black tracking-tighter drop-shadow-lg">
                            {winner.score} <span className="text-2xl font-medium opacity-80">pts</span>
                        </div>
                    </div>
                </div>

                <CardContent className="pt-6 space-y-6">
                    {/* Alerte dépassement seuil */}
                    {breakers.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700 dark:text-red-300">
                                <span className="font-bold">Seuil ({threshold} pts) atteint par :</span>
                                <ul className="list-disc list-inside mt-1 font-medium">
                                    {breakers.map(p => (
                                        <li key={p.id}>{p.name} ({p.score} pts)</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Classement Final avec médailles */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 flex items-center gap-2">
                            <Medal className="h-5 w-5 text-amber-500" />
                            Classement Final
                        </h3>
                        <div className="space-y-2">
                            {sortedPlayers.map((p, i) => (
                                <div
                                    key={p.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-all card-hover-lift",
                                        i === 0 ? "bg-emerald-50/90 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700 shadow-md" :
                                            i === 1 ? "bg-slate-50/90 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600" :
                                                i === 2 ? "bg-amber-50/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700" :
                                                    "bg-white/80 dark:bg-slate-700/30 border-slate-100 dark:border-slate-600"
                                    )}
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <div className="flex items-center gap-3">
                                        <RankMedal rank={i + 1} />
                                        <span className={cn(
                                            "font-bold",
                                            i === 0 ? "text-emerald-800 dark:text-emerald-300 text-lg" : "text-slate-800 dark:text-slate-200"
                                        )}>
                                            {p.name}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "font-mono font-black text-xl tabular-nums",
                                        i === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                                    )}>
                                        {p.score}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={resetGame}
                            className="w-full card-hover-lift whitespace-nowrap text-sm"
                        >
                            Menu Principal
                        </Button>
                        <Button
                            onClick={rematch}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 gap-2 shadow-lg shadow-emerald-900/20 card-hover-lift animate-pulse-glow"
                        >
                            <RefreshCw className="h-4 w-4" /> Rejouer
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
