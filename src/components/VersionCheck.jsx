import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';

export function VersionCheck() {
    const [serverVersion, setServerVersion] = useState(null);
    const [isOutdated, setIsOutdated] = useState(false);
    const clientVersion = __APP_VERSION__;

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch(`/api/version?t=${Date.now()}`);
                if (!res.ok) return;

                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    console.warn('[VERSION] Non-JSON response received');
                    return;
                }

                const data = await res.json();

                // If versions differ, force update
                if (data.version && data.version !== clientVersion) {
                    setServerVersion(data.version);
                    setIsOutdated(true);

                    // Force clean SW cache
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(function (registrations) {
                            for (let registration of registrations) {
                                registration.update();
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Version check failed:', err);
            }
        };

        // Check on mount
        checkVersion();

        // And every minute
        const interval = setInterval(checkVersion, 60000);
        return () => clearInterval(interval);
    }, [clientVersion]);

    if (!isOutdated) return null;

    const handleUpdate = () => {
        // Unregister SW to force fresh assets
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                }
            }).then(() => {
                window.location.reload(true);
            });
        } else {
            window.location.reload(true);
        }
    };

    return (
        <AnimatePresence>
            {isOutdated && (
                <motion.div
                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -50, x: '-50%' }}
                    className="fixed top-6 left-1/2 z-[200] w-[90%] max-w-xs cursor-pointer"
                    onClick={handleUpdate}
                >
                    <div className="relative group">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all animate-pulse" />

                        <div className="relative flex items-center gap-3 bg-slate-950/80 backdrop-blur-2xl border border-emerald-500/30 rounded-full p-2 pl-3 pr-4 shadow-2xl overflow-hidden">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                            <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 shrink-0">
                                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] leading-none mb-1">Update Ready</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-slate-400">v{clientVersion}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-600" />
                                    <span className="text-[11px] font-black text-white">v{serverVersion}</span>
                                </div>
                            </div>

                            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform">
                                <RefreshCw className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
