# Mon Prof de Poche

Application mobile pour **enregistrer un cours, le structurer avec l'IA et le
réviser** : cours chapitrés, tuteur IA, progression et suivi des révisions.

Cette version est développée en **React Native + Expo + TypeScript**. Elle
remplace l'application Android Kotlin/Jetpack Compose, conservée intacte dans
[`legacy-android/`](legacy-android).

## Démarrage rapide

Prérequis : Node.js 20+, VS Code, et l'application **Expo Go** (SDK 58) sur un
téléphone Android.

```bash
npm install
npx expo start
```

Scannez le QR code avec Expo Go.

**Guides pas à pas** :

- [`docs/TEST-APP.md`](docs/TEST-APP.md) — lancer sur un Samsung et parcours de test complet ;
- [`docs/TEST-EXPO-GO.md`](docs/TEST-EXPO-GO.md) — premier enregistrement audio ;
- [`docs/TEST-PANIER.md`](docs/TEST-PANIER.md) — panier et limite de 5 fichiers ;
- [`docs/AI-BACKEND.md`](docs/AI-BACKEND.md) — analyse IA et backend sécurisé.

## État actuel

| Fonctionnalité | État |
|---|---|
| Base Expo SDK 58 / React Native 0.88 / TypeScript strict | ✅ |
| Thème sombre, cartes arrondies, navigation 5 onglets + micro | ✅ conservé |
| Enregistrement : matière, titre, chrono, onde, pause/reprise/arrêt | ✅ |
| Sauvegarde locale : un `.m4a` AAC + métadonnées par enregistrement | ✅ |
| Écoute, renommage et suppression des enregistrements | ✅ |
| Panier : sélection réelle, 5 max, persistance, lot validé | ✅ |
| Analyse IA : transcription, chapitres, sections, notions, incertitudes | ✅ code + backend, ⛔ clé et déploiement à fournir |
| Cours : liste, recherche, filtres, détail, renommage, suppression | ✅ |
| Tuteur IA appuyé sur les cours, citations vérifiées | ✅ code, ⛔ backend requis |
| Progression réelle : temps, régularité, chapitres, maîtrise, exercices | ✅ |
| Compte local, confidentialité, suppression des données | ✅ local ; ⛔ auth e-mail/Google |
| Sauvegarde cloud | ⏳ option préparée, inactive |
| Enregistrement en arrière-plan | ⏳ development build / APK |

**Aucune donnée n'est simulée.** Les écrans lisent le stockage du téléphone ;
l'analyse et le tuteur refusent de fonctionner sans backend configuré plutôt
que d'inventer une réponse.

## Fonctionnement

### Enregistrement

1. choisir la matière et, si besoin, un titre ;
2. démarrer (permission micro demandée), mettre en pause, reprendre, terminer ;
3. chaque arrêt crée un enregistrement indépendant : fichier `.m4a` et entrée
   dans `recordings.json` (titre, matière, date, durée, chemin) ;
4. la liste permet d'**écouter**, **renommer** et **supprimer** (avec
   confirmation) chaque enregistrement.

### Panier

- liste tous les enregistrements réels, sélection de **5 maximum** ;
- compteur `3/5`, message explicite au sixième, retrait sans supprimer l'audio ;
- sélection persistée après fermeture ; « Préparer l'analyse » vérifie que
  chaque fichier existe puis enregistre le lot dans `prepared-analysis.json`.

### Analyse IA

- le lot est envoyé au **backend sécurisé** (`backend/`), jamais directement au
  fournisseur : la clé API reste côté serveur ;
- transcription, structuration en chapitres/sections, extraction des
  définitions, formules, méthodes et exemples ;
- les passages incertains sont **signalés**, pas inventés ;
- le cours conserve les identifiants de ses enregistrements d'origine.

Sans `EXPO_PUBLIC_API_URL`, l'écran affiche « backend non configuré » et ne crée
aucun cours.

### Cours, tuteur, progression

- cours listés, recherchables (accents ignorés), filtrables par matière ;
- chapitre dépliable, notions avec maîtrise « À revoir / Compris » ;
- tuteur qui répond à partir du cours choisi, avec citations vérifiées ;
- progression calculée sur les enregistrements et les cours réels.

### Paramètres

- profil local, consentement IA, option de sauvegarde cloud (inactive) ;
- suppression complète des données (double confirmation) ;
- connexion e-mail / Google : boutons présents mais **inactifs**, en attente du
  backend d'authentification. Aucun faux compte n'est créé.

## Structure

```
app/                     routes Expo Router
  (tabs)/                Accueil, Panier, Cours, Tuteur, Progrès
  recording.tsx          enregistrement
  course/[id].tsx        détail d'un cours
  analysis.tsx           analyse d'un lot
  settings.tsx           compte et paramètres
src/
  features/              écrans par fonctionnalité
  domain/                modèles (cours, notions, exercices, progression)
  services/
    ai/                  clients HTTP analyse + tuteur
    storage/             repositories JSON testables + câblage Expo
  lib/                   helpers purs (panier, cours, progression, IA)
backend/                 worker Cloudflare (clé IA côté serveur)
tests/                   tests Node (helpers, repositories, clients HTTP, backend)
docs/                    guides de test et documentation d'architecture
legacy-android/          ancienne application Kotlin + Compose (archive)
```

## Scripts

| Commande | Effet |
|---|---|
| `npm start` | serveur de développement Expo |
| `npm run android` | ouvre l'app sur un appareil Android |
| `npm run typecheck` | vérification TypeScript de l'application |
| `npm run typecheck:backend` | vérification TypeScript du worker |
| `npm run doctor` | cohérence des dépendances Expo |
| `npm run export:android` | compilation du bundle Android |
| `npm test` | tests Node (helpers, stockage, HTTP, backend) |

## Configuration du backend

```bash
cp .env.example .env      # puis renseigner EXPO_PUBLIC_API_URL
cd backend && npx wrangler login
npx wrangler secret put AI_API_KEY
npx wrangler deploy
```

Détails, coûts et limites : [`docs/AI-BACKEND.md`](docs/AI-BACKEND.md).

## Sécurité

- Aucune clé d'API dans le dépôt, `app.json`, `eas.json` ou le bundle mobile.
- Seule variable publique : `EXPO_PUBLIC_API_URL` (une URL).
- Les fichiers `.env*` sont ignorés par Git (`.env.example` est fourni vide).
- Les enregistrements et cours restent sur le téléphone ; l'envoi au service IA
  exige une action explicite et le consentement activé dans les paramètres.
- Les citations du tuteur sont vérifiées côté client : une citation inconnue du
  cours est supprimée et la réponse est signalée comme non appuyée.

## Ancienne version Kotlin

- Dossier : [`legacy-android/`](legacy-android) — code source complet, non modifié.
- Branche dédiée : `legacy/kotlin-v1`.
- Tag : `kotlin-v1-final`.
- Capture d'origine :
  [`docs/assets/accueil-kotlin-reference.png`](docs/assets/accueil-kotlin-reference.png).
