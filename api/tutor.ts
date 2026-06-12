// Fonction serverless Vercel : l'assistant IA « Coach BB » (tuteur brevet).
// Répond aux questions des élèves (cours, méthode, aide sur un quiz, motivation,
// navigation dans l'appli). Clé DeepSeek côté serveur uniquement.
//
//   type "tutor" → { messages, context?, name? } → { reply }
//
// Deux chemins, choisis automatiquement :
//   1. Si N8N_TUTOR_WEBHOOK est défini  → relaie la conversation vers ton n8n
//      (DeepSeek géré dans le workflow). L'URL DOIT être publique : un n8n en
//      localhost n'est PAS joignable depuis Vercel.
//   2. Sinon                            → appelle DeepSeek directement (chemin
//      éprouvé, identique au chat d'avis). Marche sans n8n.
//
// Env (Vercel) : DEEPSEEK_API_KEY (requis pour le mode direct),
//   N8N_TUTOR_WEBHOOK (optionnel, pour router via n8n).

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const N8N_TUTOR_WEBHOOK = process.env.N8N_TUTOR_WEBHOOK || ''

type ChatMessage = { role: string; content: string }

const SYSTEM = `Tu es « Coach BB », l'assistant IA de BrevetBoost, une appli de révision du brevet des collèges (3e, France). Tu aides un·e élève de ~14-15 ans. Tutoie-le, reste chaleureux, clair et encourageant.

CE QUE TU FAIS :
- Expliquer une notion ou répondre à une question de cours : maths, français, histoire-géo, sciences (physique-chimie, SVT, techno) et culture générale.
- Aider à comprendre une question de quiz sur laquelle l'élève bloque : explique d'abord le raisonnement, donne la bonne réponse APRÈS le « pourquoi ».
- Donner des méthodes (rédiger une réponse, gérer son temps, apprendre une leçon) et de la motivation.
- Aider à se repérer dans l'appli : quiz, cours, flashcards, mode « Mes erreurs », examen blanc.

COMMENT :
- Réponses COURTES et lisibles sur téléphone : va à l'essentiel, aère, utilise des étapes numérotées ou des listes quand c'est utile.
- Niveau brevet, pas de hors-programme inutile. Donne des exemples concrets.
- Sois RIGOUREUX : si tu n'es pas sûr d'un fait, dis-le plutôt que d'inventer.
- Mets en valeur les formules et dates clés.
- Termine souvent par une mini-relance pour garder l'élève actif.`

async function deepseek(messages: ChatMessage[], maxTokens = 800, temperature = 0.4): Promise<string> {
  const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', max_tokens: maxTokens, temperature, messages }),
  })
  const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || ''
}

// Relaie vers n8n et tente d'extraire la réponse, quelle que soit la forme de
// sortie du workflow (Respond to Webhook renvoie souvent un objet, parfois un
// tableau, ou directement la sortie brute de DeepSeek).
async function viaN8n(payload: unknown): Promise<string> {
  const resp = await fetch(N8N_TUTOR_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) throw new Error('n8n HTTP ' + resp.status)
  const ct = resp.headers.get('content-type') || ''
  if (!ct.includes('application/json')) return (await resp.text()).trim()
  const data: any = await resp.json()
  const pick = (o: any): string =>
    o?.reply ||
    o?.output ||
    o?.text ||
    o?.message?.content ||
    o?.choices?.[0]?.message?.content ||
    ''
  if (Array.isArray(data)) return pick(data[0]) || ''
  return pick(data) || ''
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
    const context = typeof body.context === 'string' ? body.context.slice(0, 400) : ''
    const name = typeof body.name === 'string' ? body.name.slice(0, 60) : ''

    // Chemin n8n si une URL publique est configurée.
    if (N8N_TUTOR_WEBHOOK) {
      const reply = await viaN8n({ type: 'tutor', name, context, messages })
      return res.status(200).json({ reply: reply || 'Désolé, je n’ai pas pu répondre. Réessaie 🙏' })
    }

    // Chemin direct DeepSeek.
    const sys: ChatMessage = {
      role: 'system',
      content: context ? `${SYSTEM}\n\nCONTEXTE ACTUEL DE L'ÉLÈVE : ${context}` : SYSTEM,
    }
    const reply = await deepseek([sys, ...messages])
    return res.status(200).json({ reply: reply || 'Désolé, je n’ai pas pu répondre. Réessaie 🙏' })
  } catch (err: any) {
    console.error('[api/tutor]', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
