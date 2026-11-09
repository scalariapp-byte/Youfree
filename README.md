# Youfree

Client pour regarder YouTube **sans pubs dans le flux, sans jeux (Playables), sans Shorts imposés**, avec un accueil chronologique basé sur tes abonnements. Utilisable **avec ton compte Google** ou **sans compte**.

## Deux façons de l'utiliser

| | App Android (APK) | Site web |
|---|---|---|
| Clé API | **Aucune** : le téléphone interroge YouTube directement | Clé API gratuite obligatoire |
| Quota | Aucun | 10 000 unités/jour |
| Connexion Google | Non (Google bloque la connexion dans les WebViews) | Oui |
| Serveur | Aucun | Aucun (hébergement statique) |

**Télécharger l'APK** : [Releases → android-latest](https://github.com/scalariapp-byte/Youfree/releases/tag/android-latest) (construit automatiquement par GitHub Actions).

### Comment marche le mode sans clé

Le navigateur interdit à une page web d'interroger youtube.com (CORS). Dans l'app Android, les requêtes passent par la couche HTTP native du téléphone (Capacitor), qui n'a pas cette restriction. L'app parle à l'API interne de YouTube (InnerTube, via [youtubei.js](https://github.com/LuanRT/YouTube.js)), comme NewPipe ou FreeTube. Aucune donnée ne passe par un serveur tiers.

Limites de ce mode :
- il repose sur une API non documentée : si YouTube change son format, certaines pages peuvent casser jusqu'à une mise à jour de youtubei.js ;
- YouTube a supprimé la page Tendances en 2025 : l'onglet « Tendances » affiche les vidéos les plus populaires de la semaine par thème (recherche) ;
- dates approximatives (« il y a 3 jours ») et pas de nombre de « j'aime » dans les listes ;
- utiliser l'API interne est contraire aux conditions d'utilisation de YouTube.

## Fonctionnalités

- **Accueil sans algorithme** : « Reprendre » (là où tu t'es arrêté), nouveautés de tes abonnements triées par date, puis tendances.
- **Tendances par thème** (Musique, Actualités, Science, Éducation…) — la catégorie Jeux vidéo n'est pas proposée.
- **Filtres** : masquer les Shorts (≤ 60 s ou #shorts), masquer la catégorie Jeux vidéo.
- **Avec compte Google** (lecture seule) : abonnements, vidéos aimées, playlists.
- **Sans compte** : abonnements locaux, import Google Takeout (`subscriptions.csv`).
- Historique avec reprise de lecture, « Regarder plus tard », export/import d'une sauvegarde JSON.
- Recherche, ou collage direct d'un lien YouTube. Horodatages cliquables dans la description.
- Deux lecteurs : YouTube *nocookie* (par défaut) ou une instance **Invidious** (zéro pub).
- Thème clair/sombre automatique, responsive mobile.

## Limites (à connaître)

- **Publicités** : le lecteur intégré YouTube (`youtube-nocookie.com`) affiche beaucoup moins de pubs que youtube.com, mais YouTube peut encore en insérer sur certaines vidéos monétisées. Pour zéro pub garanti, choisis le lecteur **Invidious** dans Réglages (dépend d'un serveur tiers, parfois lent ou bloqué). Contourner les pubs est contraire aux conditions d'utilisation de YouTube.
- **Quota API** : 10 000 unités/jour par clé. Une recherche coûte ~101 unités (≈ 95 recherches/jour), les tendances et le fil d'abonnements ~1 unité par chaîne. Le fil est mis en cache 15 min.
- La connexion Google est en **lecture seule** : s'abonner depuis Youfree crée un abonnement local, pas sur ton compte YouTube.

## Construire l'APK soi-même

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug   # nécessite JDK 21 + Android SDK
# → android/app/build/outputs/apk/debug/app-debug.apk
```

## Démarrer (web)

```bash
npm install
cp .env.example .env   # optionnel : tu peux aussi saisir les clés dans Réglages
npm run dev
```

En `npm run dev`, le mode sans clé fonctionne aussi sur ordinateur grâce au proxy de développement de Vite (`/__yt`). Ce proxy n'existe pas sur le site publié.

### Obtenir les identifiants (gratuit)

1. [console.cloud.google.com](https://console.cloud.google.com/) → nouveau projet.
2. *API et services → Bibliothèque* → activer **YouTube Data API v3**.
3. *Identifiants → Créer → Clé API* → `VITE_YT_API_KEY`. Restreins-la à l'API YouTube et au référent HTTP de ton site (la clé est visible dans le navigateur, c'est normal pour une app statique).
4. Pour la connexion Google : *Écran de consentement OAuth* (Externe, ajoute ton adresse comme utilisateur test), puis *Créer → ID client OAuth → Application Web*, origine autorisée = l'URL du site (ex. `http://localhost:5173`, `https://<user>.github.io`) → `VITE_GOOGLE_CLIENT_ID`.

## Déployer sur GitHub Pages

1. *Settings → Pages → Source : GitHub Actions*.
2. *Settings → Secrets and variables → Actions* : ajoute `VITE_YT_API_KEY` et `VITE_GOOGLE_CLIENT_ID`.
3. Pousse sur `main` : le workflow `.github/workflows/deploy.yml` construit et publie.

## Stack

React 19, React Router (HashRouter), Vite, TypeScript, Capacitor (Android), youtubei.js. Aucun serveur : tout tourne sur l'appareil, les données personnelles restent en `localStorage`.
