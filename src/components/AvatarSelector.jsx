import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { AVATARS } from '../lib/avatars';
import { Check } from 'lucide-react';

export default function AvatarSelector({ selectedId, onSelect, isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl p-6 max-w-sm w-full overflow-hidden"
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">Choisir un avatar</h3>
                    <p className="text-slate-400 text-sm">Sélectionnez votre personnage</p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-4 gap-3">
                    {AVATARS.map((avatar) => {
                        const isSelected = selectedId === avatar.id;
                        return (
                            <button
                                key={avatar.id}
                                onClick={() => onSelect(avatar.id)}
                                className={cn(
                                    "relative aspect-square rounded-full p-1 transition-all duration-200 group overflow-hidden",
                                    isSelected
                                        ? "bg-slate-900 ring-4 ring-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.5)] scale-110 z-10"
                                        : "bg-slate-900 border-2 border-slate-700/50 hover:border-sky-500/50 hover:scale-105"
                                )}
                            >
                                {/* Image Container with "Token" look */}
                                <div className="absolute inset-0 bg-slate-800/80 rounded-full overflow-hidden">
                                    <img
                                        src={avatar.path}
                                        alt={avatar.name}
                                        className={cn(
                                            "w-full h-full object-cover transition-transform duration-500",
                                            isSelected ? "scale-110" : "group-hover:scale-110"
                                        )}
                                    />
                                    {/* Glossy Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/20 to-white/0 opacity-50 pointer-events-none" />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full pointer-events-none" />
                                </div>

                                {isSelected && (
                                    <div className="absolute top-0 right-0 translate-x-1 -translate-y-1 bg-sky-500 text-white rounded-full p-1 shadow-lg animate-scale-in z-20 border-2 border-slate-900">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="mt-6 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                    Fermer
                </button>
            </motion.div>
        </div>
    );
}
