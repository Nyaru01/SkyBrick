import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, HelpCircle, Info, Sparkles, Target, Zap, ArrowRight, Users, Globe } from 'lucide-react';
import { Button } from './ui/Button';
import SkyjoCard from './virtual/SkyjoCard';

const STEPS = [
    {
        title: "Bienvenue dans l'aventure",
        description: "Préparez-vous à une expérience Skyjo repensée. Je vais vous accompagner pour maîtriser l'art de la défausse et du scoring.",
        icon: Sparkles,
        color: "text-skyjo-blue",
        bg: "bg-skyjo-blue/10",
        content: (
            <div className="relative w-full h-40 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img src="/premium-bg.jpg" alt="Ambiance" className="w-full h-full object-cover scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-xs font-black text-white uppercase tracking-widest text-center">
                    Prêt à jouer ?
                </div>
            </div>
        )
    },
    {
        title: "L'art du score minimum",
        description: "Contrairement aux autres jeux, ici, CHAQUE POINT COMPTE... mais contre vous ! Votre mission : finir avec le score le plus bas.",
        icon: Target,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        content: (
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex gap-3">
                    {[-2, 0, 12].map((n, i) => (
                        <motion.div
                            key={n}
                            animate={{ y: n < 0 ? [0, -5, 0] : 0 }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                            className="relative z-10"
                        >
                            <SkyjoCard
                                card={{ id: `tut2-${i}`, value: n, color: n < 0 ? 'green' : n === 0 ? 'cyan' : 'red', isRevealed: true }}
                                size="sm"
                                isClickable={false}
                            />
                            <div className="absolute -bottom-6 left-0 right-0 text-center text-[8px] font-black uppercase text-slate-500">
                                {n < 0 ? 'Génial' : n === 0 ? 'Parfait' : 'Aïe'}
                            </div>
                        </motion.div>
                    ))}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-4">Visez les cartes vertes et bleues !</p>
            </div>
        )
    },
    {
        title: "Domptez votre Grille",
        description: "Votre terrain de jeu est une grille de 12 cartes (3x4). Vous ne connaissez que 2 cartes au départ. Le mystère fait partie du jeu.",
        icon: Info,
        color: "text-skyjo-blue",
        bg: "bg-skyjo-blue/10",
        content: (
            <div className="grid grid-cols-4 gap-2 py-4">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <SkyjoCard
                            card={[4, 7].includes(i) ? { id: `tut3-${i}`, value: 7, color: 'indigo', isRevealed: true } : { id: `tut3-${i}`, value: null, isRevealed: false }}
                            size="xs"
                            isClickable={false}
                        />
                    </motion.div>
                ))}
            </div>
        )
    },
    {
        title: "Le Combo Parfait",
        description: "Alignez 3 cartes identiques verticalement et toute la colonne disparaît (vaut 0 points).",
        icon: Zap,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        content: (
            <div className="flex flex-col gap-1 py-1 relative group items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full scale-50 group-hover:scale-100 transition-transform" />
                {[9, 9, 9].map((n, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: [1, 1.05, 1],
                            y: [0, -2, 0]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="relative z-10 -my-3" // Stacking plus serré pour gagner de la place
                    >
                        <SkyjoCard
                            card={{ id: `tut4-${i}`, value: n, color: 'red', isRevealed: true }}
                            size="xs"
                            isClickable={false}
                        />
                    </motion.div>
                ))}
                <div className="text-center text-emerald-400 font-black text-xs mt-2 z-10 tracking-widest animate-pulse">CLEAN !</div>
            </div>
        )
    },
    {
        title: "Attention au Final",
        description: "Dès qu'un joueur retourne sa dernière carte, les autres jouent un dernier tour, puis toutes les cartes sont révélées. Si le finisseur n'a pas le score le plus bas, son score DOUBLE !",
        icon: HelpCircle,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        content: (
            <div className="text-center py-4 space-y-4">
                <div className="flex items-center justify-center gap-4">
                    <div className="text-3xl font-bold text-slate-500 line-through decoration-red-500/50">15</div>
                    <ArrowRight className="text-white opacity-50 w-6 h-6" />
                    <div className="relative">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                            className="text-5xl font-black text-red-500"
                        >
                            30
                        </motion.div>
                        <div className="absolute -top-4 -right-8 bg-black/50 text-[10px] font-bold px-2 py-0.5 rounded-full text-red-400 border border-red-500/30 tracking-tight whitespace-nowrap">
                            x2 PENALTY
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ne finissez pas trop vite !</p>
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
