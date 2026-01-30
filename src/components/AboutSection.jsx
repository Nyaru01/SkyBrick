import React, { useState, useRef } from 'react';
import { Shield, Heart } from 'lucide-react';

export function AboutSection({ onAdminUnlock, appVersion = 'v2.1.0' }) {
    const [clickCount, setClickCount] = useState(0);
    const [showAdminInput, setShowAdminInput] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [adminCode, setAdminCode] = useState('');
    const clickTimeout = useRef(null);

    // In production, this should be validated via API call to avoid exposing hash in frontend bundle
    // For MVP/Local, we can use a simple client-side check or verify via the API immediately
    // Here we will use the API verification pattern to be secure

    const handleVersionClick = () => {
        setClickCount(prev => prev + 1);

        // Reset after 2s of inactivity
        if (clickTimeout.current) clearTimeout(clickTimeout.current);
        clickTimeout.current = setTimeout(() => setClickCount(0), 2000);

        if (clickCount + 1 >= 5) {
            setShowAdminInput(true);
            setClickCount(0);
        }
    };

    const handleAdminSubmit = () => {
        // We pass the code to parent to handle "Unlock" which typically means showing the dashboard
        // The Dashboard itself will use this code to authenticate API calls
        onAdminUnlock(adminCode);
    };

    return (
        <div className="glass-premium p-8 rounded-3xl shadow-2xl w-full max-w-md mx-auto relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-2xl -ml-12 -mb-12 rounded-full" />

            {/* Header Section (Compact) */}
            <div className="flex items-center gap-6 mb-8 relative z-10">
                <div className="relative group shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-600/20 via-indigo-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-xl border border-white/20 overflow-hidden transition-transform duration-500">
                        <img
                            src={`/info_premium.png?v=${Date.now()}`}
                            alt="Information"
                            className="w-full h-full object-cover rounded-2xl scale-110"
                        />
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl pointer-events-none" />
                    </div>
                </div>

                <div className="flex-1">
                    <h2 className="text-3xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        À Propos
                    </h2>
                    <div className="h-1 w-32 bg-indigo-500 mt-2 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                </div>
            </div>

            {/* Content Cards */}
            <div className="space-y-4 relative">
                <div
                    onClick={handleVersionClick}
                    className="group cursor-pointer select-none bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all active:scale-[0.98] duration-200"
                >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-black mb-1 opacity-80 group-hover:opacity-100 transition-opacity">Numéro de version</p>
                    <div className="flex items-center justify-between">
                        <p className="font-mono text-xl text-white group-hover:text-indigo-300 transition-colors uppercase tracking-widest">{appVersion}</p>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-black mb-1 opacity-80">Copyright</p>
                    <p className="text-lg font-bold text-white tracking-wide">© 2026 - Nyaru Games</p>
                </div>

                {/* Privacy Policy Toggle */}
                <button
                    onClick={() => setShowPrivacy(!showPrivacy)}
                    className="w-full group flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all active:scale-[0.98]"
                >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-black opacity-80 group-hover:opacity-100 transition-opacity">Politique de confidentialité</p>
                    <div className={`p-1 rounded-lg bg-white/5 transition-transform duration-300 ${showPrivacy ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {/* Privacy Content (Expandable) */}
                {showPrivacy && (
                    <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 text-left text-[11px] leading-relaxed text-white/70 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                        <h3 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Données & Confidentialité</h3>

                        <div className="space-y-4 font-medium">
                            <section>
                                <p className="text-indigo-400 font-bold mb-1 uppercase tracking-tighter">1. Informations que nous collectons</p>
                                <p className="mb-2 italic opacity-60">Certains partenaires tiers peuvent collecter automatiquement :</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Identifiants d'appareil (Advertising ID).</li>
                                    <li>Localisation approximative (IP).</li>
                                    <li>Données d'utilisation (sessions, progression, crashs).</li>
                                </ul>
                            </section>

                            <section>
                                <p className="text-indigo-400 font-bold mb-1 uppercase tracking-tighter">2. Utilisation des données</p>
                                <p>Fonctionnement du jeu, analyse technique, publicité non intrusive (si applicable) et équilibrage de l'expérience.</p>
                            </section>

                            <section>
                                <p className="text-indigo-400 font-bold mb-1 uppercase tracking-tighter">3. Partage & Tiers</p>
                                <p className="mb-2">Nous ne vendons pas vos données.</p>
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                    <p className="mb-1 opacity-60">Service tiers utilisé :</p>
                                    <a href="https://railway.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                        Railway.com <span className="text-[8px]">↗</span>
                                    </a>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* Credits Container */}
                <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-pink-400 font-black mb-3 text-center opacity-80">Remerciements & Amour &lt;3</p>
                    <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

                        <p className="text-center text-xs text-pink-100/90 leading-relaxed font-medium">
                            Un immense merci à l'équipe de choc pour leur participation et leur aide précieuse :
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 mt-4 text-[11px] font-bold text-white/80">
                            {[
                                'Vorlesne', 'Mymy', 'Max', 'Nico', 'Arnaud',
                                'Taib', 'Julien', 'Arthur', 'Léon'
                            ].map((name, i) => (
                                <span key={i} className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 hover:scale-105 transition-all cursor-default">
                                    {name}
                                </span>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-pink-500/10 flex justify-center">
                            <div className="px-5 py-2 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[10px] font-black uppercase tracking-widest hover:bg-pink-500/30 hover:scale-105 transition-all cursor-heart flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                ✨ Et surtout Melody <Heart className="w-3 h-3 fill-pink-400 text-pink-400 animate-pulse" /> ✨
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Easter Egg / Admin Input */}
            {showAdminInput && (
                <div className="mt-8 p-5 bg-slate-950/40 rounded-2xl border border-white/20 backdrop-blur-md animate-in slide-in-from-top-6 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Auth Terminal</span>
                    </div>

                    <div className="relative">
                        <input
                            id="admin-input"
                            type="password"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
                            placeholder="ADMIN_KEY"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-[0.3em] uppercase"
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={handleAdminSubmit}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        Connexion
                    </button>
                </div>
            )}
        </div>
    );
}
