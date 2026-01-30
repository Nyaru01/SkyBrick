# Vibrations dans Skyjo Score

## Support

- ✅ **Android** : Chrome, Firefox, Edge, Opera (navigateur + PWA installée).
- ❌ **iOS (iPhone/iPad)** : Non supporté par Safari ni les PWA installées (bloqué par Apple au niveau OS).

## Implémentation

Skyjo utilise l'API standard `Navigator.vibrate()` pour le retour haptique.

### Usage de base

```javascript
// Vibration simple de 200 millisecondes
if (navigator.vibrate) {
    navigator.vibrate(200);
}
```

### Patterns de Vibration

Nous utilisons différents patterns pour signifier différentes actions :

*   **Clic / Interaction simple** : `[10]` (Toctoc très court)
*   **Succès / Validation** : `[100, 50, 100]` (Vib - pause - Vib)
*   **Erreur / Alerte** : `[200, 100, 200, 100, 200]` (Buzz long répété)

## Limitations

*   **Mode Silencieux** : Sur certains appareils Android, si le système est en mode "Ne pas déranger" ou totalement silencieux, l'API de vibration peut être ignorée par le navigateur.
*   **Interaction Utilisateur** : Comme pour l'audio, les navigateurs récents bloquent parfois les vibrations si l'utilisateur n'a pas encore interagi avec la page (clic).
