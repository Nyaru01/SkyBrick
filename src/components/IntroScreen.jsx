import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function IntroScreen({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Play sound
        const audio = new Audio('/Sounds/brand-logo-intro-352299.mp3');
        audio.volume = 0.5; // Reasonable volume
        audio.play().catch(err => console.error("Audio play failed:", err));

        // Timer for 3.5 seconds (slightly longer than 3s to allow fade out)
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for exit animation
        }, 3000);

        return () => {
            clearTimeout(timer);
            audio.pause(); // Cleanup if unmounted early
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
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
                            className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
