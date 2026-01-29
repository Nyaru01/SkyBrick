import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function IntroScreen({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Play brand sound
        const brandAudio = new Audio('/Sounds/brand-logo-intro-352299.mp3');
        brandAudio.volume = 0.5;

        // Play shuffling sound (as requested by user)
        const shuffleAudio = new Audio('/Sounds/shuffling.mp3');
        shuffleAudio.volume = 0.4;

        const playSounds = async () => {
            try {
                await brandAudio.play();
                // Slight delay for shuffling if needed, or concurrent
                setTimeout(() => shuffleAudio.play().catch(e => console.error(e)), 500);
            } catch (err) {
                console.error("Audio play failed:", err);
            }
        };

        playSounds();

        // Timer for 3 seconds visible + transition
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 800); // 800ms fade out transition
        }, 3000);

        return () => {
            clearTimeout(timer);
            brandAudio.pause();
            shuffleAudio.pause();
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative w-full max-w-md p-8"
                    >
                        <img
                            src="/intro_logo.png"
                            alt="Nyaru Studio"
                            className="w-full h-auto object-contain"
                            style={{ maskImage: 'radial-gradient(circle, black 60%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 100%)' }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
