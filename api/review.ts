// Fonction serverless Vercel : reçoit les avis du widget BrevetBoost,
// appelle DeepSeek (chat) et écrit dans Google Sheets. Tout est côté serveur
// → la clé DeepSeek et l'accès Google ne sont JAMAIS dans le bundle public.
//
// Comportement :
//   - type "avis"      → 1 ligne (note + avis écrit)
//   - type "chat"      → renvoie juste la réponse de l'IA, AUCUNE écriture
//   - type "chat_save" → 1 SEULE ligne pour toute la conversation : résumé bref
//                        visible (colonne Avis_texte) + conversation complète en
//                        NOTE sur la cellule (survol/clic pour la dérouler)
//
// Variables d'environnement (Vercel) : DEEPSEEK_API_KEY, GOOGLE_CLIENT_EMAIL,
//   GOOGLE_PRIVATE_KEY, SHEET_ID, SHEET_NAME (défaut "Feuille 1").
import crypto from 'node:crypto'

const SHEET_ID = process.env.SHEET_ID || ''
const SHEET_NAME = process.env.SHEET_NAME || 'Feuille 1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || ''
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(
    JSON.stringify({
      iss: GOOGLE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const unsigned = `${header}.${claim}`
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(GOOGLE_PRIVATE_KEY)
  const jwt = `${unsigned}.${b64url(signature)}`
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const data = (await resp.json()) as { access_token?: string }
  if (!data.access_token) throw new Error('Auth Google échouée: ' + JSON.stringify(data))
  return data.access_token
}

// Ajoute une ligne et renvoie la réponse de l'API (pour récupérer la plage écrite).
async function sheetsAppend(token: string, row: (string | number)[]): Promise<any> {
  const range = encodeURIComponent(`${SHEET_NAME}!A1`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  })
  if (!resp.ok) throw new Error('Écriture Sheets échouée: ' + (await resp.text()))
  return resp.json()
}

// Pose une NOTE sur une cellule (conversation complète cachée, révélée au survol/clic).
async function setCellNote(token: string, rowIndex0: number, colIndex0: number, note: string): Promise<void> {
  const body = {
    requests: [
      {
        updateCells: {
          range: {
            sheetId: 0,
            startRowIndex: rowIndex0,
            endRowIndex: rowIndex0 + 1,
            startColumnIndex: colIndex0,
            endColumnIndex: colIndex0 + 1,
          },
          rows: [{ values: [{ note }] }],
          fields: 'note',
        },
      },
    ],
  }
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error('Note Sheets: ' + (await resp.text()))
}

// Lit TOUS les avis du Sheet (valeurs + notes) pour le tableau de bord admin.
async function readReviews(token: string): Promise<any[]> {
  const range = encodeURIComponent(`${SHEET_NAME}!A1:H2000`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?ranges=${range}&includeGridData=true&fields=sheets.data.rowData.values(formattedValue,note)`
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!resp.ok) throw new Error('Lecture Sheets échouée: ' + (await resp.text()))
  const data: any = await resp.json()
  const rowData: any[] = data?.sheets?.[0]?.data?.[0]?.rowData || []
  const out: any[] = []
  for (let i = 1; i < rowData.length; i++) {
    const cells: any[] = rowData[i]?.values || []
    const v = (j: number): string => (cells[j]?.formattedValue ?? '') as string
    if (!v(0) && !v(1) && !v(2)) continue
    out.push({
      date: v(0),
      name: v(1),
      type: v(2),
      rating: v(3),
      text: v(4),
      message: v(5),
      reply: v(6),
      conversation: (cells[4]?.note ?? '') as string,
      ip: v(7),
    })
  }
  out.reverse() // plus récent en premier
  return out
}

type ChatMessage = { role: string; content: string }

async function deepseek(messages: ChatMessage[], maxTokens = 512): Promise<string> {
  const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', max_tokens: maxTokens, messages }),
  })
  const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || ''
}

const chatSystem = (name: string): ChatMessage => ({
  role: 'system',
  content:
    "Tu es l'assistant d'avis d'une application de quiz pour réviser le brevet des collèges. " +
    'Tu discutes avec l’élève nommé « ' +
    (name || "l'élève") +
    ' » pour recueillir son avis, de façon chaleureuse et BRÈVE. ' +
    'Règles : pose UNE seule question à la fois (ce qu’il a aimé, ce qu’on pourrait améliorer). ' +
    'Après 1 à 2 réponses de l’élève, remercie-le par son prénom et conclus sans poser de nouvelle question. ' +
    'Messages très courts, 1 à 2 phrases. Si l’historique est vide, salue l’élève par son prénom et demande ce qu’il a pensé de l’application.',
})

const cleanConvo = (messages: unknown): ChatMessage[] =>
  (Array.isArray(messages) ? messages : []).filter(
    (m: any) => m && m.content && !String(m.content).startsWith('[Début]'),
  )

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { type, name } = body
    const now = new Date().toISOString()
    const ip = String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '').split(',')[0].trim()

    // ───── Avis étoilé : 1 ligne ─────
    if (type === 'avis') {
      const token = await getGoogleAccessToken()
      await sheetsAppend(token, [now, name || '', 'avis', body.rating ?? '', body.text || '', '', '', ip])
      return res.status(200).json({ ok: true })
    }

    // ───── Chat en cours : réponse de l'IA uniquement, AUCUNE écriture ─────
    if (type === 'chat') {
      const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
      const reply = await deepseek([chatSystem(name), ...messages])
      return res.status(200).json({ reply: reply || 'Merci beaucoup pour ton retour ! 🙏' })
    }

    // ───── Fin de conversation : 1 SEULE ligne (résumé bref + transcript en note) ─────
    if (type === 'chat_save') {
      const convo = cleanConvo(body.messages)
      if (!convo.length) return res.status(200).json({ ok: true, skipped: true })

      const transcript = convo
        .map((m) => (m.role === 'user' ? 'Élève' : 'Assistant') + ' : ' + m.content)
        .join('\n\n')

      let summary = (
        await deepseek(
          [
            {
              role: 'system',
              content:
                "Tu résumes l'avis d'un élève sur une appli de quiz pour réviser le brevet. Réponds par UNE seule phrase TRÈS brève (max ~15 mots), en français, captant l'essentiel de son retour (ce qu'il aime et/ou ce qu'il voudrait améliorer). Pas de préambule, juste le résumé.",
            },
            { role: 'user', content: 'Conversation :\n' + transcript + '\n\nRésumé en une phrase :' },
          ],
          80,
        )
      )
        .trim()
        .replace(/^["«»']|["«»']$/g, '')
        .trim()
      if (!summary) summary = 'Avis recueilli via le chat.'

      const token = await getGoogleAccessToken()
      const appendResp = await sheetsAppend(token, [now, name || '', 'chat', '', summary, '', '', ip])
      const updatedRange: string = appendResp?.updates?.updatedRange || ''
      const match = updatedRange.match(/![A-Z]+(\d+)/)
      if (match) {
        try {
          await setCellNote(token, parseInt(match[1], 10) - 1, 4, 'Conversation complète :\n\n' + transcript)
        } catch (e) {
          console.error('[api/review] note non posée', e)
        }
      }
      return res.status(200).json({ ok: true })
    }

    // ───── Tableau de bord admin : liste de tous les avis (protégé par mot de passe) ─────
    if (type === 'admin_list') {
      const pwd = process.env.ADMIN_PASSWORD || ''
      if (!pwd || body.key !== pwd) return res.status(401).json({ error: 'Accès refusé' })
      const token = await getGoogleAccessToken()
      const reviews = await readReviews(token)
      return res.status(200).json({ reviews })
    }

    // ───── Admin : vider tous les avis (garde les en-têtes), protégé par mot de passe ─────
    if (type === 'admin_clear') {
      const pwd = process.env.ADMIN_PASSWORD || ''
      if (!pwd || body.key !== pwd) return res.status(401).json({ error: 'Accès refusé' })
      const token = await getGoogleAccessToken()
      const range = encodeURIComponent(`${SHEET_NAME}!A2:Z100000`)
      const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error('Effacement Sheets échoué: ' + (await r.text()))
      return res.status(200).json({ ok: true })
    }

    // ───── Admin : (re)pose les en-têtes du Sheet, dont la colonne IP ─────
    if (type === 'admin_setup') {
      const pwd = process.env.ADMIN_PASSWORD || ''
      if (!pwd || body.key !== pwd) return res.status(401).json({ error: 'Accès refusé' })
      const token = await getGoogleAccessToken()
      const range = encodeURIComponent(`${SHEET_NAME}!A1:H1`)
      const r = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: [['Horodatage', 'Nom', 'Type', 'Note', 'Avis_texte', 'Message_eleve', 'Reponse_bot', 'IP']],
          }),
        },
      )
      if (!r.ok) throw new Error('Setup en-têtes échoué: ' + (await r.text()))
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'type invalide' })
  } catch (err: any) {
    console.error('[api/review]', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
