import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Home } from "lucide-react";
import { useOnlineGameStore } from "../../store/onlineGameStore";
import { useVirtualGameStore } from "../../store/virtualGameStore";
import { Button } from "../ui/Button";

export default function HostLeftOverlay() {
    const error = useOnlineGameStore(s => s.error);
    const leaveRoom = useOnlineGameStore(s => s.leaveRoom);
    const resetLocalGame = useVirtualGameStore(s => s.resetGame);

    // Show overlay for ANY error that is critical (triggered by game_cancelled)
    // We assume if 'error' is set during a game, it's a cancellation reason
    const isCriticalError = !!error;

    // Auto-leave when host leaves to prevent stuck state
    useEffect(() => {
        if (isCriticalError) {
            const timer = setTimeout(() => {
                // leaveRoom will be called by store's startRedirection anyway
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isCriticalError]);

    const handleBackToMenu = () => {
        leaveRoom();
        resetLocalGame();
    };

    return (
        <AnimatePresence>
            {isCriticalError && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 p-8 text-center"
                    >
                        {/* Icon */}
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 ring-4 ring-red-500/20">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2">Partie Interrompue</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            {error || "La partie a été annulée."}
                        </p>

                        <Button
                            onClick={handleBackToMenu}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Retour au menu
                        </Button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
