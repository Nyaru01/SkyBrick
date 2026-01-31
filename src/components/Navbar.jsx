import { Home, Archive, BarChart3, Zap, Settings, Users, LayoutGrid, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { useGameStore } from '../store/gameStore';
import { useSocialStore } from '../store/socialStore';

export default function BottomNav({ activeTab, onTabChange }) {
    const gameStatus = useGameStore(state => state.gameStatus);
    const socialNotification = useSocialStore(state => state.socialNotification);
    const setSocialNotification = useSocialStore(state => state.setSocialNotification);

    const tabs = [
        { id: 'home', label: 'Protocol', icon: Home, alwaysEnabled: true },
        { id: 'social', label: 'Network', icon: Users, alwaysEnabled: true },
        { id: 'virtual', label: 'Arcade', icon: Zap, alwaysEnabled: true },
        { id: 'stats', label: 'Data', icon: BarChart3, alwaysEnabled: true },
        { id: 'pastGames', label: 'Logs', icon: Archive, alwaysEnabled: true },
        { id: 'settings', label: 'Config', icon: Settings, alwaysEnabled: true },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[80] pointer-events-none p-4 pb-6 flex justify-center safe-area-bottom">
            <nav
                className="w-full max-w-lg bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] pointer-events-auto overflow-hidden relative"
                role="tablist"
                aria-label="Navigation principale"
            >
                {/* Cyber Scanner Overlay */}
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                <div className="flex items-center justify-around h-16 px-1 relative z-10">
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
                                    "relative flex-1 flex flex-col items-center justify-center h-full transition-all duration-500",
                                    isActive ? "-translate-y-1" : "hover:bg-cyan-500/5",
                                    isDisabled && "opacity-30 cursor-not-allowed grayscale"
                                )}
                            >
                                {/* Active Glow Background */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-cyan-400/10 blur-2xl rounded-full scale-75 animate-pulse" />
                                )}

                                <div className={cn(
                                    "relative z-10 p-2.5 rounded-2xl transition-all duration-500",
                                    isActive
                                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)] text-white scale-110"
                                        : "text-slate-500 hover:text-slate-400"
                                )}>
                                    <Icon
                                        className={cn(
                                            "h-5 w-5",
                                            isActive && "animate-pulse"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />

                                    {/* Notification Dot - Cyber Amber */}
                                    {tab.id === 'social' && socialNotification && !isActive && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-bounce" />
                                    )}
                                </div>

                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest mt-1.5 transition-all duration-500",
                                    isActive ? "text-cyan-400 scale-100 opacity-100" : "text-slate-600 scale-90 opacity-0 h-0"
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
