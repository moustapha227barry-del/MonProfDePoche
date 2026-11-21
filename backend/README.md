# Backend IA — Mon Prof de Poche

Worker Cloudflare qui détient la clé du fournisseur IA. Le téléphone ne connaît
que son URL publique.

## Rôle

| Route | Entrée | Sortie |
|---|---|---|
| `GET /health` | — | `{ ok, aiConfigured, models }` |
| `POST /analysis` | multipart : `payload` (JSON du lot) + 1 à 5 fichiers `audio` | `{ course, uncertainties, transcript }` |
| `POST /tutor` | JSON : `question`, `level`, `course.context`, `history` | `{ answer, hint?, citations, grounded }` |

L'analyse transcrit chaque fichier (endpoint `/audio/transcriptions` compatible
OpenAI), puis demande un cours structuré en JSON. Le tuteur répond uniquement à
partir du contexte fourni par l'application.

## Configuration

```bash
cd backend
npx wrangler login                       # action utilisateur (navigateur)
npx wrangler secret put AI_API_KEY       # colle la clé quand demandé
npx wrangler deploy
```

Variables non secrètes : `AI_BASE_URL`, `AI_TRANSCRIPTION_MODEL`,
`AI_CHAT_MODEL`, `ALLOWED_ORIGIN` (`wrangler.toml`).

`ALLOWED_ORIGIN` doit être l'origine exacte de l'application en production ;
`*` ne sert qu'au développement.

## Sécurité

- aucune clé dans le dépôt, `app.json`, `eas.json` ou le bundle mobile ;
- limite de 5 fichiers, 25 Mo par fichier, 80 Mo par requête ;
- limiteur de débit en mémoire : 8 requêtes/minute par IP (à remplacer par
  Cloudflare Rate Limiting pour la production) ;
- erreurs du fournisseur traduites, jamais renvoyées telles quelles ;
- les transcriptions et cours ne sont pas stockés côté backend : ils repartent
  vers le téléphone et restent locaux.

## Limites connues

- Le worker ne vérifie pas l'identité de l'utilisateur : à coupler avec
  l'authentification avant une mise en production publique.
- L'analyse est synchrone : les très longs cours peuvent dépasser le délai du
  client. Découper en lots de 2 à 3 fichiers est plus fiable.
- Le coût dépend du fournisseur : transcription à la minute + tokens du modèle
  de chat. `gpt-4o-mini` et `whisper-1` sont les options les moins chères.
