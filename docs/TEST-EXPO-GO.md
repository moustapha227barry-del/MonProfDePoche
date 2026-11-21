# Tester l'application sur Android avec Expo Go

Guide court, dans l'ordre. Compte **15 minutes** la première fois.

À la fin, tu sauras si l'enregistrement audio fonctionne vraiment sur ton
téléphone : fichier créé, pause/reprise, arrêt propre, métadonnées conservées.

---

## A. Sur l'ordinateur (une seule fois)

1. Installer **Node.js 20 ou plus récent** : <https://nodejs.org>.
2. Ouvrir le dossier du projet dans **VS Code** (Fichier → Ouvrir un dossier).
3. Ouvrir le terminal intégré : `Ctrl + ù` (ou Terminal → Nouveau terminal).
4. Taper :

   ```bash
   npm install
   npx expo start
   ```

5. Un **QR code** apparaît dans le terminal. Laisse ce terminal ouvert.

> Si `npx expo start` affiche un message de version, réponds simplement : c'est
> Expo qui vérifie la compatibilité, pas une erreur.

---

## B. Sur le téléphone

1. Installer **Expo Go** depuis le **Play Store**.
2. Connecter le téléphone **au même Wi-Fi** que l'ordinateur.
3. Ouvrir Expo Go → **Scan QR code** → viser le QR du terminal.
4. Attendre la compilation (30 à 60 s la première fois). L'**accueil** de Mon
   Prof de Poche doit s'afficher.

**Si le QR ne fonctionne pas :** arrête le terminal (`Ctrl + C`), puis relance
avec `npx expo start --tunnel`. Ou, en USB : `adb reverse tcp:8081 tcp:8081`
puis `npx expo start --localhost`.

---

## C. Test 1 — un premier enregistrement de 10 secondes

1. Appuyer sur le **bouton micro central** de la barre du bas.
2. Choisir une matière (par exemple **Mathématiques**).
3. Facultatif : écrire un titre, par exemple « Test 1 ».
4. Appuyer sur **Démarrer l'enregistrement**.
5. Android demande l'accès au **microphone** → appuyer sur **Autoriser**.
6. Parler quelques secondes près du téléphone : l'**onde** doit bouger et le
   **chronomètre** avancer.
7. Attendre ~10 secondes, puis **Terminer**.

**Attendu :**

- une carte verte « **Enregistrement sauvegardé** » avec la durée ;
- une ligne « **Enregistrements sauvegardés** » avec le titre, la matière, la
  durée et un badge bleu « **À analyser** » ;
- sous le titre de la carte, un chemin commençant par `file:///` et finissant
  par `.../Audio/cours-<matiere>-AAAAMMJJ-HHMMSS.m4a`.

> Ce chemin est la preuve que le fichier `.m4a` a été écrit dans le dossier
> **Documents** privé de l'application (et non dans un dossier temporaire).

---

## D. Test 2 — pause et reprise

1. Appuyer sur **Démarrer l'enregistrement**.
2. Parler **3 secondes**, puis **Pause**.
3. **Attendre 5 secondes** sans parler : le chronomètre doit **rester figé**.
4. Appuyer sur **Reprendre**, parler **3 secondes**, puis **Terminer**.

**Attendu :**

- la durée sauvegardée est d'environ **6 secondes**, pas 11 (les 5 secondes de
  pause ne comptent pas) ;
- **une seule** nouvelle ligne apparaît dans la liste, avec un fichier
  `cours-...m4a` **différent** du Test 1 ;
- aucune ligne « fantôme » n'apparaît pendant la pause.

Côté code, `expo-audio` appelle `MediaRecorder.resume()` sur le **même**
enregistreur : la pause ne peut pas ouvrir un second fichier.

---

## E. Test 3 — Terminer finalise bien le fichier

1. Démarrer un enregistrement, parler, puis **Terminer**.
2. Vérifier que la carte de confirmation affiche une durée **> 0 s** et que le
   badge de la ligne dit « À analyser ».
3. Redémarrer un enregistrement tout de suite après : cela doit fonctionner
   (le bouton repasse bien à « Démarrer l'enregistrement »).

**Attendu :** chaque arrêt produit un enregistrement complet et indépendant,
et l'écran reste utilisable sans redémarrer l'application.

---

## F. Test 4 — les données survivent à la fermeture

C'est le test le plus important pour la suite.

1. Noter le **nombre de lignes** dans « Enregistrements sauvegardés ».
2. Fermer **complètement** l'application : touche carrée / geste de navigation
   Android → balayer Expo Go hors de l'écran (ou Paramètres → Applications →
   Expo Go → **Forcer l'arrêt**).
3. Rouvrir Expo Go, rescanner le QR code, revenir sur l'écran d'enregistrement.

**Attendu :** les **mêmes lignes**, avec les mêmes titres, durées et dates.
Aucune donnée n'est fictive : tout est relu depuis le fichier `recordings.json`
du dossier Documents.

> Dans Expo Go, les fichiers vivent dans l'espace privé d'Expo Go, pas dans le
> dossier « Documents » visible depuis l'application Fichiers d'Android. C'est
> normal. Une fois l'APK autonome installé, le même contenu sera dans
> `/data/data/app.monprofdepoche/files/Audio/`.

---

## G. Test 5 — deux cours différents restent séparés

1. Enregistrer un cours en **Physique** avec le titre « Test 3 ».
2. Enregistrer un second cours en **Français**, sans titre.
3. Vérifier la liste.

**Attendu :**

- deux lignes distinctes, matières et couleurs différentes ;
- pour le cours sans titre, un titre automatique du type
  « Français · 21/11/2026 14:05 » ;
- deux noms de fichiers différents dans les chemins affichés.

---

## H. Si quelque chose ne va pas

| Symptôme | Cause probable | Que faire |
|---|---|---|
| « Project is incompatible with this version of Expo Go » | Expo Go trop ancien | mettre Expo Go à jour (SDK 58) |
| La demande de micro n'apparaît pas | permission déjà refusée | carte « Microphone bloqué » → **Ouvrir les réglages** → Autorisations → Microphone |
| « Le microphone n'a pas pu démarrer » | micro utilisé par un autre appel/app | fermer l'autre application, réessayer |
| Aucune ligne après **Terminer** | écriture impossible (stockage plein) | vérifier l'espace libre, relancer |
| L'onde ne bouge pas | micro couvert ou très silencieux | parler près du téléphone |
| La liste est vide après réouverture | enregistrements faits dans une **autre** session Expo Go | rescanner le même QR, même projet |

---

## I. Ce qu'il faut me rapporter

Pour que je puisse corriger au bon endroit, envoie-moi :

1. une **capture d'écran** de l'écran d'enregistrement avec la liste ;
2. la **durée affichée** après le test pause/reprise (D) ;
3. le **chemin complet** affiché sous « Enregistrement sauvegardé » ;
4. le résultat du test de fermeture/réouverture (F) : lignes conservées ou non ;
5. tout message d'erreur affiché en rouge.

---

## J. Limites connues de cette version

- **Application au premier plan** : si tu quittes l'application pendant une
  capture, Android peut l'interrompre. L'enregistrement en arrière-plan
  demandera un *development build* puis l'APK.
- **Pas encore de lecture audio** dans l'interface : le fichier est conservé,
  mais on ne peut pas encore le réécouter depuis l'application.
- **Pas de panier actif** : les lignes attendent l'analyse (« À analyser »),
  le panier arrive à l'étape suivante (5 fichiers maximum).
- **Pas de suppression** d'un enregistrement depuis l'interface.
