import { SUBJECTS } from '../data'

/**
 * Relie une question libre (« explique-moi le théorème de Thalès ») au chapitre
 * le plus pertinent de l'appli — 100 % côté client, zéro token IA.
 * Sert à proposer un raccourci « Réviser ce chapitre » dans l'assistant Coach Phifou.
 */

export interface ChapterMatch {
  subjectId: string
  subjectLabel: string
  subjectEmoji: string
  chapterId: string
  chapterTitle: string
}

// Mots vides / verbes de requête sans valeur discriminante. « theoreme » est
// volontairement ignoré (présent dans 2 titres) pour que le match se fasse sur
// le NOM (thales / pythagore), pas sur le mot « théorème ».
const STOP = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'au', 'aux', 'en', 'dans', 'sur', 'pour', 'par',
  'avec', 'sans', 'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'que', 'qui', 'quoi', 'quel', 'quelle', 'quels', 'quelles', 'est', 'sont', 'ete', 'etre',
  'tu', 'il', 'elle', 'on', 'nous', 'vous', 'me', 'te', 'se', 'moi', 'toi',
  'explique', 'expliquer', 'expliques', 'dis', 'donne', 'parle', 'parler', 'aide', 'aider', 'apprendre',
  'apprends', 'comprendre', 'comprends', 'veux', 'peux', 'pourrais', 'montre', 'revise', 'reviser',
  'comment', 'pourquoi', 'quand', 'est-ce', 'plus', 'bien', 'mieux', 'fait', 'faire', 'sais', 'savoir',
  'theoreme', 'cours', 'chapitre', 'exercice', 'question', 'questions', 'svp', 'stp', 'merci',
])

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const tokenize = (s: string): string[] =>
  norm(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t))

interface Entry {
  m: ChapterMatch
  tokens: Set<string>
}

// Index construit une seule fois.
const ENTRIES: Entry[] = []
const DF = new Map<string, number>() // document frequency : nb de chapitres contenant le token

for (const subj of SUBJECTS) {
  for (const ch of subj.chapters) {
    const tokens = new Set(tokenize(ch.title))
    ENTRIES.push({
      m: {
        subjectId: subj.id,
        subjectLabel: subj.label,
        subjectEmoji: subj.emoji,
        chapterId: ch.id,
        chapterTitle: ch.title,
      },
      tokens,
    })
    for (const t of tokens) DF.set(t, (DF.get(t) || 0) + 1)
  }
}

/**
 * Renvoie le chapitre le plus pertinent pour la requête, ou null si rien d'assez
 * spécifique (ex. « bonjour », « aide-moi » → null, pas de redirection hasardeuse).
 * Les tokens rares (df faible) pèsent plus : le nom propre l'emporte.
 */
export function findChapterForQuery(query: string): ChapterMatch | null {
  const qTokens = new Set(tokenize(query))
  if (!qTokens.size) return null

  let best: Entry | null = null
  let bestScore = 0
  let bestMinDf = Infinity

  for (const e of ENTRIES) {
    let score = 0
    let minDf = Infinity
    for (const t of qTokens) {
      if (e.tokens.has(t)) {
        const df = DF.get(t) || 1
        score += 1 / df
        if (df < minDf) minDf = df
      }
    }
    if (score > bestScore) {
      bestScore = score
      best = e
      bestMinDf = minDf
    }
  }

  // Accepte seulement si un token partagé est assez spécifique (df ≤ 8) et le
  // score atteint un minimum — évite les redirections sur un mot trop courant.
  if (best && bestMinDf <= 8 && bestScore >= 0.4) return best.m
  return null
}
