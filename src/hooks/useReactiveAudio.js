import { useRef, useEffect, useState, useCallback } from 'react';

export const useReactiveAudio = (audioUrl, enabled = true) => {
    const audioContextRef = useRef(null);
    const audioRef = useRef(null);
    const sourceRef = useRef(null);
    const analyserRef = useRef(null);
    const [audioData, setAudioData] = useState(new Uint8Array(0));
    const animationFrameRef = useRef();

    useEffect(() => {
        if (!enabled || !audioUrl) return;

        const initAudio = () => {
            // Re-use global AudioContext if possible/desired, but separate for music is okay
            // Actually better to check if one exists or create new
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            if (!audioRef.current) {
                audioRef.current = new Audio();
                audioRef.current.src = audioUrl;
                audioRef.current.loop = true;
                audioRef.current.crossOrigin = "anonymous";
                audioRef.current.volume = 0.5;
            }

            if (!analyserRef.current) {
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
            }

            // Connect only if not already connected
            if (!sourceRef.current && audioRef.current && audioContextRef.current) {
                try {
                    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                    sourceRef.current.connect(analyserRef.current);
                    analyserRef.current.connect(audioContextRef.current.destination);
                } catch (e) {
                    console.error("Audio graph setup failed", e);
                }
            }
        };

        initAudio();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [audioUrl, enabled]);

    const play = async () => {
        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        audioRef.current?.play().catch(e => console.log("Unlock required", e));
    };

    const stop = () => {
        audioRef.current?.pause();
    };

    const getBass = () => {
        if (!analyserRef.current) return 0;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Average of first few bins (Bass)
        let sum = 0;
        for (let i = 0; i < 5; i++) {
            sum += dataArray[i];
        }
        return sum / 5; // 0-255
    };

    return { play, stop, getBass };
};
