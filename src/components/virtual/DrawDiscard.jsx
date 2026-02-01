import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SkyBrickCard from './SkyBrickCard';
import { cn } from '../../lib/utils';

/**
 * Draw and Discard Piles Component
 * Central area with draw pile and discard pile
 */
const DrawDiscard = memo(function DrawDiscard({
    drawPileCount,
    discardTop,
    drawnCard,
    canDraw = false,
    canTakeDiscard = false,
    canDiscardDrawn = false, // Can click discard pile to discard drawn card
    onDrawClick,
    onDiscardClick,
    onDiscardDrawnCard, // Handler for discarding the drawn card
    lastDiscardedCard = null, // New: card that was just discarded (for animation)
}) {
    // Track animation state for new discard
    const [showNewDiscardGlow, setShowNewDiscardGlow] = useState(false);
    const [discardKey, setDiscardKey] = useState(0);

    // Trigger animation when lastDiscardedCard changes
    useEffect(() => {
        if (lastDiscardedCard) {
            setShowNewDiscardGlow(true);
            setDiscardKey(prev => prev + 1);
            const timer = setTimeout(() => {
                setShowNewDiscardGlow(false);
            }, 1500); // Glow lasts 1.5 seconds
            return () => clearTimeout(timer);
        }
    }, [lastDiscardedCard]);

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-6 py-1.5 sm:py-3">
            {/* Draw Pile - 3D Stacked Effect */}
            <div className="flex flex-col items-center gap-1">
                <motion.button
                    onClick={onDrawClick}
                    disabled={!canDraw}
                    className={cn(
                        "relative",
                        canDraw && "cursor-pointer",
                        !canDraw && "cursor-not-allowed opacity-60"
                    )}
                    whileHover={canDraw ? { scale: 1.08, y: -4 } : undefined}
                    whileTap={canDraw ? { scale: 0.95 } : undefined}
                >
                    {/* 3D Stacked cards effect - multiple layers */}
                    <div
                        className="absolute rounded-xl bg-slate-800"
                        style={{
                            width: 'clamp(2.3rem, 6.9vw, 4rem)',
                            height: 'clamp(3.16rem, 9.2vh, 5.75rem)',
                            top: '6px',
                            left: '6px',
                            borderRadius: '12px',
                            opacity: 0.3,
                        }}
                    />
                    <div
                        className="absolute rounded-xl bg-slate-700"
                        style={{
                            width: 'clamp(2.3rem, 6.9vw, 4rem)',
                            height: 'clamp(3.16rem, 9.2vh, 5.75rem)',
                            top: '3px',
                            left: '3px',
                            borderRadius: '12px',
                            opacity: 0.5,
                        }}
                    />

                    {/* Top card (back) */}
                    <div
                        className="relative flex items-center justify-center"
                        style={{
                            width: 'clamp(2.3rem, 6.9vw, 4rem)',
                            height: 'clamp(3.16rem, 9.2vh, 5.75rem)',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #374151 0%, #1e293b 50%, #0f172a 100%)',
                            boxShadow: canDraw
                                ? '0 0 20px rgba(52, 211, 153, 0.5), 0 4px 16px rgba(0, 0, 0, 0.4)'
                                : '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
                            border: canDraw ? '2px solid rgba(52, 211, 153, 0.7)' : '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        {/* Abstract card stack icon - displayed directly without wrapper */}
                        <svg className="w-2/3 h-2/3" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="1" width="12" height="16" rx="2" fill="#475569" stroke="#64748b" strokeWidth="0.8" />
                            <rect x="6" y="4" width="12" height="16" rx="2" fill="#334155" stroke="#475569" strokeWidth="0.8" />
                            <rect x="9" y="7" width="12" height="16" rx="2" fill="url(#pileGrad2)" stroke="#34d399" strokeWidth="0.8" />
                            <defs>
                                <linearGradient id="pileGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#0d9488" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </motion.button>

                <span className="text-xs font-bold text-slate-300" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    Pioche <span className="text-emerald-400">({drawPileCount})</span>
                </span>
            </div>

            {/* Drawn Card (when holding) */}
            <AnimatePresence>
                {drawnCard && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1.1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-400/30 rounded-xl blur-md" />
                            <SkyBrickCard
                                card={drawnCard}
                                size="md"
                                isHighlighted
                            />
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-bounce">
                            Carte piochée
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Discard Pile */}
            <div className="flex flex-col items-center gap-2">
                <motion.button
                    onClick={canDiscardDrawn ? onDiscardDrawnCard : onDiscardClick}
                    disabled={!canTakeDiscard && !canDiscardDrawn}
                    className={cn(
                        "relative",
                        (canTakeDiscard || canDiscardDrawn) && "cursor-pointer",
                        (!canTakeDiscard && !canDiscardDrawn) && "cursor-not-allowed"
                    )}
                    whileHover={(canTakeDiscard || canDiscardDrawn) ? { scale: 1.05 } : undefined}
                    whileTap={(canTakeDiscard || canDiscardDrawn) ? { scale: 0.95 } : undefined}
                >
                    {discardTop ? (
                        <div className="relative">
                            {/* Glow effect for newly discarded card */}
                            <AnimatePresence>
                                {showNewDiscardGlow && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1.2 }}
                                        exit={{ opacity: 0, scale: 1.4 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-xl blur-lg -z-10"
                                    />
                                )}
                            </AnimatePresence>

                            <motion.div
                                key={discardKey}
                                initial={discardKey > 0 ? { scale: 1.3, opacity: 0 } : false}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                className={cn(
                                    "rounded-xl",
                                    canTakeDiscard && "ring-2 ring-blue-400 animate-pulse",
                                    canDiscardDrawn && "ring-2 ring-orange-400 animate-pulse"
                                )}
                            >
                                <SkyBrickCard card={discardTop} size="md" />
                            </motion.div>
                        </div>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center"
                            style={{
                                width: 'clamp(2.3rem, 6.9vw, 4rem)',
                                height: 'clamp(3.16rem, 9.2vh, 5.75rem)',
                                borderRadius: '12px',
                                background: canDiscardDrawn
                                    ? 'rgba(251, 146, 60, 0.15)'
                                    : 'rgba(71, 85, 105, 0.2)',
                                backdropFilter: 'blur(8px)',
                                border: canDiscardDrawn
                                    ? '2px dashed rgba(251, 146, 60, 0.6)'
                                    : '2px dashed rgba(100, 116, 139, 0.4)',
                                boxShadow: canDiscardDrawn
                                    ? '0 0 15px rgba(251, 146, 60, 0.3), inset 0 0 20px rgba(251, 146, 60, 0.1)'
                                    : 'inset 0 0 10px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            {/* Deposit icon */}
                            <svg
                                className={cn(
                                    "w-4 h-4 mb-0.5",
                                    canDiscardDrawn ? "text-orange-400" : "text-slate-500"
                                )}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M12 5v14M5 12l7 7 7-7" />
                            </svg>
                            <span className={cn(
                                "text-[7px] font-medium",
                                canDiscardDrawn ? "text-orange-400" : "text-slate-500"
                            )}>
                                {canDiscardDrawn ? "Déposer" : "Vide"}
                            </span>
                        </div>
                    )}
                </motion.button>

                <span className="text-xs font-bold text-slate-300" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    Défausse
                </span>
            </div>
        </div>
    );
});

export default DrawDiscard;
