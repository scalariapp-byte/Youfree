# Youfree

Client web pour regarder YouTube **sans pubs dans le flux, sans jeux (Playables), sans Shorts imposés**, avec un accueil chronologique basé sur tes abonnements. Utilisable **avec ton compte Google** ou **sans compte**.

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

## Démarrer

```bash
npm install
cp .env.example .env   # optionnel : tu peux aussi saisir les clés dans Réglages
npm run dev
```

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

React 19, React Router (HashRouter, compatible hébergement statique), Vite, TypeScript. Aucun serveur : tout tourne dans le navigateur, les données personnelles restent en `localStorage`.
