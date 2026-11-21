# MonProfDePoche
Application Android intelligente pour enregistrer, organiser et réviser ses cours avec l'intelligence artificielle. 

> **Archive — version Kotlin/Jetpack Compose (v1).**
> Le développement actif se poursuit en React Native + Expo + TypeScript à la
> racine du dépôt (voir le `README.md` principal et `docs/MIGRATION-EXPO.md`).
> Ce dossier est conservé tel quel, pour référence. Équivalents Git : branche
> `legacy/kotlin-v1`, tag `kotlin-v1-final`.

## État du projet

Phase 1 terminée : squelette Android (Kotlin + Jetpack Compose), sans aucune
fonctionnalité audio, IA, authentification ou base de données pour l'instant.

## Prérequis (Windows)

- Android Studio (dernière version stable, avec le JDK intégré).
- Un téléphone Android 8.0 (API 26) ou plus récent, ou un émulateur créé dans
  Android Studio.

## Ouvrir et lancer le projet

1. Ouvrir Android Studio → **File > Open**.
2. Choisir le dossier `MonProfDePoche` (celui qui contient `settings.gradle.kts`).
3. Attendre la fin de la synchronisation Gradle (Android Studio télécharge
   Gradle 9.6.0 et les dépendances au premier lancement).
4. Brancher le téléphone en USB avec le débogage USB activé, ou démarrer un
   émulateur via **Device Manager**.
5. Cliquer sur **Run ▶** (`Shift + F10`).

L'application affiche l'écran d'accueil « Mon Prof de Poche ».

## Technologies

| Élément | Version |
|---|---|
| Android Gradle Plugin | 9.5.1 |
| Gradle | 9.6.0 |
| Kotlin | 2.4.21 |
| Jetpack Compose BOM | 2026.11.01 |
| compileSdk / targetSdk / minSdk | 37.1 / 36 / 26 |

## Structure

```
app/src/main/java/app/monprofdepoche/
├── MainActivity.kt
└── ui/
    ├── home/HomeScreen.kt
    └── theme/{Color,Theme,Type}.kt
```

Les prochaines phases ajouteront l'enregistrement audio, la base de données
locale (Room), Supabase et les fonctions d'IA. Les fichiers audio resteront
stockés localement par défaut.
