# 🚀 Plan d'Amélioration SkyBrick (v2.0 Roadmap)

Ce document trace la la feuille de route pour les prochaines itérations du projet, de la finition immédiate aux nouvelles fonctionnalités majeures.

## 1. 🎨 Finitions & Polish (Court Terme)
Objectif : Rendre le jeu "Juicy" et professionnel.

- [ ] **Sound Design UI** :
    - Ajouter un son lors de la mise en Pause.
    - Ajouter un son au survol des boutons (hover).
    - Son de "Défaite" ou "Victoire" plus marqué.
- [ ] **Animations UI** :
    - Animation d'entrée pour le menu Pause (Slide-in / Fade-in smoother).
    - Transitions plus douces entre les modes de jeu.
    - Effet de "shake" sur le score quand il augmente.
- [ ] **Feedback Visuel** :
    - Particules plus riches lors de la destruction de briques (étincelles, éclats).
    - Effet de distorsion (chromatic aberration) lors des impacts violents ou bonus majeurs.

## 2. ⚡ Gameplay & Contenu (Moyen Terme)
Objectif : Enrichir la profondeur de jeu.

- [ ] **Nouveaux Bonus** :
    - 🧲 **Magnet** : La balle colle à la raquette (contrôle).
    - 👻 **Ghost Ball** : La balle traverse les briques sans rebondir (comme Super Ball mais invisible ?).
    - ☠️ **Malus** : Raquette réduite, Inversion des contrôles (pour le mode Versus).
- [ ] **Nouveaux Thèmes** :
    - Thème "Retro" (Pixel Art, Sons 8-bit).
    - Thème "Nature" (Briques en bois/pierre, sons organiques).
- [ ] **Mode Campagne (Solo)** :
    - Progression par niveaux (Layouts prédéfinis).
    - Boss de fin de monde (déjà initié, à approfondir).

## 3. 🌐 Online & Multijoueur (Long Terme)
Objectif : Robustesse et Compétition.

- [ ] **Stabilité** :
    - Gestion de la latence (Interpolation plus poussée des positions adverses).
    - Reconnexion automatique en cas de coupure.
- [ ] **Matchmaking** :
    - Système de Lobby plus avancé (Liste des parties publiques).
    - Chat rapide (Emotes) pendant la partie.
- [ ] **Mode Spectateur** :
    - Pouvoir regarder une partie en cours.

## 4. 📱 Mobile & PWA (Optimisation)
Objectif : Expérience native sur téléphone.

- [ ] **Contrôles Tactiles** :
    - Améliorer la sensibilité du Touch sur mobile.
    - Ajouter une zone de contrôle virtuelle (si le doigt cache l'écran).
- [ ] **Performance** :
    - Réduire la consommation batterie (mode "Low Power" ?).
    - Optimiser les rendus Canvas pour les écrans 120Hz.

---

## 🛠️ Maintenance Technique
- [ ] **Refactoring** :
    - Extraire la logique de physique (`update`) dans un hook personnalisé `useBreakoutPhysics`.
    - Nettoyer le fichier `VersusBreakout.jsx` qui commence à être massif (>1500 lignes).
- [ ] **Tests** :
    - Ajouter des tests unitaires pour la logique de collision.