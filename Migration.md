 Plan de migration
1. Préparation de la V2
Assurez-vous que votre V2 gère bien les données locales existantes :
javascript// Dans votre V2, ajoutez une migration des données localStorage vers PostgreSQL
const migrateLocalDataToDatabase = async () => {
  const localData = localStorage.getItem('user_data');
  
  if (localData && !localStorage.getItem('migrated_to_v2')) {
    try {
      // Envoyez les données au backend pour les sauvegarder
      await fetch('/api/migrate-local-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: localData
      });
      
      localStorage.setItem('migrated_to_v2', 'true');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
};

// Appelez cette fonction au démarrage de l'app
useEffect(() => {
  migrateLocalDataToDatabase();
}, []);
2. Mise à jour du Service Worker et PWA
Pour forcer la mise à jour de l'icône PWA :
javascript// service-worker.js - Changez la version
const CACHE_VERSION = 'v2.0.0'; // Incrémentez TOUJOURS la version

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force l'activation immédiate
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName); // Supprime l'ancien cache
          }
        })
      );
    })
  );
  return self.clients.claim(); // Prend le contrôle immédiatement
});
json// manifest.json - Assurez-vous de changer
{
  "name": "Votre App V2",
  "short_name": "App V2",
  "version": "2.0.0",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "start_url": "/?source=pwa",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000"
}


3. Déploiement sur Railway
Étapes à suivre :
bash# 1. Connectez-vous à votre projet V1 sur Railway


# 3. Liez votre projet V2 au service Railway V1
railway link [votre-project-id-v1]

# 4. Configurez les variables d'environnement
# Via le dashboard Railway, ajoutez :
# - DATABASE_PUBLIC_URL (fourni automatiquement par Railway PostgreSQL)
# - VAPID_PRIVATE_KEY
# - VAPID_PUBLIC_KEY

# 5. Déployez
railway up
Alternative via GitHub (recommandé) :
bash# 1. Poussez votre V2 sur une branche GitHub
git remote add origin [votre-repo-github]
git push origin main

# 2. Dans Railway Dashboard :
# - Allez dans votre projet V1
# - Settings > Disconnect (du repo actuel si différent)
# - Connect to GitHub > Sélectionnez votre nouveau repo V2
# - Railway redéploiera automatiquement
4. Ajout de PostgreSQL à l'environnement V1
Dans Railway Dashboard :

Allez dans votre projet V1
Cliquez sur "+ New" → "Database" → "Add PostgreSQL"
Railway créera automatiquement la variable DATABASE_URL
Copiez-la et ajoutez-la dans vos variables d'environnement

5. Configuration des variables VAPID
Si vous n'avez pas encore généré les clés VAPID :
bash# Installez web-push
npm install -g web-push

# Générez les clés
web-push generate-vapid-keys

# Ajoutez-les dans Railway Dashboard :
# VAPID_PUBLIC_KEY=...
# VAPID_PRIVATE_KEY=...
6. Forcer la mise à jour PWA côté utilisateur
Ajoutez ce code dans votre V2 :
javascript// App.jsx ou index.jsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              if (confirm('Une nouvelle version est disponible ! Recharger ?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      });
  }
}, []);
7. Checklist avant déploiement

 Changé la version dans manifest.json
 Changé la version du cache dans service-worker.js
 Testé la migration des données localStorage → PostgreSQL
 Configuré toutes les variables d'environnement sur Railway
 Testé l'application V2 localement
 Créé une sauvegarde des données utilisateurs si possible (export localStorage)
 Informé vos utilisateurs de la mise à jour imminente

8. Après le déploiement
Pour que l'icône PWA se mette à jour sur les appareils des utilisateurs :

La plupart des navigateurs mettent à jour automatiquement après quelques jours
Pour forcer, les utilisateurs peuvent :

Désinstaller la PWA et la réinstaller
Ou attendre la prochaine visite (le manifest sera rechargé)



Message de mise à jour à afficher :
javascript// Affichez une notification dans l'app
const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const version = localStorage.getItem('app_version');
    if (version !== '2.0.0') {
      setShowUpdate(true);
      localStorage.setItem('app_version', '2.0.0');
    }
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="update-banner">
      🎉 Bienvenue dans la V2 ! 
      Nouvelles fonctionnalités : [listez vos améliorations]
      <button onClick={() => setShowUpdate(false)}>OK</button>
    </div>
  );
};

⚠️ Points importants

Pas de backup Railway : C'est OK car vos utilisateurs V1 ont leurs données en local
Migration progressive : Vos utilisateurs garderont leurs données locales qui seront migrées vers PostgreSQL à leur prochaine visite
Icône PWA : Elle se mettra à jour automatiquement, mais peut prendre 24-48h selon les navigateurs