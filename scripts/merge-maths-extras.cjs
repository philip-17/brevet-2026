/**
 * Merge les fichiers maths-extra-*.json dans src/data/maths.json
 *
 * Pour chaque chapitre, ajoute les nouvelles questions à la fin
 * du chapitre correspondant. Évite les doublons (basé sur le texte
 * exact de la question).
 *
 * Usage :
 *   node scripts/merge-maths-extras.cjs
 */

const fs = require('fs')
const path = require('path')

const MATHS_PATH = path.join(__dirname, '..', 'src', 'data', 'maths.json')
const EXTRA_FILES = [
  'maths-extra-geometrie.json',
  'maths-extra-algebre.json',
  'maths-extra-analyse.json',
]

// Charge le fichier maths.json existant
const maths = JSON.parse(fs.readFileSync(MATHS_PATH, 'utf8'))

// Index : id de chapitre -> chapitre
const chaptersById = new Map(maths.chapters.map((c) => [c.id, c]))

// Pour la déduplication : set des questions existantes (par texte exact)
const existingQuestions = new Set()
for (const chap of maths.chapters) {
  for (const q of chap.questions) {
    existingQuestions.add(chap.id + '||' + q.question.trim())
  }
}

let added = 0
let skipped = 0
const summary = {}

for (const file of EXTRA_FILES) {
  const filePath = path.join(__dirname, file)
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Fichier introuvable, ignoré : ${file}`)
    continue
  }

  const extra = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  for (const chapterId in extra) {
    const newQuestions = extra[chapterId]
    if (!Array.isArray(newQuestions)) continue

    const target = chaptersById.get(chapterId)
    if (!target) {
      console.warn(`⚠️  Chapitre inconnu : "${chapterId}" — ignoré`)
      continue
    }

    let chapAdded = 0
    for (const q of newQuestions) {
      // Validation minimale
      if (
        !q ||
        typeof q.question !== 'string' ||
        !Array.isArray(q.choices) ||
        q.choices.length !== 4 ||
        typeof q.correctIndex !== 'number' ||
        typeof q.explanation !== 'string'
      ) {
        console.warn(`⚠️  Question malformée dans ${chapterId} — ignorée`)
        skipped++
        continue
      }

      const key = chapterId + '||' + q.question.trim()
      if (existingQuestions.has(key)) {
        skipped++
        continue
      }

      target.questions.push({
        question: q.question.trim(),
        choices: q.choices.map((c) => String(c).trim()),
        correctIndex: q.correctIndex,
        explanation: q.explanation.trim(),
      })
      existingQuestions.add(key)
      chapAdded++
      added++
    }
    summary[chapterId] = (summary[chapterId] || 0) + chapAdded
  }
}

// Sauvegarder
fs.writeFileSync(MATHS_PATH, JSON.stringify(maths, null, 2), 'utf8')

// Récap
console.log('✅ Merge terminé')
console.log(`   ${added} questions ajoutées`)
console.log(`   ${skipped} ignorées (doublons ou invalides)`)
console.log('\n📊 Par chapitre :')
for (const chap of maths.chapters) {
  const addedHere = summary[chap.id] || 0
  console.log(
    `   ${chap.id.padEnd(22)} : ${chap.questions.length} questions (+${addedHere})`
  )
}
const total = maths.chapters.reduce((a, c) => a + c.questions.length, 0)
console.log(`\n🎯 Total Maths : ${total} questions sur ${maths.chapters.length} chapitres`)
