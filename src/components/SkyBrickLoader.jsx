import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
    "Initialisation du moteur physique...",
    "Génération des niveaux...",
    "Calibration du paddle...",
    "Chargement des bonus...",
    "Prêt à briser des briques ?"
];

const LoaderText = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % MESSAGES.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // Audio removed as it's now in IntroScreen

    return (
        <div className="h-6 flex items-center justify-center overflow-hidden mb-2">
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-sky-300 italic flex items-center gap-2"
                >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    {MESSAGES[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
};

export default function SkyBrickLoader({ progress = 0 }) {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
            {/* Background Image with Cinematic Zoom - Darker overlay */}
            <motion.div
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.4 }}
                transition={{ duration: 4, ease: "easeOut" }}
                className="absolute inset-0 bg-[url('/premium-bg.jpg')] bg-cover bg-center"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-900/90" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8">

                {/* Logo / Title Area */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12 flex flex-col items-center"
                >
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] via-[#9d00ff] to-[#00f2ff] drop-shadow-[0_0_15px_rgba(0,242,255,0.5)] tracking-tighter animate-pulse">
                        SKYBRICK
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-[#00f2ff] to-[#9d00ff] rounded-full mt-2 shadow-[0_0_10px_rgba(0,242,255,0.8)]" />
                </motion.div>

                {/* Progress Bar Container */}
                <div className="w-full space-y-4">

                    {/* Flavour Text - Cycling Interval */}
                    <LoaderText />

                    <div className="flex justify-between items-end px-1">
                        <span className="text-xs font-bold text-[#9E67F2] uppercase tracking-widest">Chargement</span>
                        <span className="text-xl font-black text-white tabular-nums">{Math.round(progress)}%</span>
                    </div>

                    {/* The Brick Bar */}
                    <div className="w-full h-8 flex gap-1 items-center justify-between">
                        {Array.from({ length: 20 }).map((_, i) => {
                            const isActive = i < Math.floor((Math.max(0, Math.min(100, progress)) / 100) * 20);
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: isActive ? 1 : 0.2,
                                        scale: isActive ? 1 : 0.8,
                                        backgroundColor: isActive ? '#00f2ff' : '#1e293b',
                                        boxShadow: isActive ? '0 0 10px #00f2ff, 0 0 20px #00f2ff' : 'none'
                                    }}
                                    transition={{ duration: 0.3, delay: i * 0.02 }}
                                    className="h-full flex-1 rounded-sm border border-white/10"
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
