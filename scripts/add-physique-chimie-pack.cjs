/**
 * Script ponctuel : ajoute le "Pack Physique-Chimie 100Q" au fichier sciences.json
 * en découpant les 100 questions en 4 chapitres (Matière, Mouvement, Énergie, Signaux)
 * et en les marquant comme NEW.
 *
 * Usage :
 *   node scripts/add-physique-chimie-pack.cjs
 */

const fs = require('fs')
const path = require('path')

const SCIENCES_PATH = path.join(__dirname, '..', 'src', 'data', 'sciences.json')

// Source : 100 questions de Physique-Chimie fournies par l'utilisateur
const SOURCE_QUESTIONS = require('./physique-chimie-100.json').questions

// Groupes par thème principal
const GROUPS = {
  Matiere: {
    chapterId: 'pack-pc-matiere',
    chapterTitle: '🆕 Pack PC — Matière (atomes, ions, pH, réactions)',
  },
  Mouvement: {
    chapterId: 'pack-pc-mouvement',
    chapterTitle: '🆕 Pack PC — Mouvement & interactions',
  },
  Energie: {
    chapterId: 'pack-pc-energie',
    chapterTitle: '🆕 Pack PC — Énergie & conversions',
  },
  Signaux: {
    chapterId: 'pack-pc-signaux',
    chapterTitle: '🆕 Pack PC — Signaux (lumière, son)',
  },
}

// Convertit une question source au format de l'app
function convert(q) {
  return {
    question: q.question,
    choices: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explication,
  }
}

// Regrouper par thème
const byTheme = {}
for (const q of SOURCE_QUESTIONS) {
  if (!byTheme[q.theme]) byTheme[q.theme] = []
  byTheme[q.theme].push(convert(q))
}

// Construire les nouveaux chapitres
const newChapters = Object.entries(GROUPS).map(([themeKey, meta]) => ({
  id: meta.chapterId,
  title: meta.chapterTitle,
  isNew: true,
  questions: byTheme[themeKey] || [],
}))

// Lire le fichier sciences existant
const sciences = JSON.parse(fs.readFileSync(SCIENCES_PATH, 'utf8'))

// Retirer les anciens chapitres "pack-pc-*" si on relance le script (idempotent)
sciences.chapters = sciences.chapters.filter(
  (c) => !c.id.startsWith('pack-pc-')
)

// Ajouter les nouveaux chapitres EN PREMIER pour qu'ils soient visibles
sciences.chapters = [...newChapters, ...sciences.chapters]

// Écrire
fs.writeFileSync(SCIENCES_PATH, JSON.stringify(sciences, null, 2), 'utf8')

console.log('✅ Ajout réussi :')
newChapters.forEach((c) =>
  console.log(`   - ${c.title} : ${c.questions.length} questions`)
)
console.log(
  `\nTotal sciences.json : ${sciences.chapters.length} chapitres, ${sciences.chapters.reduce((a, c) => a + c.questions.length, 0)} questions`
)
