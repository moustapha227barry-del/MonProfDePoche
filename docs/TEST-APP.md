# Lancer Mon Prof de Poche sur un Samsung

Procédure complète, du premier lancement au test de l'analyse.

---

## 1. Sur l'ordinateur

1. Installer **Node.js 20+** : <https://nodejs.org>.
2. Ouvrir le dossier du projet dans **VS Code**.
3. Terminal intégré (`Ctrl + ù`), puis :

   ```bash
   npm install
   npx expo start
   ```

4. Laisser le terminal ouvert : il affiche un **QR code**.

### Configurer le backend IA (facultatif pour commencer)

Sans backend, tout fonctionne **sauf** l'analyse et le tuteur, qui affichent un
message clair au lieu d'inventer une réponse.

1. Créer `.env` à la racine (copie de `.env.example`).
2. Y mettre l'URL du backend :

   ```bash
   EXPO_PUBLIC_API_URL=https://mon-prof-ai.<ton-compte>.workers.dev
   ```

3. Relancer `npx expo start` (les variables sont lues au démarrage).

## 2. Sur le Samsung

1. Installer **Expo Go** depuis le **Play Store**.
2. Connecter le téléphone au **même Wi-Fi** que l'ordinateur.
3. Ouvrir Expo Go → **Scan QR code** → viser le QR du terminal.
4. Attendre la compilation (30–90 s la première fois).

**Si le QR ne se connecte pas :**

```bash
npx expo start --tunnel
```

ou en USB (débogage USB activé) :

```bash
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```

---

## 3. Parcours de test recommandé

### A. Enregistrement

- [ ] Bouton micro central → matière → **Démarrer** → autoriser le micro.
- [ ] Parler : le chronomètre avance, l’onde bouge.
- [ ] **Pause** (le chrono se fige) → **Reprendre** → **Terminer**.
- [ ] La carte verte affiche le chemin `file:///…/Audio/cours-….m4a`.
- [ ] La ligne apparaît dans « Enregistrements sauvegardés ».
- [ ] **Écouter** lit le fichier, **Pause** l’arrête.
- [ ] **Renommer** change le titre, **Supprimer** demande confirmation.

### B. Panier

- [ ] Sélectionner 5 cours → compteur `5/5`.
- [ ] Toucher un sixième → message de limite, compteur inchangé.
- [ ] « Retirer » ne supprime pas le fichier (vérifier dans Enregistrement).
- [ ] Forcer l’arrêt d’Expo Go, rouvrir → la sélection est conservée.
- [ ] **Préparer l’analyse** → carte « Lot prêt ».

### C. Analyse (si backend configuré)

- [ ] **Analyser le lot** → attente → « Analyse terminée ».
- [ ] Le cours apparaît dans **Mes cours**, avec chapitres, sections, notions.
- [ ] Les passages incertains sont listés dans le cours.
- [ ] Les enregistrements d’origine sont cités dans le cours.

Sans backend : carte « Backend non configuré », aucun cours créé.

### D. Cours

- [ ] Rechercher un mot (accents ignorés), filtrer par matière.
- [ ] Ouvrir un cours, déplier un chapitre.
- [ ] Marquer un chapitre **étudié**, noter une notion **Compris / À revoir**.
- [ ] Renommer le cours, puis le supprimer (les audios restent).

### E. Tuteur

- [ ] Choisir un cours, poser une question.
- [ ] La réponse cite des notions du cours ; une réponse sans appui est signalée.
- [ ] Sans backend : message explicite, aucune réponse inventée.

### F. Progression

- [ ] Temps, cours, chapitres étudiés et maîtrise correspondent aux données.
- [ ] La semaine et la série de jours reflètent les enregistrements réels.

### G. Paramètres

- [ ] Modifier le nom, enregistrer, fermer/rouvrir : le nom est conservé.
- [ ] Désactiver le consentement IA : l’analyse refuse de partir.
- [ ] **Supprimer toutes mes données** : double confirmation, tout est effacé.

---

## 4. Dépannage

| Symptôme | Cause | Solution |
|---|---|---|
| « Project is incompatible with Expo Go » | Expo Go trop ancien | mettre Expo Go à jour (SDK 58) |
| QR sans connexion | Wi-Fi différent / réseau isolé | `--tunnel`, ou USB + `adb reverse` |
| Micro refusé | permission bloquée | carte « Microphone bloqué » → réglages Android |
| Analyse : backend non configuré | `.env` absent | ajouter `EXPO_PUBLIC_API_URL`, relancer Expo |
| Analyse : 429 | trop de requêtes | attendre une minute |
| Analyse : timeout | audio très long | lots de 2–3 fichiers |
| Cours vide | aucune analyse réussie | normal : aucun cours fictif n’est créé |

## 5. Limites actuelles

- Enregistrement **au premier plan** uniquement (Expo Go).
- Authentification e-mail / Google **non branchée** (boutons inactifs).
- Sauvegarde cloud **non active** (option préparée, désactivée par défaut).
- Les exercices ne sont pas encore générés ; la progression enregistre déjà
  leurs résultats dès qu’ils existeront.
