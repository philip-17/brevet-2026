/**
 * Merge les fichiers histoire-smart-*.json (QCM "intelligents" calés sur le
 * programme officiel d'Histoire de 3e) dans src/data/histoire-geo.json.
 *
 * Déduplication par texte exact de la question (et contre l'existant).
 *
 * Usage :
 *   node scripts/merge-histoire-smart.cjs
 */

const fs = require('fs')
const path = require('path')

const HG_PATH = path.join(__dirname, '..', 'src', 'data', 'histoire-geo.json')
const SMART_FILES = [
  'histoire-smart-1.json',
  'histoire-smart-2.json',
  'histoire-smart-3.json',
]

const hg = JSON.parse(fs.readFileSync(HG_PATH, 'utf8'))
const chaptersById = new Map(hg.chapters.map((c) => [c.id, c]))

const existingQuestions = new Set()
for (const chap of hg.chapters) {
  for (const q of chap.questions) {
    existingQuestions.add(chap.id + '||' + q.question.trim().toLowerCase())
  }
}

let added = 0
let skipped = 0
const summary = {}

for (const file of SMART_FILES) {
  const filePath = path.join(__dirname, file)
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Fichier introuvable, ignoré : ${file}`)
    continue
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  for (const chapterId in data) {
    const newQuestions = data[chapterId]
    if (!Array.isArray(newQuestions)) continue

    const target = chaptersById.get(chapterId)
    if (!target) {
      console.warn(`⚠️  Chapitre inconnu : "${chapterId}" — ignoré`)
      continue
    }

    let chapAdded = 0
    for (const q of newQuestions) {
      if (
        !q ||
        typeof q.question !== 'string' ||
        !Array.isArray(q.choices) ||
        q.choices.length !== 4 ||
        typeof q.correctIndex !== 'number' ||
        q.correctIndex < 0 ||
        q.correctIndex > 3 ||
        typeof q.explanation !== 'string'
      ) {
        console.warn(`⚠️  Question malformée dans ${chapterId} — ignorée`)
        skipped++
        continue
      }

      const key = chapterId + '||' + q.question.trim().toLowerCase()
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

fs.writeFileSync(HG_PATH, JSON.stringify(hg, null, 2), 'utf8')

console.log('✅ Merge QCM intelligents terminé')
console.log(`   ${added} questions ajoutées`)
console.log(`   ${skipped} ignorées (doublons ou invalides)`)
console.log('\n📊 Par chapitre :')
for (const chap of hg.chapters) {
  const addedHere = summary[chap.id] || 0
  const tag = addedHere > 0 ? ` (+${addedHere})` : ''
  console.log(`   ${chap.id.padEnd(36)} : ${chap.questions.length} questions${tag}`)
}
const total = hg.chapters.reduce((a, c) => a + c.questions.length, 0)
console.log(`\n🎯 Total Histoire-Géo : ${total} questions sur ${hg.chapters.length} chapitres`)
