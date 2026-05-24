/**
 * Importe les 900 questions de Culture Générale (18 thèmes × 50 questions)
 * depuis `C:\Users\cocis\culture-generale-quiz\` et remplace `src/data/culture-g.json`.
 *
 * Format source :
 *   { theme, id, icon, description, questions: [{ id, difficulty, question, choices, answer, explanation }] }
 * Format cible :
 *   { id, label, emoji, color, chapters: [{ id, title, emoji, questions: [{ question, choices, correctIndex, explanation }] }] }
 *
 * Usage :
 *   node scripts/import-culture-g-900.cjs
 */

const fs = require('fs')
const path = require('path')

const SOURCE_DIR = 'C:\\Users\\cocis\\culture-generale-quiz'
const TARGET_PATH = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'culture-g.json'
)

// Lecture de l'index pour avoir la liste ordonnée des thèmes
const index = JSON.parse(
  fs.readFileSync(path.join(SOURCE_DIR, 'index.json'), 'utf8')
)

const chapters = []
let totalQuestions = 0

for (const themeMeta of index.themes) {
  const filePath = path.join(SOURCE_DIR, themeMeta.file.replace(/\//g, path.sep))
  const themeData = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const convertedQuestions = themeData.questions.map((q) => ({
    question: q.question,
    choices: q.choices,
    correctIndex: q.answer,
    explanation: q.explanation,
  }))

  chapters.push({
    id: themeMeta.id,
    title: themeMeta.title,
    emoji: themeMeta.icon,
    questions: convertedQuestions,
  })

  totalQuestions += convertedQuestions.length
}

const cultureG = {
  id: 'culture-g',
  label: 'Culture Générale',
  emoji: '🌍',
  color: '#8b5cf6',
  chapters,
}

fs.writeFileSync(TARGET_PATH, JSON.stringify(cultureG, null, 2), 'utf8')

console.log('✅ Import réussi !')
console.log(`   - ${chapters.length} chapitres`)
console.log(`   - ${totalQuestions} questions au total`)
console.log('\nThèmes :')
chapters.forEach((c) =>
  console.log(`   ${c.emoji}  ${c.title} (${c.questions.length} questions)`)
)
console.log(`\nFichier écrit : ${TARGET_PATH}`)
