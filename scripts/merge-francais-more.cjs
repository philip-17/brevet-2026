/**
 * Merge les fichiers francais-more-*.json dans src/data/francais.json.
 * Déduplication par texte exact (insensible à la casse) contre l'existant.
 *
 * Usage : node scripts/merge-francais-more.cjs
 */

const fs = require('fs')
const path = require('path')

const FR_PATH = path.join(__dirname, '..', 'src', 'data', 'francais.json')
const FILES = [
  'francais-more-litteraire.json',
  'francais-more-mecanique.json',
  'francais-more-analyse.json',
]

const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'))
const chaptersById = new Map(fr.chapters.map((c) => [c.id, c]))

const seen = new Set()
for (const chap of fr.chapters) {
  for (const q of chap.questions) {
    seen.add(chap.id + '||' + q.question.trim().toLowerCase())
  }
}

let added = 0
let skipped = 0
const summary = {}

for (const file of FILES) {
  const fp = path.join(__dirname, file)
  if (!fs.existsSync(fp)) {
    console.warn(`⚠️  Fichier introuvable, ignoré : ${file}`)
    continue
  }
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'))
  for (const chapterId in data) {
    const list = data[chapterId]
    if (!Array.isArray(list)) continue
    const target = chaptersById.get(chapterId)
    if (!target) {
      console.warn(`⚠️  Chapitre inconnu : "${chapterId}" — ignoré`)
      continue
    }
    let chapAdded = 0
    for (const q of list) {
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
        skipped++
        continue
      }
      const key = chapterId + '||' + q.question.trim().toLowerCase()
      if (seen.has(key)) {
        skipped++
        continue
      }
      target.questions.push({
        question: q.question.trim(),
        choices: q.choices.map((c) => String(c).trim()),
        correctIndex: q.correctIndex,
        explanation: q.explanation.trim(),
      })
      seen.add(key)
      chapAdded++
      added++
    }
    summary[chapterId] = (summary[chapterId] || 0) + chapAdded
  }
}

fs.writeFileSync(FR_PATH, JSON.stringify(fr, null, 2), 'utf8')

console.log('✅ Merge français terminé')
console.log(`   ${added} ajoutées · ${skipped} ignorées`)
console.log('\n📊 Par chapitre :')
for (const chap of fr.chapters) {
  const a = summary[chap.id] || 0
  console.log(`   ${chap.id.padEnd(26)} : ${chap.questions.length} questions${a > 0 ? ` (+${a})` : ''}`)
}
const total = fr.chapters.reduce((a, c) => a + c.questions.length, 0)
console.log(`\n🎯 Total Français : ${total} questions sur ${fr.chapters.length} chapitres`)
