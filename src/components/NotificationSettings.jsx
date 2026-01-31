import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

const NotificationSettings = () => {
    const {
        isSupported,
        isSubscribed,
        permission,
        requestPermission,
        unsubscribe
    } = usePushNotifications();

    if (!isSupported) {
        return (
            <div className="p-4 bg-red-100/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">❌ Les notifications push ne sont pas supportées sur cet appareil.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        🔔 Notifications
                    </h3>
                    <p className="text-white/60 text-sm mt-1">
                        Recevez des notifications quand un ami vous invite à jouer
                    </p>
                </div>
            </div>

            <div className="pt-2">
                {permission === 'default' && (
                    <button
                        onClick={requestPermission}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                    >
                        Activer les notifications
                    </button>
                )}

                {permission === 'denied' && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300 text-sm">
                        ⚠️ Vous avez refusé les notifications.
                        Pour les activer, veuillez vérifier les paramètres de votre navigateur.
                    </div>
                )}

                {permission === 'granted' && !isSubscribed && (
                    <button
                        onClick={requestPermission}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                        <span>S'abonner aux notifications</span>
                    </button>
                )}

                {permission === 'granted' && isSubscribed && (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-400">
                            <span>✅ Notifications activées</span>
                        </div>
                        <button
                            onClick={unsubscribe}
                            className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded border border-red-500/30 transition-colors"
                        >
                            Désactiver
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationSettings;
