// Fonction serverless Vercel : reçoit les avis du widget BrevetBoost,
// appelle DeepSeek (pour le chat) et écrit la ligne dans Google Sheets.
// Tout est côté serveur → la clé DeepSeek et l'accès Google ne sont JAMAIS
// exposés dans le bundle public du site.
//
// Variables d'environnement attendues (réglées dans Vercel) :
//   DEEPSEEK_API_KEY      — clé API DeepSeek
//   GOOGLE_CLIENT_EMAIL   — email du compte de service Google
//   GOOGLE_PRIVATE_KEY    — clé privée du compte de service (avec \n échappés)
//   SHEET_ID              — id du Google Sheet
//   SHEET_NAME            — nom de l'onglet (défaut: "Feuille 1")
import crypto from 'node:crypto'

const SHEET_ID = process.env.SHEET_ID || ''
const SHEET_NAME = process.env.SHEET_NAME || 'Feuille 1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || ''
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

// Génère un access token Google via un JWT signé avec la clé du compte de service.
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
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = (await resp.json()) as { access_token?: string; error_description?: string }
  if (!data.access_token) throw new Error('Auth Google échouée: ' + JSON.stringify(data))
  return data.access_token
}

// Ajoute une ligne dans le Sheet (colonnes : Horodatage, Nom, Type, Note, Avis_texte, Message_eleve, Reponse_bot).
async function appendRow(token: string, row: (string | number)[]): Promise<void> {
  const range = encodeURIComponent(`${SHEET_NAME}!A1`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  })
  if (!resp.ok) throw new Error('Écriture Sheets échouée: ' + (await resp.text()))
}

type ChatMessage = { role: string; content: string }

async function deepseekReply(name: string, messages: ChatMessage[]): Promise<string> {
  const system: ChatMessage = {
    role: 'system',
    content:
      "Tu es l'assistant d'avis d'une application de quiz pour réviser le brevet des collèges. " +
      'Tu discutes avec l’élève nommé « ' +
      (name || "l'élève") +
      ' » pour recueillir son avis sur l’application, de façon chaleureuse et BRÈVE. ' +
      'Règles : pose UNE seule question à la fois sur son expérience (ce qu’il a aimé, ce qu’on pourrait améliorer). ' +
      'Après 1 à 2 réponses de l’élève, remercie-le chaleureusement par son prénom et conclus la conversation sans poser de nouvelle question. ' +
      'Garde des messages très courts, 1 à 2 phrases. ' +
      'Si l’historique est vide, salue l’élève par son prénom et demande-lui ce qu’il a pensé de l’application.',
  }
  const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 512, messages: [system, ...messages] }),
  })
  const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || 'Merci beaucoup pour ton retour ! 🙏'
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { type, name } = body
    const now = new Date().toISOString()
    const token = await getGoogleAccessToken()

    if (type === 'avis') {
      await appendRow(token, [now, name || '', 'avis', body.rating ?? '', body.text || '', '', ''])
      return res.status(200).json({ ok: true })
    }

    if (type === 'chat') {
      const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
      const reply = await deepseekReply(name, messages)
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
      await appendRow(token, [now, name || '', 'chat', '', '', lastUser, reply])
      return res.status(200).json({ reply })
    }

    return res.status(400).json({ error: 'type invalide (attendu "avis" ou "chat")' })
  } catch (err: any) {
    console.error('[api/review]', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
