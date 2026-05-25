/**
 * Ajoute un nouveau chapitre "📚 Vocabulaire HG" à la matière histoire-geo,
 * à partir du fichier vocab-hg-source.json (120 questions officielles 3e).
 *
 * Le chapitre est marqué isNew: true (badge doré animé dans l'UI)
 * et placé en tête de la liste des chapitres pour être bien visible.
 *
 * Le fichier source n'a pas d'explication par question : on génère un
 * fallback court basé sur le thème.
 *
 * Idempotent : si on relance, on remplace l'ancien chapitre vocab.
 *
 * Usage :
 *   node scripts/add-vocab-hg.cjs
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'vocab-hg-source.json')
const HG_PATH = path.join(__dirname, '..', 'src', 'data', 'histoire-geo.json')
const CHAPTER_ID = 'vocab-hg-3e'

const source = JSON.parse(fs.readFileSync(SRC, 'utf8'))
const hg = JSON.parse(fs.readFileSync(HG_PATH, 'utf8'))

// Convertit une question source → format de l'app
function convert(q) {
  const correctAnswer = q.propositions[q.bonneReponse]
  // Explanation : on rappelle la bonne réponse + le thème pour donner du contexte
  const themePrefix = q.matiere === 'histoire' ? '🏛️ Histoire' : '🌍 Géographie'
  return {
    question: q.question,
    choices: q.propositions,
    correctIndex: q.bonneReponse,
    explanation: `Réponse : « ${correctAnswer} ». ${themePrefix} — ${q.theme}.`,
  }
}

const newQuestions = source.questions.map(convert)

// Retirer l'ancien chapitre vocab s'il existe (idempotent)
hg.chapters = hg.chapters.filter((c) => c.id !== CHAPTER_ID)

// Construire le nouveau chapitre
const vocabChapter = {
  id: CHAPTER_ID,
  title: '📚 Vocabulaire HG (120 termes officiels)',
  isNew: true,
  questions: newQuestions,
}

// Insérer EN TÊTE pour qu'il soit le 1er chapitre visible
hg.chapters = [vocabChapter, ...hg.chapters]

fs.writeFileSync(HG_PATH, JSON.stringify(hg, null, 2), 'utf8')

const total = hg.chapters.reduce((a, c) => a + c.questions.length, 0)
console.log('✅ Chapitre Vocabulaire HG ajouté')
console.log(`   ${newQuestions.length} questions de vocabulaire`)
console.log(`   ${hg.chapters.length} chapitres au total dans Histoire-Géo`)
console.log(`   ${total} questions au total dans Histoire-Géo`)
