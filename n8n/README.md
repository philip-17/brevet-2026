# n8n — workflow « Phifou - Tuteur »

Workflow prêt à importer pour faire passer l'assistant **Phifou** par ton n8n
(au lieu de l'appel DeepSeek direct). Tant que tu ne l'actives pas + ne définis
pas `N8N_TUTOR_WEBHOOK` côté Vercel, le site continue d'utiliser DeepSeek direct
(robuste, toujours en ligne) — aucun risque.

Fichier : [`coach-bb-tuteur.json`](./coach-bb-tuteur.json)
Chaîne : `Webhook (POST /tutor) → Préparer requête → DeepSeek → Extraire réponse → Respond`

## 1. Importer dans n8n
1. n8n → menu **⋯** (en haut à droite d'un workflow) → **Import from File…**
2. Choisis `coach-bb-tuteur.json`.

## 2. Brancher la clé DeepSeek (sans la retaper)
- Ouvre le nœud **DeepSeek** → champ **Credential to connect with** → sélectionne
  ta credential **Header Auth** existante (celle du workflow « Bot Review »,
  `Authorization: Bearer sk-…`). Aucune clé à ressaisir.
- Si tu n'en as pas en Header Auth : crée une credential *Header Auth*,
  Name = `Authorization`, Value = `Bearer TA_CLE_DEEPSEEK`.

## 3. Tester puis activer
- **Execute workflow** + envoie un POST de test sur l'URL *Test* du webhook :
  ```bash
  curl -X POST http://localhost:5678/webhook-test/tutor \
    -H 'Content-Type: application/json' \
    -d '{"messages":[{"role":"user","content":"Explique Pythagore en 2 lignes"}]}'
  ```
- Si la réponse ressemble à `{"reply":"..."}`, **active** le workflow (toggle en haut).

## 4. Passer le site en prod sur n8n
⚠️ Vercel (public) ne peut PAS joindre `localhost:5678`. Il faut une URL publique :
- **Rapide (dev)** : relancer n8n avec `n8n start --tunnel` → URL `https://…hooks.n8n.cloud/webhook/tutor`.
- **Stable** : un tunnel type `cloudflared` avec domaine fixe, ou **n8n Cloud**.
- ⚠️ Dans tous les cas, ta machine / le tunnel doit rester allumé, sinon
  l'assistant tombe pour les élèves.

Puis, Vercel → Project → **Settings → Environment Variables** :
```
N8N_TUTOR_WEBHOOK = https://<ton-hôte-public>/webhook/tutor
```
→ Redeploy. Le site route alors par n8n. Pour revenir au DeepSeek direct :
supprime la variable et redeploy.

## Contrat (ce que /api/tutor envoie / attend)
- Envoie : `{ "type":"tutor", "name":"", "context":"…", "messages":[{role,content}…] }`
  (rôles `user`/`assistant` uniquement, déjà nettoyés côté serveur).
- Attend en retour : `{ "reply":"…" }` (ou `output` / `text` — le serveur est tolérant).

Le prompt système (ton, sécurité enfant, format) est **dans le nœud « Préparer
requête »** : tu peux l'éditer dans n8n sans redéployer le site.
