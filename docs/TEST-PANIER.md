# Tester le panier sur Android avec Expo Go

Le panier lit les **vrais** enregistrements du téléphone : il faut donc avoir
déjà enregistré quelques cours. Compte **10 minutes**.

Si l'application n'est pas encore sur ton téléphone, commence par
[`TEST-EXPO-GO.md`](TEST-EXPO-GO.md) (installation et premier enregistrement).

---

## A. Préparer les données

1. Sur l'ordinateur, dans le dossier du projet :

   ```bash
   npm install
   npx expo start
   ```

2. Scanner le QR code avec Expo Go.
3. Enregistrer **6 cours courts** (10 s chacun suffisent), avec des matières
   différentes. Ils apparaissent dans « Enregistrements sauvegardés ».

> 6 cours permettent de tester la limite de 5 fichiers. Si tu n'en as que 3, le
> test de limite sera à refaire plus tard.

---

## B. Test 1 — Affichage réel

1. Ouvrir l'onglet **Panier** (icône en haut à gauche de la barre).
2. Vérifier la carte du haut.

**Attendu :**

- compteur **`0/5`** en grand, barre vide, « Aucun fichier sélectionné » ;
- carte bleue « **Choisis tes cours** » ;
- section « **Enregistrements disponibles** » avec les 6 cours : titre, matière,
  date et durée pour chacun.

Aucune donnée inventée : ce sont exactement les cours enregistrés.

---

## C. Test 2 — Sélection et désélection

1. Toucher le premier cours.
2. Toucher le deuxième cours.

**Attendu :** compteur `2/5`, les deux cours remontent dans « **Dans le
panier** », la ligne du haut est bordée de violet avec un bouton « Retirer », la
durée cumulée s'affiche.

3. Toucher la ligne du premier cours (ou son bouton « Retirer »).

**Attendu :** compteur `1/5`, le cours redescend dans « Enregistrements
disponibles » et **son fichier audio existe toujours** (visible dans l'onglet
Enregistrement).

---

## D. Test 3 — Limite stricte de 5 fichiers

1. Sélectionner 5 cours : le compteur affiche `5/5`.
2. Toucher un **sixième** cours.

**Attendu :**

- compteur toujours **`5/5`** (aucun ajout) ;
- carte orange : « Le panier est complet : 5 fichiers maximum par analyse.
  Retire un fichier pour ajouter « … ». » ;
- le texte d'aide sous la liste rappelle la limite.

3. Fermer le message avec la croix, retirer un cours, puis ajouter le sixième.

**Attendu :** l'ajout fonctionne, compteur `5/5`.

---

## E. Test 4 — Le panier ne supprime aucun fichier

1. Noter le nombre de cours dans l'onglet **Enregistrement**.
2. Dans le panier, sélectionner 2 cours, puis les retirer un par un.
3. Revenir sur l'onglet **Enregistrement**.

**Attendu :** le nombre de cours est **identique**, avec les mêmes durées et les
mêmes chemins `.m4a`. Retirer du panier ne fait que décocher le cours.

---

## F. Test 5 — Persistance après fermeture

1. Sélectionner 3 cours (compteur `3/5`).
2. Fermer complètement l'application : Paramètres Android → Applications →
   Expo Go → **Forcer l'arrêt** (ou balayer Expo Go hors de l'écran).
3. Rouvrir Expo Go, rescanner le QR, revenir sur l'onglet **Panier**.

**Attendu :** compteur **`3/5`** et les 3 mêmes cours dans « Dans le panier ».
La sélection est relue depuis `recordings.json`, pas depuis la mémoire.

---

## G. Test 6 — Préparer l'analyse

1. Avec 2 ou 3 cours sélectionnés, toucher **Préparer l'analyse**.

**Attendu :**

- courte vérification, puis carte verte « **Lot prêt pour l'analyse** » ;
- résumé `N fichiers · durée · date`, badge **VALIDÉ**, liste des noms de
  fichiers ;
- mention explicite : « Aucune analyse n'a été lancée : le lot est enregistré
  sur le téléphone… ».

2. Changer la sélection (ajouter ou retirer un cours).

**Attendu :** la carte verte disparaît (le lot ne décrit plus la sélection) ;
« Préparer l'analyse » reste disponible.

3. Fermer l'application, la rouvrir, revenir sur le panier sans changer la
   sélection, puis toucher **Préparer l'analyse**.

**Attendu :** un nouveau lot est créé et affiché. Rien n'est envoyé sur le
réseau : le téléphone peut rester en mode avion.

---

## H. Test 7 — Panier vide et fichier introuvable

1. Avant tout enregistrement (ou après avoir retiré tous les cours du panier).
2. **Aucun enregistrement** : l'écran affiche la carte « **Ton panier est
   vide** » et le bouton « **Enregistrer un cours** » qui ouvre l'écran de
   capture.

Le cas d'un fichier audio supprimé hors de l'application est traité par le code
(badge « Fichier introuvable », préparation bloquée avec message). Il n'est pas
reproductible depuis Expo Go, car ses fichiers sont dans un espace privé
inaccessible sans câble USB.

---

## I. Ce qu'il faut me rapporter

1. une **capture d'écran** du panier avec 3 cours sélectionnés ;
2. le comportement exact lors du **sixième** fichier (message affiché ?) ;
3. le résultat du test de fermeture/réouverture (F) ;
4. le texte affiché par la carte verte après « Préparer l'analyse » ;
5. le nombre de cours avant/après le test de non-suppression (E).

---

## J. Limites connues

- **Analyse réelle** : après « Préparer l'analyse », le bouton « Analyser le lot »
  envoie les fichiers au backend sécurisé. Sans `EXPO_PUBLIC_API_URL`, l'écran
  l'indique et ne crée aucun cours.
- **Une seule analyse à la fois** : un nouveau lot remplace le précédent.
- **Pas de lecture audio** dans le panier : on prépare, on n'écoute pas encore.
