import React, { useState } from 'react';
import { X, Send, Bug, Lightbulb, MessageSquare, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FEEDBACK_TYPES = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
    { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-500' },
    { value: 'other', label: 'Autre', icon: MessageSquare, color: 'text-blue-500' }
];

export function FeedbackModal({ isOpen, onClose, username }) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [type, setType] = useState('suggestion');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setContent('');
            setType('suggestion');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (content.trim().length < 10) {
            toast.error('Merci d\'écrire au moins 10 caractères');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username || 'Anonyme',
                    content: content.trim(),
                    type,
                    device_info: {
                        userAgent: navigator.userAgent,
                        screen: `${window.screen.width}x${window.screen.height}`,
                        language: navigator.language
                    }
                })
            });

            // Handle server errors (non-200 responses)
            if (!response.ok) {
                // Try to parse error message from JSON, fallback to generic error
                let errorMessage = 'Erreur lors de l\'envoi';
                try {
                    const data = await response.json();
                    if (data && data.error) errorMessage = data.error;
                } catch { }
                throw new Error(errorMessage);
            }

            // Success path
            // We can safely assume success if status is 200-299, even if response body parsing fails
            setIsSuccess(true);
            // playVictory && playVictory(); // Optional: play sound if available (undefined check safe)
            setContent('');

        } catch (error) {
            console.error('[FEEDBACK ERROR]', error);
            // Show the actual error message if manageable, otherwise generic
            toast.error(error.message || 'Erreur réseau. Réessaie plus tard.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-premium rounded-[2.5rem] shadow-2xl max-w-xl w-full border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Header with Decorative Blob */}
                <div className="relative p-8 pb-4">
                    <div className="absolute top-0 right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full -mt-16" />

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Feedback</h2>
                            <p className="text-white/50 text-sm mt-1 font-medium tracking-wide">Aide-nous à rendre SkyJo légendaire</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90 border border-white/10 shadow-lg"
                        >
                            <X className="w-5 h-5 text-white/70" />
                        </button>
                    </div>
                </div>

                {isSuccess ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 relative z-10 animate-in zoom-in-50 duration-500">
                        <div className="w-24 h-24 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Message Reçu !</h3>
                            <p className="text-slate-300 max-w-xs mx-auto">Merci pour ton aide précieuse. Ton retour a été transmis directement aux développeurs ! 🚀</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10"
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-8 relative z-10">
                        {/* Type Selection - Premium Cards */}
                        <div>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400">Expérience Type</label>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {FEEDBACK_TYPES.map(({ value, label, icon: Icon, color }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setType(value)}
                                        className={`
                                            relative p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group overflow-hidden
                                            ${type === value
                                                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                                : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        {/* Active Glow */}
                                        {type === value && (
                                            <div className="absolute top-0 right-0 w-2 h-2 m-3 rounded-full bg-blue-400 animate-pulse" />
                                        )}

                                        <div className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${type === value ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                                            <Icon className={`w-6 h-6 ${type === value ? 'text-blue-400' : color}`} />
                                        </div>
                                        <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${type === value ? 'text-blue-300' : 'text-white/50 group-hover:text-white/80'}`}>
                                            {label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content - Modern Deep Textarea */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-purple-400">Détails du Signal</label>
                            </div>
                            <div className="relative group">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Dis-nous tout... bug, idée de génie ou simple bug ?"
                                    className="w-full bg-slate-950/40 border border-white/10 rounded-3xl px-6 py-5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium leading-relaxed resize-none"
                                    rows={5}
                                    maxLength={5000}
                                    required
                                />
                                {/* Counter overlay */}
                                <div className="absolute bottom-4 right-6 text-[10px] font-mono text-white/20 group-focus-within:text-blue-400/50 transition-colors tracking-tighter">
                                    CH_COUNT_{content.length}_5000
                                </div>
                            </div>
                        </div>

                        {/* Submit - Action Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || content.trim().length < 10}
                                className="relative w-full group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />

                                <div className="relative flex items-center gap-3">
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            <span>Initialisation_Envoi</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            <span>Envoyer_Feedback</span>
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>
                    </form>
                )}
            </div >
        </div >
    );
}
