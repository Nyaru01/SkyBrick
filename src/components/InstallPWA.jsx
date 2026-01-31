import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPWA({ className, triggerData }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSHint, setShowIOSHint] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIosDevice);

        // Capture event for Android/Desktop
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        if (isInstalled) {
            setShowInstallBtn(false);
        }

        // --- DEMO MODE FOR LOCALHOST (Remove in Prod if needed, but useful for testing) ---
        // if (import.meta.env.DEV) {
        //    setShowInstallBtn(true);
        // }
        // ---------------------------------------------------------------------------------

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSHint(true);
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response to the install prompt: ${outcome}`);

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallBtn(false);
        }
    };

    if (!showInstallBtn && !showIOSHint) return null;

    return (
        <AnimatePresence>
            {(showInstallBtn || showIOSHint) && (
                <>
                    {/* The Button */}
                    {!showIOSHint && (
                        <button
                            onClick={handleInstallClick}
                            className={className || "group flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"}
                        >
                            <Download className="w-4 h-4 text-[#9850E1]" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Installer l'app</span>
                        </button>
                    )}

                    {/* iOS Instructions Modal */}
                    {showIOSHint && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowIOSHint(false)}>
                            <motion.div
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <button onClick={() => setShowIOSHint(false)} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center text-center">
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl mb-4">
                                        <Smartphone className="w-10 h-10 text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2">Installer sur iOS</h3>
                                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                                        Pour installer l'application sur votre iPhone ou iPad :
                                    </p>

                                    <div className="space-y-4 w-full text-left bg-white/5 rounded-2xl p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold">1</div>
                                            <p className="text-sm text-slate-300">Appuyez sur <span className="font-bold text-white">Partager</span> <span className="inline-block align-middle"><svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="ml-1"><path d="M7 1V11M7 1L1 7M7 1L13 7M1 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span></p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold">2</div>
                                            <p className="text-sm text-slate-300">Cherchez <span className="font-bold text-white">Sur l'écran d'accueil</span> <span className="inline-block align-middle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><rect x="2" y="2" width="20" height="20" rx="4" ry="4" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg></span></p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold">3</div>
                                            <p className="text-sm text-slate-300">Appuyez sur <span className="font-bold text-white">Ajouter</span></p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
