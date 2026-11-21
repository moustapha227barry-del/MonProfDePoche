# Analyse IA et backend sécurisé

L'application mobile ne contient **aucune clé d'API**. Elle envoie les fichiers
audio à un backend qui détient la clé et parle au fournisseur IA.

```
Téléphone (Expo)                    Backend (Cloudflare Worker)      Fournisseur IA
┌────────────────────┐   multipart  ┌──────────────────────────┐    ┌──────────────┐
│ panier → lot prêt  │ ───────────► │ /analysis                │───►│ transcription│
│ EXPO_PUBLIC_API_URL│              │  clé AI_API_KEY (secret) │    │ + chat JSON  │
│ aucun secret       │ ◄─────────── │  validation + limites    │◄───│              │
└────────────────────┘   cours JSON └──────────────────────────┘    └──────────────┘
```

## Pourquoi cette architecture

- **Sécurité** : la clé ne peut pas être extraite d'une application mobile. Elle
  reste dans un secret du backend.
- **Coûts maîtrisés** : le backend impose 5 fichiers maximum, 25 Mo par fichier,
  80 Mo par requête et 8 requêtes/minute par IP.
- **Fournisseur interchangeable** : le backend parle un protocole compatible
  OpenAI (`/audio/transcriptions` et `/chat/completions`). Changer de modèle ou
  de fournisseur se fait par variables d'environnement, sans toucher à
  l'application.
- **Aucune invention** : le prompt impose un JSON strict et une liste
  `uncertainties`. Le client refuse toute réponse non conforme
  (`invalid-response`) et n'enregistre alors aucun cours.

## Ce qui est déjà fait

| Élément | État |
|---|---|
| Client d'analyse (multipart, timeout, erreurs 401/413/429/5xx, JSON invalide) | ✅ implémenté et testé |
| Client du tuteur (contexte de cours, citations vérifiées côté client) | ✅ implémenté et testé |
| Worker `/health`, `/analysis`, `/tutor`, CORS, limiteur de débit | ✅ implémenté et testé |
| Prompts anti-hallucination, normalisation, extraction JSON | ✅ implémenté et testé |
| Consentement IA dans les paramètres, refus sans consentement | ✅ implémenté |
| Clé API et déploiement | ⛔ **action utilisateur** (voir plus bas) |

## Ce qu'il te reste à fournir

1. **Une clé API** d'un fournisseur compatible OpenAI :
   - OpenAI (Whisper + `gpt-4o-mini`) ;
   - ou un fournisseur compatible (Groq, Together, OpenRouter avec un endpoint
     compatible, etc.). L'URL se change avec `AI_BASE_URL`.
2. **Un hébergement** pour le worker : compte Cloudflare (gratuit) ou tout hôte
   Node/Workers équivalent.
3. **L'URL du backend** dans `.env` à la racine du projet :

   ```bash
   EXPO_PUBLIC_API_URL=https://mon-prof-ai.<ton-compte>.workers.dev
   ```

   Puis relancer `npx expo start` (Expo lit les variables au démarrage).

## Déployer le backend

```bash
cd backend
npx wrangler login                    # navigateur : action utilisateur
npx wrangler secret put AI_API_KEY    # colle la clé, elle n'apparaît nulle part
npx wrangler deploy
```

Vérification :

```bash
curl https://<ton-worker>.workers.dev/health
# { "ok": true, "aiConfigured": true, "models": { ... } }
```

## Variables

| Variable | Où | Rôle |
|---|---|---|
| `AI_API_KEY` | secret `wrangler` | clé du fournisseur, jamais côté client |
| `AI_BASE_URL` | `wrangler.toml` | endpoint compatible OpenAI |
| `AI_TRANSCRIPTION_MODEL` | `wrangler.toml` | modèle de transcription (`whisper-1`) |
| `AI_CHAT_MODEL` | `wrangler.toml` | modèle de structuration (`gpt-4o-mini`) |
| `ALLOWED_ORIGIN` | `wrangler.toml` | origine autorisée en production |
| `EXPO_PUBLIC_API_URL` | `.env` du téléphone/app | URL publique du backend |

## Coûts et limites

- La transcription est facturée **à la minute** d'audio ; la structuration en
  tokens. Un cours de 45 minutes coûte surtout la transcription.
- `gpt-4o-mini` + `whisper-1` sont les options les moins chères.
- L'analyse est **synchrone** : au-delà de ~5–10 minutes d'audio, préférer des
  lots de 2 à 3 fichiers.
- Les fichiers ne sont **pas stockés** par le worker : ils sont transcrits puis
  oubliés. Le cours et la transcription repartent vers le téléphone.

## Erreurs visibles dans l'application

| Code | Message |
|---|---|
| `missing-backend` | service IA non configuré (URL absente) |
| `network` / `timeout` | connexion impossible ou backend trop lent |
| `rate-limit` | trop de demandes, patienter |
| `payload-too-large` | lot trop volumineux |
| `unauthorized` | clé ou configuration backend refusée |
| `invalid-response` | réponse inexploitable, aucun cours enregistré |
| `server` | erreur du fournisseur ou du backend |

## Sécurité — règles à conserver

1. Ne jamais écrire `AI_API_KEY` dans le dépôt, `app.json`, `eas.json`, un
   écran ou un fichier `.env` versionné.
2. `ALLOWED_ORIGIN` doit être restreint en production.
3. Avant une ouverture publique, ajouter l'authentification utilisateur côté
   worker : aujourd'hui il ne vérifie que l'origine et le débit.
4. Les données restent sur le téléphone ; l'envoi n'a lieu qu'après une action
   explicite et avec le consentement IA activé.
