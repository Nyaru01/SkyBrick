import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Music2, Trash2, MessageSquare, ExternalLink, AlertTriangle, Smartphone, Settings, HelpCircle, Sparkles, RefreshCw } from 'lucide-react';
import Tutorial from './Tutorial';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell, BellOff } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { AboutSection } from './AboutSection';
import { useUpdateCheck } from './UpdatePrompt';

export default function SettingsPage({ onViewChangelog }) {
    const { checkForUpdates, isChecking, checkResult } = useUpdateCheck();
    const soundEnabled = useGameStore(state => state.soundEnabled);
    const musicEnabled = useGameStore(state => state.musicEnabled);
    const vibrationEnabled = useGameStore(state => state.vibrationEnabled);
    const toggleSound = useGameStore(state => state.toggleSound);
    const toggleMusic = useGameStore(state => state.toggleMusic);
    const toggleVibration = useGameStore(state => state.toggleVibration);
    const clearArchivedGames = useGameStore(state => state.clearArchivedGames);

    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const {
        isSupported,
        isSubscribed,
        permission,
        requestPermission,
        subscribe,
        unsubscribe
    } = usePushNotifications();

    const userProfile = useGameStore(state => state.userProfile);
    const setIsFeedbackOpen = useGameStore(state => state.setIsFeedbackOpen);
    const setIsAdminOpen = useGameStore(state => state.setIsAdminOpen);
    const setAdminAuthToken = useGameStore(state => state.setAdminAuthToken);

    // Initial check for push subscription
    const handleTogglePush = async () => {
        if (!isSupported) return;

        try {
            if (isSubscribed) {
                await unsubscribe();
            } else {
                if (permission === 'default') {
                    const granted = await requestPermission();
                    if (!granted) {
                        alert("⚠️ Vous avez refusé les notifications. Veuillez vérifier les paramètres de votre navigateur.");
                    }
                } else if (permission === 'denied') {
                    alert("⚠️ Notifications bloquées par le navigateur.\n\nVeuillez cliquer sur l'icône de cadenas 🔒 ou de réglages dans la barre d'adresse pour autoriser les notifications.");
                } else {
                    await subscribe();
                }
            }
        } catch (error) {
            console.error('[PUSH] Toggle Error:', error);
            alert("Erreur: " + error.message);
        }
    };

    const handleResetHistory = () => {
        clearArchivedGames();
        setShowConfirmReset(false);
    };

    const handleAdminUnlock = (token) => {
        setAdminAuthToken(token);
        setIsAdminOpen(true);
    };

    // Static styles lookup to prevent Tailwind purging and ensure valid classes
    const TOGGLE_STYLES = {
        emerald: {
            activeBorder: "border-emerald-500/20",
            activeShadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
            iconBgMatch: "bg-emerald-500/20 text-emerald-400",
            trackActive: "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
            dotActive: "bg-emerald-500"
        },
        sky: {
            activeBorder: "border-sky-500/20",
            activeShadow: "shadow-[0_0_15px_rgba(14,165,233,0.1)]",
            iconBgMatch: "bg-sky-500/20 text-sky-400",
            trackActive: "bg-gradient-to-r from-sky-500 to-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]",
            dotActive: "bg-sky-500"
        },
        purple: {
            activeBorder: "border-purple-500/20",
            activeShadow: "shadow-[0_0_15px_rgba(168,85,247,0.1)]",
            iconBgMatch: "bg-purple-500/20 text-purple-400",
            trackActive: "bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
            dotActive: "bg-purple-500"
        },
        amber: {
            activeBorder: "border-amber-500/20",
            activeShadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
            iconBgMatch: "bg-amber-500/20 text-amber-400",
            trackActive: "bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
            dotActive: "bg-amber-500"
        }
    };

    const PremiumToggle = ({ label, subLabel, icon: Icon, value, onChange, disabled, activeColor = "emerald" }) => {
        const styles = TOGGLE_STYLES[activeColor] || TOGGLE_STYLES.emerald;

        return (
            <div className={cn(
                "flex items-center justify-between p-4 rounded-xl transition-all duration-300 border border-transparent",
                "bg-white/5 hover:bg-white/10",
                value ? `${styles.activeBorder} ${styles.activeShadow}` : "border-white/5"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-lg transition-colors",
                        value ? styles.iconBgMatch : "bg-slate-800 text-slate-500"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className={cn("font-bold text-base transition-colors", value ? "text-white" : "text-slate-400")}>{label}</p>
                        <p className="text-xs text-slate-500 font-medium">{subLabel}</p>
                    </div>
                </div>

                <button
                    onClick={onChange}
                    disabled={disabled}
                    className={cn(
                        "relative w-14 h-8 rounded-full transition-all duration-300 shadow-inner",
                        value ? styles.trackActive : "bg-slate-700/50 border border-white/10",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className={cn(
                        "absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
                        value ? "left-7 rotate-0" : "left-1 -rotate-180 bg-slate-400"
                    )}>
                        {value && <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${styles.dotActive}`} />}
                    </div>
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-32 animate-in fade-in zoom-in-95 duration-700">
            {/* Hero Header */}
            <div className="relative text-center py-8">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
                <h1 className="relative text-4xl font-black text-white drop-shadow-lg tracking-tight flex items-center justify-center gap-3">
                    <Settings className="w-8 h-8 text-skyjo-blue animate-spin-slow-reverse" />
                    RÉGLAGES
                </h1>
                <p className="relative text-sm text-sky-200/60 font-medium uppercase tracking-widest mt-2">
                    Personnalisez votre expérience
                </p>
            </div>

            {/* Audio Section */}
            <Card className="glass-premium border-white/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white text-xl">
                        <div className="h-1 w-1 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]" />
                        Immersion & Audio
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 relative z-10">
                    <PremiumToggle
                        label="Musique"
                        subLabel="Ambiance chill pour se concentrer"
                        icon={musicEnabled ? Music : Music2}
                        value={musicEnabled}
                        onChange={toggleMusic}
                        activeColor="emerald"
                    />
                    <PremiumToggle
                        label="Effets Sonores"
                        subLabel="Bruitages de cartes et victoires"
                        icon={soundEnabled ? Volume2 : VolumeX}
                        value={soundEnabled}
                        onChange={toggleSound}
                        activeColor="sky"
                    />
                    <PremiumToggle
                        label="Vibrations"
                        subLabel="Retours haptiques au toucher"
                        icon={Smartphone}
                        value={vibrationEnabled}
                        onChange={toggleVibration}
                        activeColor="purple"
                    />
                </CardContent>
            </Card>

            {/* Notifications & Social */}
            <Card className="glass-premium border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white text-xl">
                        <div className="h-1 w-1 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24]" />
                        Social & Système
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <PremiumToggle
                        label="Notifications Push"
                        subLabel={
                            !isSupported ? "Non supporté sur cet appareil" :
                                permission === 'denied' ? "Bloqué (vérifiez les réglages)" :
                                    "Invitations et mises à jour"
                        }
                        icon={isSubscribed ? Bell : BellOff}
                        value={isSubscribed}
                        onChange={handleTogglePush}
                        disabled={!isSupported}
                        activeColor="amber"
                    />

                    {/* Buttons Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button
                            onClick={onViewChangelog}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 active:scale-95 transition-all group relative overflow-hidden"
                        >
                            <div className="p-3 bg-emerald-500/20 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="font-bold text-emerald-100">Nouveautés</span>
                            <span className="text-[10px] text-emerald-400/60 uppercase tracking-widest mt-1">v2.0.9</span>
                        </button>

                        <button
                            onClick={checkForUpdates}
                            disabled={isChecking}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-2xl border active:scale-95 transition-all group relative overflow-hidden",
                                checkResult === 'update-available'
                                    ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40"
                                    : "bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-500/20 hover:border-sky-500/40"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-full mb-2 group-hover:scale-110 transition-transform",
                                checkResult === 'update-available' ? "bg-amber-500/20" : "bg-sky-500/20"
                            )}>
                                {isChecking ? (
                                    <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
                                ) : checkResult === 'update-available' ? (
                                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                                ) : (
                                    <RefreshCw className="w-5 h-5 text-sky-400" />
                                )}
                            </div>
                            <span className={cn(
                                "font-bold",
                                checkResult === 'update-available' ? "text-amber-100" : "text-sky-100"
                            )}>
                                {isChecking ? 'Vérification...' : checkResult === 'update-available' ? 'Mettre à jour' : 'Mise à jour'}
                            </span>
                            <span className={cn(
                                "text-[10px] uppercase tracking-widest mt-1",
                                checkResult === 'update-available' ? "text-amber-400/60" : "text-sky-400/60"
                            )}>
                                {checkResult === 'up-to-date' ? 'À jour ✅' : checkResult === 'update-available' ? 'Disponible !' : 'Vérifier'}
                            </span>
                        </button>

                        <button
                            onClick={() => setIsTutorialOpen(true)}
                            className="col-span-2 flex flex-row items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                        >
                            <HelpCircle className="w-5 h-5 text-slate-400" />
                            <span className="font-bold text-slate-300">Relire le Tutoriel</span>
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Tutorial
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />

            {/* Data Management */}
            <Card className="glass-premium dark:glass-dark shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                        <Trash2 className="h-5 w-5 text-red-400" />
                        Données
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!showConfirmReset ? (
                        <Button
                            variant="outline"
                            className="w-full justify-start text-red-400 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => setShowConfirmReset(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Réinitialiser l'historique des parties
                        </Button>
                    ) : (
                        <div className="space-y-3 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                            <div className="flex items-center gap-2 text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                                <p className="font-medium">Confirmer la suppression ?</p>
                            </div>
                            <p className="text-sm text-slate-400">
                                Cette action supprimera définitivement tout l'historique des parties. Cette action est irréversible.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowConfirmReset(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleResetHistory}
                                >
                                    Supprimer
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Feedback */}
            <Card className="glass-premium dark:glass-dark shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                        Feedback
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                            BETA
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-400 mb-4">
                        Vous avez des suggestions, des bugs à signaler ou des idées d'amélioration ? Faites-nous part de vos retours !
                    </p>
                    <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                        onClick={() => setIsFeedbackOpen(true)}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Envoyer un commentaire
                    </Button>
                </CardContent>
            </Card>

            {/* Version & About */}
            <AboutSection
                appVersion="v2.0.9"
                onAdminUnlock={handleAdminUnlock}
            />

            {/* Modals */}

        </div>
    );
}
