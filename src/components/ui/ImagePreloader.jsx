import { useState, useEffect } from 'react';
import SkyjoLoader from '../SkyjoLoader';

const CRITICAL_IMAGES = [
    '/card-back.png?v=2',
    '/card-back-papyrus.jpg',
    '/card-back-neon.png',
    '/card-back-cyberpunk.png',
    '/card-back-carbon.png',
    '/card-back-obsidian.png',
    '/card-back-gold.png',
    '/card-back-galaxy.png',
    '/card-snow.png',
    '/bg-skyjo.png',
    '/premium-bg.jpg',
    '/virtual-logo.jpg',
    '/logo.jpg',
    '/virtual-logo2.jpg',
    // Avatar images
    '/avatars/cat.png?v=2',
    '/avatars/dog.png?v=2',
    '/avatars/fox.png?v=2',
    '/avatars/bear.png?v=2',
    '/avatars/panda.png?v=2',
    '/avatars/lion.png?v=2',
    '/avatars/frog.png?v=2',
    '/avatars/monkey.png?v=2'
];

const CRITICAL_AUDIO = [
    '/Sounds/Start.mp3',
    '/Sounds/victory.mp3',
    '/Sounds/whoosh-radio-ready-219487.mp3',
    '/Music/track-344542.mp3',
    '/Music/scizzie - aquatic ambience.mp3',
    '/Music/reveil-239031.mp3'
];

export default function ImagePreloader({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [realProgress, setRealProgress] = useState(0);
    const [visualProgress, setVisualProgress] = useState(0);

    useEffect(() => {
        let mounted = true;
        let loadedCount = 0;
        const total = CRITICAL_IMAGES.length + CRITICAL_AUDIO.length;
        const startTime = Date.now();
        const minLoadingTime = 8500; // 3s Intro + 5s Loading Screen

        // Simulation timer for visual progress (0 -> 100 over minLoadingTime)
        const progressInterval = setInterval(() => {
            if (!mounted) return;
            const elapsedTime = Date.now() - startTime;
            const timeRatio = Math.min(1, elapsedTime / minLoadingTime);
            setVisualProgress(Math.round(timeRatio * 100));
        }, 50);

        const handleAssetLoad = () => {
            if (!mounted) return;
            loadedCount++;
            setRealProgress(Math.round((loadedCount / total) * 100));

            if (loadedCount === total) {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

                setTimeout(() => {
                    if (mounted) setIsLoading(false);
                    clearInterval(progressInterval);
                }, remainingTime);
            }
        };

        // Start loading all images
        CRITICAL_IMAGES.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = handleAssetLoad;
            img.onerror = handleAssetLoad;
        });

        // Start loading all audio
        CRITICAL_AUDIO.forEach(src => {
            const audio = new Audio();
            audio.src = src;
            audio.oncanplaythrough = handleAssetLoad;
            audio.onerror = handleAssetLoad;
            audio.load(); // Force load
        });

        return () => {
            mounted = false;
        };
    }, []);

    const displayProgress = Math.min(realProgress, visualProgress);

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 z-[9999]">
                    <SkyjoLoader progress={displayProgress} />
                </div>
            )}
            <div
                style={{
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.5s ease-in-out',
                    visibility: isLoading ? 'hidden' : 'visible'
                }}
            >
                {children}
            </div>
        </>
    );
}
