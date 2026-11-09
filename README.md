# Youfree

Application Android pour regarder YouTube **sans pub, sans compte, sans clé** : le téléphone interroge YouTube et lit les flux lui-même. Aucun serveur intermédiaire.

**Télécharger** : [youfree.apk](https://github.com/scalariapp-byte/Youfree/releases/download/android-latest/youfree.apk) (publié automatiquement à chaque modification ; l'appli signale les nouvelles versions à l'ouverture).

## Fonctionnalités

- Lecteur sans pub (flux lus directement, choix de qualité), repli sur le lecteur intégré si besoin.
- Accueil par thèmes, nouveautés des abonnements dans l'ordre chronologique, pas de jeux.
- Shorts : lecteur vertical à défilement, étagères, onglet par chaîne.
- Recherche : suggestions, historique, filtres (date, durée, popularité), scroll infini.
- Affichage instantané (cache), préchargement au toucher, pages chargées à la demande.
- Abonnements, historique avec reprise, « Plus tard », import Google Takeout, sauvegarde JSON.
- Diagnostic intégré (Réglages → Diagnostic).

## Fonctionnement

Un navigateur ne peut pas interroger youtube.com (CORS). Dans l'app, les requêtes passent par la couche HTTP native du téléphone (Capacitor) et l'API interne de YouTube (InnerTube, via [youtubei.js](https://github.com/LuanRT/YouTube.js)), comme NewPipe ou FreeTube.

Limites : API non documentée (une mise à jour de YouTube peut casser une fonction jusqu'à correction) ; usage contraire aux conditions d'utilisation de YouTube ; la page « Tendances » n'existant plus côté YouTube, l'onglet montre les vidéos populaires de la semaine par thème.

## Développement

```bash
npm install
npm run dev          # sur ordinateur, via le proxy de développement Vite (/__yt)
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease   # JDK 21 + Android SDK
```

La clé de signature `android/app/youfree-test.keystore` est volontairement publique (APK de test, mises à jour installables par-dessus). Pour une publication sur un store, utiliser une clé privée.

Stack : React 19, React Router, Vite, TypeScript, Capacitor, youtubei.js.
