/**
 * Ajoute les 5 chapitres d'AUTOMATISMES dans la matière MATHS (section
 * 'automatismes'), à partir du fichier officiel automatismes-source.json
 * (DNB 2026, liste officielle Éducation nationale oct. 2025).
 *
 * Position : juste APRÈS les chapitres de calcul mental, AVANT les
 * chapitres de cours classiques.
 *
 * Idempotent : si on relance, les anciens chapitres `auto-` sont remplacés.
 *
 * Usage :
 *   node scripts/build-automatismes.cjs
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'automatismes-source.json')
const MATHS_PATH = path.join(__dirname, '..', 'src', 'data', 'maths.json')

const source = JSON.parse(fs.readFileSync(SRC, 'utf8'))

const DOMAIN_MAP = {
  'Nombres et calculs': {
    id: 'auto-nombres-calculs',
    title: '🔢 Nombres et calculs',
  },
  'Espace et géométrie': {
    id: 'auto-geometrie',
    title: '📐 Espace et géométrie',
  },
  'Proportionnalité, fonctions': {
    id: 'auto-proportionnalite',
    title: '📊 Proportionnalité & fonctions',
  },
  'Organisation et gestion de données et probabilités': {
    id: 'auto-donnees-probas',
    title: '🎲 Données & probabilités',
  },
  'Algorithmique et programmation': {
    id: 'auto-algo',
    title: '💻 Algorithmique & programmation',
  },
}

function convert(q) {
  return {
    question: q.enonce,
    choices: q.choix,
    correctIndex: q.bonneReponse,
    explanation: q.explication,
  }
}

const byDomain = {}
for (const q of source.questions) {
  if (!byDomain[q.domaine]) byDomain[q.domaine] = []
  byDomain[q.domaine].push(convert(q))
}

const newChapters = []
for (const domain of Object.keys(DOMAIN_MAP)) {
  const meta = DOMAIN_MAP[domain]
  const questions = byDomain[domain] || []
  newChapters.push({
    id: meta.id,
    title: meta.title,
    section: 'automatismes',
    questions,
  })
}

const maths = JSON.parse(fs.readFileSync(MATHS_PATH, 'utf8'))

// Idempotence : retirer les anciens chapitres auto-*
maths.chapters = maths.chapters.filter((c) => !c.id.startsWith('auto-'))

// Insérer APRÈS les chapitres de calcul mental
let insertAt = 0
for (let i = 0; i < maths.chapters.length; i++) {
  if (maths.chapters[i].id && maths.chapters[i].id.startsWith('calcul-mental-')) {
    insertAt = i + 1
  }
}
maths.chapters = [
  ...maths.chapters.slice(0, insertAt),
  ...newChapters,
  ...maths.chapters.slice(insertAt),
]

fs.writeFileSync(MATHS_PATH, JSON.stringify(maths, null, 2), 'utf8')

console.log('🎯 Section Automatismes intégrée dans Maths :')
newChapters.forEach((c) =>
  console.log(`   ${c.title.padEnd(40)} ${String(c.questions.length).padStart(4)} questions`)
)
const totalAuto = newChapters.reduce((a, c) => a + c.questions.length, 0)
const totalMaths = maths.chapters.reduce((a, c) => a + c.questions.length, 0)
console.log()
console.log(`   ${totalAuto} questions d'automatismes ajoutées`)
console.log(`🎯 Total Maths : ${totalMaths} questions sur ${maths.chapters.length} chapitres`)
