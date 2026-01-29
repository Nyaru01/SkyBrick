import { Home, Archive, BarChart3, Dices, Settings, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useGameStore } from '../store/gameStore';
import { useSocialStore } from '../store/socialStore';

export default function BottomNav({ activeTab, onTabChange }) {
    const gameStatus = useGameStore(state => state.gameStatus);
    const socialNotification = useSocialStore(state => state.socialNotification);
    const setSocialNotification = useSocialStore(state => state.setSocialNotification);

    const tabs = [
        { id: 'home', label: 'Accueil', icon: Home, alwaysEnabled: true },
        { id: 'social', label: 'Social', icon: Users, alwaysEnabled: true },
        { id: 'virtual', label: 'Jouer', icon: Dices, alwaysEnabled: true },
        { id: 'stats', label: 'Stats', icon: BarChart3, alwaysEnabled: true },
        { id: 'pastGames', label: 'Parties', icon: Archive, alwaysEnabled: true },
        { id: 'settings', label: 'Réglages', icon: Settings, alwaysEnabled: true },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[80] pointer-events-none p-4 pb-6 flex justify-center safe-area-bottom">
            <nav
                className="w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden relative"
                role="tablist"
                aria-label="Navigation principale"
            >
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                <div className="flex items-center justify-around h-16 px-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const isDisabled = !tab.alwaysEnabled && gameStatus === 'SETUP';

                        return (
                            <button
                                key={tab.id}
                                role="tab"
                                aria-selected={isActive}
                                aria-label={tab.label}
                                disabled={isDisabled}
                                onClick={() => {
                                    if (!isDisabled) {
                                        onTabChange(tab.id);
                                        if (tab.id === 'social') setSocialNotification(false);
                                    }
                                }}
                                className={cn(
                                    "relative flex-1 flex flex-col items-center justify-center h-full transition-all duration-300",
                                    isActive ? "-translate-y-1" : "hover:bg-white/5",
                                    isDisabled && "opacity-30 cursor-not-allowed grayscale"
                                )}
                            >
                                {/* Active Glow Background */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-skyjo-blue/20 blur-xl rounded-full scale-75" />
                                )}

                                <div className={cn(
                                    "relative z-10 p-2 rounded-2xl transition-all duration-300",
                                    isActive ? "bg-gradient-to-br from-skyjo-blue to-sky-600 shadow-lg shadow-skyjo-blue/30 text-white scan-line-effect" : "text-slate-400"
                                )}>
                                    <Icon
                                        className={cn(
                                            "h-5 w-5",
                                            isActive && "animate-pulse-slow"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />

                                    {/* Notification Dot */}
                                    {tab.id === 'social' && socialNotification && !isActive && (
                                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-bounce" />
                                    )}
                                </div>

                                <span className={cn(
                                    "text-[9px] font-bold mt-1 transition-all duration-300",
                                    isActive ? "text-sky-400 scale-100" : "text-slate-500 scale-0 h-0 opacity-0"
                                )}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
