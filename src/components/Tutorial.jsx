import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, HelpCircle, Info, Sparkles, Target, Zap, ArrowRight, Users, Globe, Cpu, ShieldAlert, ArrowLeftRight, Plus, Timer, Shield, Crosshair, Bomb, Gem } from 'lucide-react';
import { Button } from './ui/Button';

const STEPS = [
    {
        title: "Bienvenue dans SkyBrick",
        description: "Préparez-vous à une expérience d'arcade électrisante. Glissez votre raquette pour détruire les serveurs ennemis dans un déluge de néons.",
        icon: Sparkles,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10",
        content: (
            <div className="relative w-full h-40 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img src="/Gemini_Generated_Image_e55u1ne55u1ne55u.png" alt="Ambiance" className="w-full h-full object-cover scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-[10px] font-black text-white uppercase tracking-[0.2em] text-center animate-pulse">
                    PROTOCOLE D'ARCADE ACTIVÉ
                </div>
            </div>
        )
    },
    {
        title: "Contrôle de Raquette",
        description: "Déplacez votre doigt (ou souris) horizontalement pour diriger la raquette. L'angle d'impact détourne la trajectoire de la balle.",
        icon: Target,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        content: (
            <div className="flex flex-col items-center gap-6 py-6 w-full">
                <div className="relative w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        animate={{ x: [-60, 60, -60] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-y-0 left-1/2 -ml-8 w-16 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] rounded-full"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-white opacity-20" />
                    <div className="w-3 h-3 rounded-full bg-white opacity-40 animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-white opacity-20" />
                </div>
            </div>
        )
    },
    {
        title: "Blindage des Serveurs",
        description: "Certaines données sont cryptées. Les briques d'Acier (Grises) cèdent en 2 coups. Le Titanium (Sombre/Or), ultra-sécurisé, en exige 3 !",
        icon: ShieldAlert,
        color: "text-slate-400",
        bg: "bg-slate-400/10",
        content: (
            <div className="flex gap-4 py-8">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-6 bg-slate-400 border-2 border-slate-300 rounded-md shadow-[0_0_10px_rgba(148,163,184,0.5)]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Acier (2)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-6 bg-slate-800 border-2 border-amber-500 rounded-md shadow-[0_0_15px_rgba(251,191,36,0.3)]" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Titanium (3)</span>
                </div>
            </div>
        )
    },
    {
        title: "Duel de Systèmes (IA)",
        description: "En mode Versus, chaque impact sur une brique adverse renforce votre score. Protégez votre zone : si la balle traverse votre ligne, l'IA marque un point.",
        icon: Cpu,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        content: (
            <div className="flex flex-col items-center gap-4 py-4 w-full">
                <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-8 h-4 bg-purple-500/30 border border-purple-500/50 rounded-sm" />
                    ))}
                </div>
                <motion.div
                    animate={{ y: [20, -20, 20] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_white]"
                />
                <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-8 h-4 bg-cyan-500/30 border border-cyan-500/50 rounded-sm" />
                    ))}
                </div>
            </div>
        )
    },
    {
        title: "Arsenal Ultime",
        description: "En plus des classiques, découvrez le Bullet Time (Ralenti), le Bouclier Énergétique et le Laser Paddle ! Maîtrisez-les pour dominer l'IA.",
        icon: Zap,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        content: (
            <div className="flex flex-col items-center py-4">
                <div className="grid grid-cols-3 gap-4">
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                        className="w-12 h-12 bg-amber-500/20 border border-amber-500 rounded-xl flex items-center justify-center"
                    >
                        <Zap className="w-6 h-6 text-amber-500" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                        className="w-12 h-12 bg-blue-500/20 border border-blue-500 rounded-xl flex items-center justify-center"
                    >
                        <Shield className="w-6 h-6 text-blue-500" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                        className="w-12 h-12 bg-red-500/20 border border-red-500 rounded-xl flex items-center justify-center"
                    >
                        <Crosshair className="w-6 h-6 text-red-500" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                        className="w-12 h-12 bg-green-500/20 border border-green-500 rounded-xl flex items-center justify-center"
                    >
                        <Timer className="w-6 h-6 text-green-500" />
                    </motion.div>
                </div>
                <div className="mt-6 text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">NOUVELLES ARMES DÉTECTÉES</div>
            </div>
        )
    },
    {
        title: "Briques Spéciales",
        description: "Attention aux briques instables ! La TNT (Rouge) explose sur une large zone. La Golden (Or) est ultra-résistante mais offre une récompense garantie.",
        icon: Bomb,
        color: "text-red-500",
        bg: "bg-red-500/10",
        content: (
            <div className="flex gap-6 py-6 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-8 bg-gradient-to-br from-red-500 to-red-900 border-2 border-red-400 rounded-md shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse flex items-center justify-center" >
                        <span className="text-[10px]">🧨</span>
                    </div>
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">TNT (Explosif)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 border-2 border-yellow-200 rounded-md shadow-[0_0_20px_rgba(234,179,8,0.6)] flex items-center justify-center">
                        <Gem className="w-4 h-4 text-yellow-900" />
                    </div>
                    <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-tighter">Golden (Loot)</span>
                </div>
            </div>
        )
    },
    {
        title: "Gestion des Vies",
        description: "En mode Solo, vous disposez de 3 vies. Ne laissez pas la balle s'échapper par le bas ! Chaque erreur consomme une unité de protection.",
        icon: HelpCircle,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        content: (
            <div className="flex flex-col items-center py-4 gap-4">
                <div className="flex gap-4">
                    {[1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{ opacity: i === 3 ? [1, 0.2, 1] : 1 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500 flex items-center justify-center"
                        >
                            <span className="text-rose-500 font-bold">♥</span>
                        </motion.div>
                    ))}
                </div>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Alerte : Intégrité système</p>
            </div>
        )
    },
    {
        title: "Le Hub Social",
        description: "Connectez-vous avec vos amis ! Ajoutez-les via leur pseudo ou Code Vibe, et suivez qui est en ligne pour jouer.",
        icon: Users,
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
        content: (
            <div className="flex flex-col gap-3 py-2 w-full max-w-[200px]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs">
                        🦊
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="h-2 w-16 bg-white/20 rounded mb-1.5" />
                        <div className="h-1.5 w-10 bg-emerald-500/50 rounded-full" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 opacity-60">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs grayscale">
                        🐱
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="h-2 w-12 bg-white/10 rounded" />
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Multijoueur en Ligne",
        description: "Deux façons de jouer : invitez directement un ami connecté depuis le Hub Social, ou créez une salle privée dans le Lobby et partagez le code !",
        icon: Globe,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        content: (
            <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                <div className="relative bg-slate-900 border border-purple-500/30 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-xl">
                    <div className="text-[10px] uppercase text-purple-400 font-bold tracking-widest">Code Salle</div>
                    <div className="text-3xl font-black text-white tracking-widest font-mono">XK9L</div>
                    <div className="flex -space-x-2 mt-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900" />
                        ))}
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Mise à jour sur Android",
        description: "Si l'icône est ancienne sur votre écran d'accueil, voici comment la rafraîchir :",
        icon: Info,
        color: "text-orange-400",
        bg: "bg-orange-400/10",
        content: (
            <div className="flex flex-col gap-3 py-2 text-left w-full max-w-[280px]">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <p className="text-xs text-slate-300">Appuyez longuement sur l'icône de l'app sur votre écran d'accueil</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <p className="text-xs text-slate-300">Sélectionnez <span className="font-bold text-red-400">"Désinstaller"</span> ou <span className="font-bold text-red-400">"Supprimer"</span></p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">3</div>
                    <p className="text-xs text-slate-300">Retournez sur le site dans Chrome et cliquez <span className="font-bold text-emerald-400">"Ajouter à l'écran d'accueil"</span></p>
                </div>
                <p className="text-[9px] text-center text-slate-500 uppercase tracking-widest mt-2">La nouvelle icône apparaîtra !</p>
            </div>
        )
    }
];

export default function Tutorial({ isOpen, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const step = STEPS[currentStep];
    const Icon = step.icon;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="relative w-full max-w-md glass-premium overflow-hidden rounded-[3rem] shadow-2xl border-white/20"
                >
                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-skyjo-blue/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="p-8 pb-2 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-2xl shadow-inner ${step.bg}`}>
                                <Icon className={`w-6 h-6 ${step.color}`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-skyjo-blue uppercase tracking-[0.2em]">
                                    Guide de Jeu
                                </span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Étape {currentStep + 1} / {STEPS.length}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 flex gap-1 h-1 mb-4">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-skyjo-blue' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="px-8 py-4 flex flex-col items-center min-h-[320px]">
                        <h2 className="text-2xl font-black text-white text-center mb-3 tracking-tight">
                            {step.title}
                        </h2>
                        <p className="text-sm text-slate-400 text-center leading-relaxed">
                            {step.description}
                        </p>

                        <div className="flex-1 flex items-center justify-center w-full">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", damping: 15 }}
                            >
                                {step.content}
                            </motion.div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 flex gap-3">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="flex-1 h-12 rounded-2xl border-white/10 text-white font-bold"
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" />
                                RETOUR
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className="flex-[2] h-12 rounded-2xl bg-skyjo-blue hover:bg-skyjo-blue/90 font-black shadow-lg shadow-skyjo-blue/30"
                        >
                            {currentStep === STEPS.length - 1 ? "J'AI COMPRIS !" : "SUIVANT"}
                            {currentStep < STEPS.length - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
