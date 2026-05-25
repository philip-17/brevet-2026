/**
 * Ajoute 2 nouveaux chapitres à la matière Français :
 *   - 🏷️ Classes grammaticales (nature des mots) — 50 questions
 *   - 🎯 Fonctions grammaticales (rôle dans la phrase) — 50 questions
 *
 * Les 2 chapitres sont marqués isNew: true (ruban doré animé)
 * et placés EN TÊTE de la liste des chapitres pour être bien visibles.
 *
 * Idempotent : si on relance, les anciens chapitres sont remplacés.
 *
 * Usage :
 *   node scripts/add-grammaire-chapters.cjs
 */

const fs = require('fs')
const path = require('path')

const SRC_CLASSES = path.join(
  __dirname,
  'francais-classes-grammaticales.json'
)
const SRC_FONCTIONS = path.join(
  __dirname,
  'francais-fonctions-grammaticales.json'
)
const FR_PATH = path.join(__dirname, '..', 'src', 'data', 'francais.json')

const CHAP_CLASSES_ID = 'classes-grammaticales'
const CHAP_FONCTIONS_ID = 'fonctions-grammaticales'

function loadQuestions(file, label) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Fichier manquant : ${path.basename(file)}`)
    process.exit(1)
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(data)) {
    console.error(`❌ ${path.basename(file)} doit être un tableau`)
    process.exit(1)
  }
  // Validation
  for (const q of data) {
    if (
      !q ||
      typeof q.question !== 'string' ||
      !Array.isArray(q.choices) ||
      q.choices.length !== 4 ||
      typeof q.correctIndex !== 'number' ||
      typeof q.explanation !== 'string'
    ) {
      console.error(`❌ Question malformée dans ${label} :`, q)
      process.exit(1)
    }
  }
  return data
}

const classesQ = loadQuestions(SRC_CLASSES, 'classes-grammaticales')
const fonctionsQ = loadQuestions(SRC_FONCTIONS, 'fonctions-grammaticales')

const francais = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'))

// Idempotence : retirer si déjà présents
francais.chapters = francais.chapters.filter(
  (c) => c.id !== CHAP_CLASSES_ID && c.id !== CHAP_FONCTIONS_ID
)

const classesChapter = {
  id: CHAP_CLASSES_ID,
  title: '🏷️ Classes grammaticales (nature des mots)',
  isNew: true,
  questions: classesQ,
}

const fonctionsChapter = {
  id: CHAP_FONCTIONS_ID,
  title: '🎯 Fonctions grammaticales (rôle dans la phrase)',
  isNew: true,
  questions: fonctionsQ,
}

// Insérer EN TÊTE pour qu'ils soient visibles immédiatement
francais.chapters = [classesChapter, fonctionsChapter, ...francais.chapters]

fs.writeFileSync(FR_PATH, JSON.stringify(francais, null, 2), 'utf8')

const total = francais.chapters.reduce((a, c) => a + c.questions.length, 0)
console.log('✅ 2 nouveaux chapitres ajoutés à Français :')
console.log(
  `   ${classesChapter.title.padEnd(50)} ${classesQ.length} questions`
)
console.log(
  `   ${fonctionsChapter.title.padEnd(50)} ${fonctionsQ.length} questions`
)
console.log()
console.log(
  `🎯 Total Français : ${total} questions sur ${francais.chapters.length} chapitres`
)
