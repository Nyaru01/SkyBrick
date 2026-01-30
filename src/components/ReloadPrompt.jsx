import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW Registration Error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    React.useEffect(() => {
        if (needRefresh) {
            toast((t) => (
                <div className="flex flex-col gap-3 min-w-[280px]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 animate-spin-slow">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-black text-white text-sm">Mise à jour disponible !</h4>
                            <p className="text-white/60 text-[10px]">Version 2.0 prête à l'installation.</p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Mettre à jour
                        </button>
                        <button
                            onClick={() => {
                                close();
                                toast.dismiss(t.id);
                            }}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            ), {
                duration: Infinity, // Ne disparait pas tout seul
                position: 'bottom-right',
                style: {
                    background: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '16px',
                },
            });
        }
    }, [needRefresh, updateServiceWorker]);

    return null; // Le composant ne rend rien visuellement, il utilise toast()
}
