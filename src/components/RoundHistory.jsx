import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { useGameStore } from '../store/gameStore';

export default function RoundHistory({ rounds, players, isFullPage = false, showHeader = true }) {
    const [isOpen, setIsOpen] = useState(isFullPage);
    const deleteRound = useGameStore(state => state.deleteRound);

    if (rounds.length === 0) return null;

    // Always open if full page
    const visible = isFullPage || isOpen;

    return (
        <div className="w-full space-y-2">
            {!isFullPage && showHeader && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Historique ({rounds.length} manche{rounds.length > 1 ? 's' : ''})
                    </div>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
            )}

            {visible && (
                <div className={cn(
                    "bg-white/30 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-600 shadow-sm overflow-hidden",
                    !isFullPage && "animate-in slide-in-from-top-2 duration-200"
                )}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-white/40 dark:bg-slate-700/60 backdrop-blur-md border-b border-white/20 dark:border-slate-600 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 w-16 first:rounded-tl-xl">#</th>
                                    {players.map(p => (
                                        <th key={p.id} className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200 min-w-[80px]">
                                            {p.name}
                                        </th>
                                    ))}
                                    <th className="px-2 py-3 w-10 last:rounded-tr-xl"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-600/50">
                                {rounds.map((round, index) => (
                                    <tr key={round.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 font-medium text-xs">
                                            {/* Show actual round number if slicing, but for history view we want chronological index. 
                           If we pass sliced rounds, this might be misleading. 
                           Ideally, the round object should store its index or number.
                           For now, we rely on array index, which is fine for the full list.
                       */}
                                            {isFullPage ? index + 1 : rounds.length - (rounds.length - index) + 1}
                                        </td>
                                        {players.map(p => {
                                            const score = round.scores[p.id];
                                            const raw = round.rawScores[p.id];
                                            const isFinisher = p.id === round.finisherId;
                                            const doubled = score !== raw;

                                            return (
                                                <td key={p.id} className="px-4 py-3 text-center relative group">
                                                    <div className={cn(
                                                        "font-mono font-bold text-base",
                                                        score < 0 ? "text-emerald-700 dark:text-emerald-400" : score >= 100 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200",
                                                        doubled && "text-red-500 line-through decoration-slate-400 decoration-2"
                                                    )}>
                                                        {doubled ? (
                                                            <div className="flex flex-col items-center leading-tight">
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 line-through">{raw}</span>
                                                                <span className="font-bold text-red-600 dark:text-red-400">{score}</span>
                                                            </div>
                                                        ) : (
                                                            score
                                                        )}
                                                    </div>
                                                    {isFinisher && (
                                                        <div className="absolute top-1 right-2 text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1 rounded-full">
                                                            FIN
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-2 py-3 text-center">
                                            <button
                                                onClick={() => confirm('Supprimer cette manche ?') && deleteRound(round.id)}
                                                className="text-slate-300 dark:text-slate-500 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
