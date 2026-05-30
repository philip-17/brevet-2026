/**
 * Merge les fichiers histoire-extra-*.json dans src/data/histoire-geo.json
 *
 * Pour chaque chapitre, ajoute les nouvelles questions à la fin du
 * chapitre correspondant. Évite les doublons (texte exact de la question).
 *
 * Usage :
 *   node scripts/merge-histoire-extras.cjs
 */

const fs = require('fs')
const path = require('path')

const HG_PATH = path.join(__dirname, '..', 'src', 'data', 'histoire-geo.json')
const EXTRA_FILES = [
  'histoire-extra-histoire.json',
  'histoire-extra-geo.json',
  'histoire-extra-emc.json',
]

const hg = JSON.parse(fs.readFileSync(HG_PATH, 'utf8'))
const chaptersById = new Map(hg.chapters.map((c) => [c.id, c]))

const existingQuestions = new Set()
for (const chap of hg.chapters) {
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

fs.writeFileSync(HG_PATH, JSON.stringify(hg, null, 2), 'utf8')

console.log('✅ Merge terminé')
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
