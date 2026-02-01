import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SkyBrickCard from './SkyBrickCard';

/**
 * DiscardHistoryOverlay
 * Shows the last 3 cards from discard pile in a fan layout
 * Triggered by long-press on discard pile
 */
const DiscardHistoryOverlay = memo(function DiscardHistoryOverlay({
    cards = [],
    isVisible = false,
    onClose,
}) {
    if (!isVisible || cards.length === 0) return null;

    // Fan layout configuration
    const fanConfig = [
        { rotation: -15, offsetX: -50, offsetY: 8, zIndex: 1 },  // Oldest card (left)
        { rotation: 0, offsetX: 0, offsetY: 0, zIndex: 2 },       // Middle card
        { rotation: 15, offsetX: 50, offsetY: 8, zIndex: 3 },    // Newest card (right)
    ];

    // Get up to 3 most recent cards
    const displayCards = cards.slice(-3);

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop with blur - covers entire screen */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center"
                        onPointerUp={onClose}
                        onPointerLeave={onClose}
                        onTouchEnd={onClose}
                    >
                        {/* Centered container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.7, y: 30 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="relative pointer-events-none"
                        >
                            {/* Label */}
                            <div className="text-center mb-6">
                                <span className="text-sm font-bold text-white uppercase tracking-wider bg-black/40 px-4 py-2 rounded-full">
                                    📜 Dernières défaussées
                                </span>
                            </div>

                            {/* Cards in fan */}
                            <div className="relative flex items-center justify-center" style={{ width: 200, height: 130 }}>
                                {displayCards.map((card, index) => {
                                    // Adjust config index based on number of cards
                                    const configIndex = displayCards.length === 1
                                        ? 1
                                        : displayCards.length === 2
                                            ? (index === 0 ? 0 : 2)
                                            : index;
                                    const config = fanConfig[configIndex];

                                    return (
                                        <motion.div
                                            key={card.id || index}
                                            initial={{
                                                rotate: 0,
                                                x: 0,
                                                y: 40,
                                                opacity: 0,
                                                scale: 0.6
                                            }}
                                            animate={{
                                                rotate: config.rotation,
                                                x: config.offsetX,
                                                y: config.offsetY,
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            exit={{
                                                rotate: 0,
                                                x: 0,
                                                y: 40,
                                                opacity: 0,
                                                scale: 0.6
                                            }}
                                            transition={{
                                                type: 'spring',
                                                damping: 18,
                                                stiffness: 250,
                                                delay: index * 0.06
                                            }}
                                            className="absolute"
                                            style={{
                                                zIndex: config.zIndex,
                                                transformOrigin: 'center bottom',
                                            }}
                                        >
                                            <SkyBrickCard
                                                card={{ ...card, isRevealed: true }}
                                                size="lg"
                                                isClickable={false}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Card count indicator */}
                            <div className="text-center mt-6">
                                <span className="text-sm text-white/70">
                                    {displayCards.length} / {cards.length} cartes
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

export default DiscardHistoryOverlay;
