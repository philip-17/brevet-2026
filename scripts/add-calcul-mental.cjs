/**
 * Ajoute 4 nouveaux chapitres de calcul mental à la matière Maths :
 *   - ✖️ Multiplications (calcul mental) — 500 questions
 *   - ➗ Divisions (calcul mental) — 200 questions
 *   - ➕ Additions (calcul mental) — 200 questions
 *   - ➖ Soustractions (calcul mental) — 200 questions
 *
 * Chaque chapitre est marqué accent: 'flash' (bannière "⚡ FLASH" feu)
 * et placé EN TÊTE de la liste des chapitres maths.
 *
 * Idempotent : si on relance, les anciens chapitres calcul-mental
 * sont remplacés.
 *
 * Usage :
 *   node scripts/add-calcul-mental.cjs
 */

const fs = require('fs')
const path = require('path')

const MATHS_PATH = path.join(__dirname, '..', 'src', 'data', 'maths.json')

// Définition des 4 chapitres à créer
const CALC_MENTAL = [
  {
    id: 'calcul-mental-multiplications',
    title: '✖️ Multiplications — Calcul mental',
    sourceFile: 'source-calcul_mental_multiplications.json',
  },
  {
    id: 'calcul-mental-divisions',
    title: '➗ Divisions — Calcul mental',
    sourceFile: 'source-calcul_mental_divisions.json',
  },
  {
    id: 'calcul-mental-additions',
    title: '➕ Additions — Calcul mental',
    sourceFile: 'source-calcul_mental_additions.json',
  },
  {
    id: 'calcul-mental-soustractions',
    title: '➖ Soustractions — Calcul mental',
    sourceFile: 'source-calcul_mental_soustractions.json',
  },
]

// Convertit une question source au format de l'app
// Pour le calcul mental, l'explanation est minimale (juste la bonne réponse)
function convert(q) {
  const correctAnswer = q.propositions[q.bonneReponse]
  return {
    question: q.question,
    choices: q.propositions,
    correctIndex: q.bonneReponse,
    explanation: `Réponse : ${correctAnswer}`,
  }
}

const maths = JSON.parse(fs.readFileSync(MATHS_PATH, 'utf8'))

// Retirer les anciens chapitres calcul-mental (idempotence)
maths.chapters = maths.chapters.filter(
  (c) => !c.id.startsWith('calcul-mental-')
)

// Construire les nouveaux chapitres
const newChapters = CALC_MENTAL.map((meta) => {
  const srcPath = path.join(__dirname, meta.sourceFile)
  if (!fs.existsSync(srcPath)) {
    console.error(`❌ Fichier source manquant : ${meta.sourceFile}`)
    process.exit(1)
  }
  const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  const questions = (src.questions || []).map(convert)
  return {
    id: meta.id,
    title: meta.title,
    accent: 'flash',
    questions,
  }
})

// Insérer EN TÊTE
maths.chapters = [...newChapters, ...maths.chapters]

fs.writeFileSync(MATHS_PATH, JSON.stringify(maths, null, 2), 'utf8')

console.log('⚡ 4 chapitres de calcul mental ajoutés :')
newChapters.forEach((c) =>
  console.log(`   ${c.title.padEnd(45)} ${String(c.questions.length).padStart(4)} questions`)
)
const total = maths.chapters.reduce((a, c) => a + c.questions.length, 0)
console.log()
console.log(`🎯 Total Maths : ${total} questions sur ${maths.chapters.length} chapitres`)
