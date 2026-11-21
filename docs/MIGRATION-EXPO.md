# Migration Kotlin → React Native / Expo

Ce document explique la nouvelle base technique de **Mon Prof de Poche**, comment
la lancer depuis VS Code avec Expo Go, ce qui fonctionnera dans Expo Go, ce qui
exigera plus tard un *development build*, et comment produire un APK autonome.

---

## 1. Décisions techniques

| Élément | Choix | Pourquoi |
|---|---|---|
| Framework | **Expo SDK 58** (React Native 0.88, React 19.3) | version supportée par Expo Go du Play Store depuis octobre 2026 |
| Langage | **TypeScript strict** | mêmes garanties qu'en Kotlin sur les modèles de données |
| Navigation | **Expo Router** (routes par fichiers) | ajouter un écran = ajouter un fichier, sans table de routes à maintenir |
| Style | thème maison (couleurs, typographie, rayons) | identité visuelle identique à la version Kotlin |
| Icônes / dégradés | `@expo/vector-icons`, `expo-linear-gradient` | inclus dans Expo Go, aucune compilation native |
| Distribution | **EAS Build**, profil `preview` en APK | lien direct + QR code, sans Play Store |

L'ancienne application Kotlin reste disponible : dossier `legacy-android/`,
branche `legacy/kotlin-v1`, tag `kotlin-v1-final`.

---

## 2. Prérequis sur l'ordinateur

1. **Node.js 20 LTS ou plus récent** — <https://nodejs.org> (version installée
   au moment de la migration : Node 26).
2. **VS Code** — <https://code.visualstudio.com>.
3. Extensions VS Code recommandées :
   - **Expo Tools** (aide `app.json`, autocomplétion Expo) ;
   - **React Native Tools** (facultatif) ;
   - **Prettier** (facultatif, mise en forme).
4. **Expo Go** sur le téléphone Android, depuis le Play Store. La version du
   Play Store ne prend en charge **qu'un seul SDK à la fois** : aujourd'hui le
   SDK 58. Si Expo Go affiche « Project is incompatible with this version of
   Expo Go », mettez Expo Go à jour — c'est un décalage de version, pas un bug
   du projet.

---

## 3. Lancer le projet avec VS Code et Expo Go

```bash
# 1. Ouvrir le dossier du projet dans VS Code : Fichier > Ouvrir un dossier
# 2. Ouvrir le terminal intégré : Ctrl + ù  (ou Terminal > Nouveau terminal)

npm install          # une seule fois (ou après un changement de dépendances)
npx expo start       # démarre le serveur de développement
```

Le terminal affiche un **QR code**.

1. Connecter le téléphone et l'ordinateur **au même réseau Wi-Fi**.
2. Ouvrir **Expo Go** → *Scan QR code* → viser le QR du terminal.
3. La première compilation prend quelques dizaines de secondes, puis l'écran
   d'accueil s'affiche et se recharge à chaque sauvegarde de fichier.

### Si le QR code ne se connecte pas

| Symptôme | Solution |
|---|---|
| « Something went wrong / timed out » | vérifier que le Wi-Fi est identique, ou lancer `npx expo start --tunnel` (installe `@expo/ngrok` au premier usage) |
| Réseau d'entreprise / Wi-Fi « invité » | le mode `--tunnel` contourne l'isolation des clients |
| Pare-feu Windows | autoriser Node.js sur le réseau privé (port 8081) |
| Téléphone en USB uniquement | `adb reverse tcp:8081 tcp:8081` puis `npx expo start --localhost` |
| « incompatible with this version of Expo Go » | mettre Expo Go à jour (SDK 58) |

### Raccourcis utiles du terminal Expo

| Touche | Action |
|---|---|
| `a` | ouvrir sur un appareil/émulateur Android |
| `r` | recharger l'application |
| `j` | ouvrir les outils de développement |
| `m` | menu de développement sur le téléphone |

---

## 4. Scripts du projet

| Commande | Effet |
|---|---|
| `npm start` / `npx expo start` | serveur de développement + QR code |
| `npm run android` | lance directement sur Android |
| `npm run typecheck` | `tsc --noEmit`, vérification TypeScript |
| `npm run doctor` | `expo-doctor`, cohérence des dépendances avec le SDK |
| `npm run export:android` | compile le bundle Android (test de compilation sans appareil) |
| `npm test` | tests Node des helpers d'enregistrement (`node --test tests/`) |

---

## 5. Architecture et où ajouter du code

```
app/
  _layout.tsx            Stack racine : fond sombre, barre d'état claire
  (tabs)/_layout.tsx     les 5 onglets + la barre sur mesure
  (tabs)/index.tsx       Accueil
  (tabs)/basket.tsx      Mon panier (5 fichiers max par analyse)
  (tabs)/courses.tsx     Mes cours
  (tabs)/tutor.tsx       Tuteur IA
  (tabs)/progress.tsx    Progression
  recording.tsx          Enregistrement (hors barre d'onglets)
src/
  theme/                 couleurs, dégradés, typographie, rayons, espacements
  components/            Card, GradientButton, StatTile, WeeklyBars, TabBar…
  features/<domaine>/    écran + état de la fonctionnalité
    recording/           RecordingScreen + useRecordingSession (expo-audio)
  domain/                Subject, Course, Chapter, Notion, Exercise, Progress…
  services/
    audio/               RecordingService (contrat historique, hook réel ci-dessus)
    ai/                  AnalysisService, TutorService (contrats)
    storage/             recordingRepository (index local), CourseRepository (contrat)
  lib/                   formatDuration, formatRecordingTimer, helpers d'enregistrement
tests/                   tests Node des helpers (node --test)
```

**Ajouter un écran** : créer un fichier dans `app/` (le routeur s'en occupe) et
son contenu dans `src/features/`. **Remplacer un écran « en préparation »** :
remplacer l'import dans le fichier de route ; la navigation et la barre ne
bougent pas. **Ajouter une matière** : `src/domain/subject.ts` uniquement.

Les écrans n'accèdent jamais directement au matériel ni au réseau : ils passent
par les contrats de `src/services/`, ce qui permet de changer d'implémentation
(expo-audio → module natif, backend A → backend B) sans les réécrire.

---

## 6. Compatibilité Expo Go (SDK 58)

Expo Go est un bac à sable de développement : il contient un ensemble fixe de
modules natifs. Tout ce qui n'y est pas inclus demande un **development build**.

| Besoin | Paquet prévu | Expo Go | Remarque |
|---|---|---|---|
| Enregistrer le micro (app au premier plan) | `expo-audio` | ✅ inclus | **implémenté** dans l'écran Enregistrement |
| Niveau sonore pour l'onde animée | `expo-audio` (metering) | ✅ | **implémenté** : l'onde suit le niveau réel du micro |
| Lire un enregistrement | `expo-audio` | ✅ | prévu pour l'écoute des cours sauvegardés |
| Enregistrement écran verrouillé / en arrière-plan | `expo-audio` + `enableBackgroundRecording` | ❌ | service de premier plan Android + notification persistante ; **development build** puis APK |
| Stockage local (cours, notions, révisions) | `expo-sqlite` | ✅ inclus | phase panier / cours |
| Fichiers audio locaux | `expo-file-system` | ✅ inclus | **implémenté** : index `recordings.json` + fichiers `.m4a` |
| Graphiques et ondes | Views natives / `react-native-svg` | ✅ | aucune dépendance native supplémentaire ici |
| Notifications **locales** (rappels de révision) | `expo-notifications` | ✅ | |
| Notifications **distantes** (push) | `expo-notifications` + Firebase | ❌ | retirées d'Expo Go ; development build + projet Firebase |
| Partage d'un cours (PDF, texte) | `expo-sharing` | ✅ | |
| Polices personnalisées | `expo-font` | ✅ | |
| Appels au backend IA (`fetch` HTTPS) | — | ✅ | aucune clé dans l'application |
| Authentification Supabase | `@supabase/supabase-js` | ✅ | clé *anon* publique uniquement |
| Biométrie / haptique | `expo-local-authentication`, `expo-haptics` | ✅ | |
| Achats intégrés | `expo-iap` | ❌ | hors périmètre actuel |

## 6 bis. Enregistrement audio

L'écran Enregistrement est fonctionnel dans Expo Go. Il ne simule rien : sans
microphone ou sans permission, il affiche une erreur et ne crée aucun fichier.

### Parcours

1. **Matière** : une pastille parmi les huit matières de `src/domain/subject.ts`.
2. **Titre facultatif** : à défaut, le titre devient « Mathématiques · 21/11/2026 14:05 ».
3. **Démarrer** : la permission Android `RECORD_AUDIO` est demandée ; en cas de
   refus définitif, l'écran explique comment la réactiver dans les réglages.
4. **Pause / Reprendre** : le chronomètre exclut le temps passé en pause.
5. **Terminer** : le fichier est fermé, puis les métadonnées sont enregistrées.
   Chaque arrêt produit un enregistrement **indépendant** ; rien n'est fusionné.

Quitter l'écran pendant une capture (bouton Retour ou retour Android) demande
confirmation et propose de terminer et sauvegarder avant de partir.

### Fichiers et métadonnées

| Élément | Emplacement |
|---|---|
| Audio | dossier **documents** de l'app, `Audio/cours-<matière>-AAAAMMJJ-HHMMSS.m4a` |
| Métadonnées | `recordings.json` dans le même dossier documents |
| Champs | `id`, `title`, `subject`, `fileName`, `fileUri`, `durationMs`, `createdAt` |

L'index est lu et écrit par `src/services/storage/recordingRepository.ts`
(`expo-file-system`), jamais par l'écran. Le dossier documents n'est pas vidé
par Android, contrairement au cache.

### Format

AAC dans un conteneur MP4 (`.m4a`), 44,1 kHz, mono, 96 kbit/s, niveau micro
activé (`isMeteringEnabled`). Pour changer la qualité ou le format, modifier
`RECORDING_OPTIONS` dans `src/features/recording/useRecordingSession.ts`.

### Limites assumées de cette version

- **Premier plan uniquement** : l'application doit rester ouverte. L'option
  `enableBackgroundRecording` est volontairement laissée à `false` dans
  `app.json` ; l'arrière-plan et l'écran verrouillé demandent un development
  build puis un APK.
- **Pas de panier actif** : chaque enregistrement attend l'analyse. Le dépôt
  expose déjà `listPendingAnalysis()` et `markAddedToBasket()` pour la suite.
- **Pas de suppression ni de lecture audio dans l'interface** : le fichier est
  conservé sur le téléphone et pourra être écouté à l'étape suivante.

**À retenir** : Expo Go suffit pour l'accueil, la navigation, l'enregistrement
simple au premier plan, le stockage local et les appels au backend. Dès que
l'enregistrement doit continuer **écran éteint ou application en arrière-plan**,
il faut passer à un development build — puis à l'APK pour la distribution.

---

## 7. Produire un APK autonome (hors Play Store)

La configuration est déjà prête dans `eas.json` :

- profil **`preview`** → APK installable, distribution interne (lien + QR code) ;
- profil **`development`** → development build avec client Expo ;
- profil **`production`** → `.aab` pour le Play Store (non utilisé pour l'instant).

Étapes (à faire quand le moment viendra, rien n'est publié aujourd'hui) :

```bash
npx eas-cli login                 # compte Expo (gratuit)
npx eas-cli build -p android --profile preview
```

EAS renvoie une page d'installation avec **un lien direct et un QR code** : le
téléphone scanne, télécharge l'APK et l'installe (autoriser « Installer des
applications inconnues » pour le navigateur). Le paquet reste
`app.monprofdepoche`, comme la version Kotlin.

Variantes :

- construction **locale** sans cloud : `npx expo prebuild --platform android`
  puis `cd android && ./gradlew assembleRelease` (JDK 17+, Android SDK) ;
- `npx eas-cli build --local -p android --profile preview` (même résultat,
  sur la machine).

L'`applicationId` étant identique à l'ancienne version, Android considère les
deux applications comme la même : désinstaller l'ancienne avant d'installer
l'APK Expo, ou changer `android.package` dans `app.json` pour cohabiter.

---

## 8. Règles de sécurité

1. **Aucune clé d'API dans le code, `app.json`, `eas.json` ou Git.** Les clés
   vont dans les secrets EAS (`eas secret`) ou dans les variables d'environnement
   du backend.
2. Les variables `EXPO_PUBLIC_*` sont **publiques** (elles finissent dans le
   bundle) : uniquement des URL ou des clés publiques type `anon` Supabase.
3. L'analyse IA et le tuteur appellent un **backend sécurisé** (Supabase Edge
   Function ou équivalent) qui détient la clé du fournisseur d'IA. Le client ne
   peut pas la lire.
4. `.env`, `.env.local`, clés de signature (`*.jks`, `keystore.properties`) sont
   ignorés par `.gitignore`.
5. Les enregistrements audio restent **sur le téléphone** par défaut ; aucun
   envoi sans action explicite de l'utilisateur.

---

## 9. Feuille de route

| Phase | Contenu | Dépendance native |
|---|---|---|
| ✅ Migration | Expo + TypeScript, thème, navigation, accueil | aucune |
| ✅ 4. Enregistrement | matière, chronomètre, onde, pause/reprise, sauvegarde locale | `expo-audio` (Expo Go suffisant) |
| 5. Panier et cours | sélection de 5 fichiers max (lecture de `recordings.json`), stockage SQLite, liste des cours | `expo-sqlite` (Expo Go) |
| 6. Analyse IA | backend sécurisé, structuration en chapitres et notions | API + secrets serveur |
| 7. Tuteur | conversation, indices progressifs, historique | API + secrets serveur |
| 8. Exercices et révisions | génération d'exercices, répétition espacée | locale |
| 9. Progression | graphiques, lacunes, objectifs | locale |
| 10. Enregistrement en arrière-plan | service de premier plan, notification | **development build / APK** |
| 11. Distribution | APK EAS, lien + QR code | EAS |

---

## 10. Sauvegarde de l'ancienne version

- `legacy-android/` : projet Kotlin/Compose complet (Gradle, ressources, README
  d'origine). Il n'est pas compilé par le projet Expo et peut être ouvert
  séparément dans Android Studio.
- Branche `legacy/kotlin-v1` et tag `kotlin-v1-final` : mêmes fichiers, à la
  racine du dépôt, tels qu'ils étaient avant la migration.
- `docs/assets/accueil-kotlin-reference.png` : rendu de l'écran d'accueil
  d'origine, référence visuelle pour la version React Native.
