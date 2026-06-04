// Fonction serverless Vercel : avis + chat (DeepSeek) + journal de connexions,
// le tout écrit dans Google Sheets via un compte de service. Clés côté serveur
// uniquement (jamais dans le bundle public).
//
//   type "avis"                    → 1 ligne (Feuille 1)
//   type "chat"                    → réponse IA seule, n'écrit rien
//   type "chat_save"               → 1 ligne (résumé + conversation en note)
//   type "visit"                   → 1 ligne dans l'onglet "Connexions" (ping public)
//   type "admin_list"              → tous les avis (protégé)
//   type "admin_connections"       → toutes les connexions (protégé)
//   type "admin_clear"             → vide les avis (protégé)
//   type "admin_clear_connections" → vide les connexions (protégé)
//   type "admin_setup"             → (re)pose les en-têtes + crée l'onglet Connexions (protégé)
//
// Env (Vercel) : DEEPSEEK_API_KEY, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY,
//   SHEET_ID, SHEET_NAME (="Feuille 1"), ADMIN_PASSWORD.
import crypto from 'node:crypto'

const SHEET_ID = process.env.SHEET_ID || ''
const SHEET_NAME = process.env.SHEET_NAME || 'Feuille 1'
const CONNECTIONS_SHEET = 'Connexions'
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

async function sheetsAppend(token: string, row: (string | number)[], sheetName: string = SHEET_NAME): Promise<any> {
  const range = encodeURIComponent(`${sheetName}!A1`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  })
  if (!resp.ok) throw new Error('Écriture Sheets échouée: ' + (await resp.text()))
  return resp.json()
}

async function sheetsReadValues(token: string, sheetName: string, range = 'A2:D5000'): Promise<string[][]> {
  const r = encodeURIComponent(`${sheetName}!${range}`)
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${r}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) throw new Error('Lecture Sheets échouée: ' + (await resp.text()))
  const data: any = await resp.json()
  return data.values || []
}

// Crée l'onglet "Connexions" (ignore si déjà présent) + (re)pose ses en-têtes.
async function ensureConnectionsTab(token: string): Promise<void> {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: CONNECTIONS_SHEET } } }] }),
  }) // si l'onglet existe déjà, la requête échoue silencieusement, ce n'est pas grave
  const range = encodeURIComponent(`${CONNECTIONS_SHEET}!A1:E1`)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [['Horodatage', 'IP', 'Page', 'Navigateur', 'Lieu']] }),
  })
}

async function setCellNote(token: string, rowIndex0: number, colIndex0: number, note: string): Promise<void> {
  const body = {
    requests: [
      {
        updateCells: {
          range: { sheetId: 0, startRowIndex: rowIndex0, endRowIndex: rowIndex0 + 1, startColumnIndex: colIndex0, endColumnIndex: colIndex0 + 1 },
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

// Lit tous les avis (valeurs + notes) pour le tableau de bord admin.
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
  out.reverse()
  return out
}

type ChatMessage = { role: string; content: string }

async function deepseek(messages: ChatMessage[], maxTokens = 512, temperature = 0.7): Promise<string> {
  const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', max_tokens: maxTokens, temperature, messages }),
  })
  const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || ''
}

const chatSystem = (name: string): ChatMessage => ({
  role: 'system',
  content:
    "Tu es l'assistant d'avis de BrevetBoost, une application de quiz pour réviser le brevet des collèges. " +
    'Tu discutes avec l’élève « ' +
    (name || "l'élève") +
    ' » pour recueillir un avis RICHE et DÉTAILLÉ, comme une petite interview amicale. Tutoie-le, reste chaleureux et naturel.\n' +
    'OBJECTIF : creuser pour comprendre vraiment son expérience, pas juste récolter un compliment.\n' +
    'MÉTHODE :\n' +
    '- Pose UNE seule question à la fois, courte (1 à 3 phrases), facile à lire sur téléphone.\n' +
    "- REBONDIS toujours sur ce qu’il vient de dire avant de passer à autre chose : demande un exemple précis, un « pourquoi », un détail concret (« quel chapitre ? », « qu’est-ce qui t’a bloqué exactement ? », « tu changerais quoi ? »).\n" +
    "- Si sa réponse est vague (« c’est bien », « rien », « je sais pas »), relance gentiment pour obtenir du concret au lieu de conclure.\n" +
    '- Explore progressivement plusieurs aspects, un par message : ce qu’il a aimé · ce qui l’a gêné ou ce qui manque · la difficulté des quiz · la clarté et le design · une fonctionnalité qu’il aimerait · s’il recommanderait l’appli à un ami et pourquoi.\n' +
    'RYTHME : mène une vraie discussion (vise environ 5 à 7 échanges). Ne conclus PAS après une ou deux réponses. ' +
    "Conclus seulement quand tu as fait le tour des sujets, ou si l’élève répond de façon très brève/désengagée plusieurs fois de suite : remercie-le alors par son prénom, chaleureusement, sans poser de nouvelle question.\n" +
    "Si l’historique est vide, salue l’élève par son prénom et demande-lui d’abord ce qu’il a pensé de l’application.",
})

const cleanConvo = (messages: unknown): ChatMessage[] =>
  (Array.isArray(messages) ? messages : []).filter((m: any) => m && m.content && !String(m.content).startsWith('[Début]'))

function checkAdmin(body: any, res: any): boolean {
  const pwd = process.env.ADMIN_PASSWORD || ''
  if (!pwd || body.key !== pwd) {
    res.status(401).json({ error: 'Accès refusé' })
    return false
  }
  return true
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { type, name } = body
    const now = new Date().toISOString()
    const ip = String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '').split(',')[0].trim()

    if (type === 'avis') {
      const token = await getGoogleAccessToken()
      await sheetsAppend(token, [now, name || '', 'avis', body.rating ?? '', body.text || '', '', '', ip])
      return res.status(200).json({ ok: true })
    }

    if (type === 'chat') {
      const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
      const reply = await deepseek([chatSystem(name), ...messages], 512, 0.9)
      return res.status(200).json({ reply: reply || 'Merci beaucoup pour ton retour ! 🙏' })
    }

    if (type === 'chat_save') {
      const convo = cleanConvo(body.messages)
      if (!convo.length) return res.status(200).json({ ok: true, skipped: true })
      const transcript = convo.map((m) => (m.role === 'user' ? 'Élève' : 'Assistant') + ' : ' + m.content).join('\n\n')
      let summary = (
        await deepseek(
          [
            { role: 'system', content: "Tu résumes l'avis d'un élève sur une appli de quiz pour réviser le brevet. Réponds par UNE seule phrase TRÈS brève (max ~15 mots), en français, captant l'essentiel de son retour. Pas de préambule, juste le résumé." },
            { role: 'user', content: 'Conversation :\n' + transcript + '\n\nRésumé en une phrase :' },
          ],
          80,
          0.2,
        )
      ).trim().replace(/^["«»']|["«»']$/g, '').trim()
      if (!summary) summary = 'Avis recueilli via le chat.'
      const token = await getGoogleAccessToken()
      const appendResp = await sheetsAppend(token, [now, name || '', 'chat', '', summary, '', '', ip])
      const match = String(appendResp?.updates?.updatedRange || '').match(/![A-Z]+(\d+)/)
      if (match) {
        try {
          await setCellNote(token, parseInt(match[1], 10) - 1, 4, 'Conversation complète :\n\n' + transcript)
        } catch (e) {
          console.error('[api/review] note non posée', e)
        }
      }
      return res.status(200).json({ ok: true })
    }

    // Journal de connexion : ping public à l'ouverture du site.
    if (type === 'visit') {
      const token = await getGoogleAccessToken()
      const ua = String(req.headers?.['user-agent'] || '').slice(0, 300)
      const page = String(body.page || '').slice(0, 200)
      const country = String(req.headers?.['x-vercel-ip-country'] || '')
      let city = String(req.headers?.['x-vercel-ip-city'] || '')
      try { city = decodeURIComponent(city) } catch { /* garde tel quel */ }
      const lieu = [city, country].filter(Boolean).join(', ')
      const row = [now, ip, page, ua, lieu]
      try {
        await sheetsAppend(token, row, CONNECTIONS_SHEET)
      } catch {
        await ensureConnectionsTab(token) // onglet pas encore créé → on le crée et on réessaie
        await sheetsAppend(token, row, CONNECTIONS_SHEET)
      }
      return res.status(200).json({ ok: true })
    }

    if (type === 'admin_list') {
      if (!checkAdmin(body, res)) return
      const token = await getGoogleAccessToken()
      return res.status(200).json({ reviews: await readReviews(token) })
    }

    if (type === 'admin_connections') {
      if (!checkAdmin(body, res)) return
      const token = await getGoogleAccessToken()
      let rows: string[][] = []
      try {
        rows = await sheetsReadValues(token, CONNECTIONS_SHEET, 'A2:E5000')
      } catch {
        rows = []
      }
      const connections = rows
        .filter((r) => r && (r[0] || r[1]))
        .map((r) => ({ date: r[0] || '', ip: r[1] || '', page: r[2] || '', ua: r[3] || '', lieu: r[4] || '' }))
        .reverse()
      return res.status(200).json({ connections })
    }

    if (type === 'admin_clear') {
      if (!checkAdmin(body, res)) return
      const token = await getGoogleAccessToken()
      const range = encodeURIComponent(`${SHEET_NAME}!A2:Z100000`)
      const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:clear`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error('Effacement Sheets échoué: ' + (await r.text()))
      return res.status(200).json({ ok: true })
    }

    if (type === 'admin_clear_connections') {
      if (!checkAdmin(body, res)) return
      const token = await getGoogleAccessToken()
      const range = encodeURIComponent(`${CONNECTIONS_SHEET}!A2:Z100000`)
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:clear`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      return res.status(200).json({ ok: true })
    }

    if (type === 'admin_setup') {
      if (!checkAdmin(body, res)) return
      const token = await getGoogleAccessToken()
      const range = encodeURIComponent(`${SHEET_NAME}!A1:H1`)
      const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [['Horodatage', 'Nom', 'Type', 'Note', 'Avis_texte', 'Message_eleve', 'Reponse_bot', 'IP']] }),
      })
      if (!r.ok) throw new Error('Setup en-têtes échoué: ' + (await r.text()))
      await ensureConnectionsTab(token)
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'type invalide' })
  } catch (err: any) {
    console.error('[api/review]', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
