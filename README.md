# Mon Prof de Poche

Application mobile pour **enregistrer un cours, le structurer avec l'IA et le
réviser** : cours chapitrés, tuteur IA, exercices et suivi de progression.

Cette version est développée en **React Native + Expo + TypeScript**. Elle
remplace l'application Android Kotlin/Jetpack Compose, conservée intacte dans
[`legacy-android/`](legacy-android) (voir plus bas).

## Démarrage rapide

Prérequis : Node.js 20 ou plus récent, VS Code, et l'application **Expo Go**
(SDK 58) sur un téléphone Android.

```bash
npm install
npx expo start
```

Scannez le QR code affiché dans le terminal avec Expo Go. Les instructions
détaillées (VS Code, réseau, dépannage) sont dans
[`docs/MIGRATION-EXPO.md`](docs/MIGRATION-EXPO.md).

**Tester l'enregistrement sur ton téléphone** : guide pas à pas dans
[`docs/TEST-EXPO-GO.md`](docs/TEST-EXPO-GO.md) (10 minutes, avec les résultats
attendus pour chaque étape).

## État actuel

| Élément | État |
|---|---|
| Base Expo SDK 58 / React Native 0.88 / TypeScript strict | ✅ |
| Identité visuelle sombre (couleurs, typographie, cartes, dégradés) | ✅ reportée à l'identique |
| Navigation 5 onglets + bouton central d'enregistrement | ✅ |
| Écran d'accueil complet | ✅ avec données de démonstration |
| **Enregistrement audio** : matière, titre, chronomètre, onde, pause/reprise | ✅ fonctionnel dans Expo Go |
| **Sauvegarde locale** : un fichier `.m4a` AAC + métadonnées par enregistrement | ✅ dans les documents de l'app |
| Panier, Cours, Tuteur, Progression | 🚧 écrans « en préparation » |
| Analyse IA et panier d'analyse | ⏳ prochaine phase |
| APK autonome (hors Play Store) | ⏳ configuration prête (`eas.json`) |

### Enregistrement audio

Depuis l'accueil, le bouton central de la barre (ou « Nouvel enregistrement »)
ouvre l'écran d'enregistrement :

1. choisir la matière et, si besoin, saisir un titre ;
2. démarrer : la permission du microphone est demandée proprement ;
3. mettre en pause, reprendre, puis terminer ;
4. chaque arrêt crée un enregistrement **indépendant** : fichier `.m4a` (AAC
   44,1 kHz mono, 96 kbit/s) et entrée de métadonnées (titre, matière, date,
   durée, nom et chemin du fichier) dans `recordings.json`.

Tout reste sur le téléphone. La capture fonctionne **application ouverte** :
l'enregistrement en arrière-plan demandera un development build puis un APK.
Les détails (permissions, emplacement des fichiers, limites) sont dans
[`docs/MIGRATION-EXPO.md`](docs/MIGRATION-EXPO.md#6-bis-enregistrement-audio).

## Structure

```
app/                     routes Expo Router (un fichier = un écran)
  _layout.tsx            Stack racine, thème sombre, barre d'état
  (tabs)/                5 onglets + barre de navigation sur mesure
  recording.tsx          enregistrement, hors barre d'onglets
src/
  components/            cartes, boutons, barres, onde sonore, écrans types
  features/              écrans et état par fonctionnalité
    recording/           écran d'enregistrement + hook expo-audio
  domain/                modèles (cours, notions, exercices, progression)
  services/              contrats audio, analyse IA, stockage local
    storage/             index local des enregistrements (JSON + fichiers)
  theme/                 couleurs, dégradés, typographie, rayons
  lib/                   formatage des durées, helpers d'enregistrement, couleurs
tests/                   tests Node des helpers d'enregistrement
legacy-android/          ancienne application Kotlin + Compose (archive)
docs/MIGRATION-EXPO.md   guide de migration, Expo Go, APK, sécurité
```

## Scripts

| Commande | Effet |
|---|---|
| `npm start` | démarre le serveur de développement Expo |
| `npm run android` | ouvre l'app sur un émulateur/téléphone Android |
| `npm run typecheck` | vérifie les types TypeScript |
| `npm run doctor` | vérifie la cohérence des dépendances Expo |
| `npm run export:android` | compile le bundle Android sans appareil |
| `npm test` | tests Node des helpers d'enregistrement (`node --test`) |

## Sécurité

Aucune clé d'API n'est présente dans le dépôt. L'application appellera un
backend sécurisé qui détient les clés côté serveur ; le client ne connaîtra
qu'une URL publique (`EXPO_PUBLIC_API_URL`). Les fichiers `.env*` sont ignorés
par Git.

## Ancienne version Kotlin

- Dossier : [`legacy-android/`](legacy-android) — code source complet, non modifié.
- Branche dédiée : `legacy/kotlin-v1`.
- Tag : `kotlin-v1-final`.
- Capture de l'écran d'accueil d'origine :
  [`docs/assets/accueil-kotlin-reference.png`](docs/assets/accueil-kotlin-reference.png).
