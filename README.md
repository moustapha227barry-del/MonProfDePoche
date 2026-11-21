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

## État actuel

| Élément | État |
|---|---|
| Base Expo SDK 58 / React Native 0.88 / TypeScript strict | ✅ |
| Identité visuelle sombre (couleurs, typographie, cartes, dégradés) | ✅ reportée à l'identique |
| Navigation 5 onglets + bouton central d'enregistrement | ✅ |
| Écran d'accueil complet | ✅ avec données de démonstration |
| Panier, Cours, Tuteur, Progression, Enregistrement | 🚧 écrans « en préparation » |
| Enregistrement audio, stockage local, analyse IA | ⏳ prochaines phases |
| APK autonome (hors Play Store) | ⏳ configuration prête (`eas.json`) |

## Structure

```
app/                     routes Expo Router (un fichier = un écran)
  _layout.tsx            Stack racine, thème sombre, barre d'état
  (tabs)/                5 onglets + barre de navigation sur mesure
  recording.tsx          enregistrement, hors barre d'onglets
src/
  components/            cartes, boutons, barres, écrans types
  features/              écrans et état par fonctionnalité
  domain/                modèles (cours, notions, exercices, progression)
  services/              contrats audio, analyse IA, stockage local
  theme/                 couleurs, dégradés, typographie, rayons
  lib/                   formatage des durées, couleurs
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
