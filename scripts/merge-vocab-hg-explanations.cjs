/**
 * Remplace les explications "fallback" du chapitre vocab-hg-3e par les vraies
 * explications pédagogiques générées par les sous-agents.
 *
 * Lit :
 *   - scripts/vocab-hg-source.json (pour matcher id ↔ texte de question)
 *   - scripts/vocab-hg-explanations-histoire.json  ({id → explanation})
 *   - scripts/vocab-hg-explanations-geo.json       ({id → explanation})
 *
 * Modifie :
 *   - src/data/histoire-geo.json (chapitre id="vocab-hg-3e")
 *
 * Usage :
 *   node scripts/merge-vocab-hg-explanations.cjs
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'vocab-hg-source.json')
const EXP_HISTO = path.join(__dirname, 'vocab-hg-explanations-histoire.json')
const EXP_GEO = path.join(__dirname, 'vocab-hg-explanations-geo.json')
const HG_PATH = path.join(__dirname, '..', 'src', 'data', 'histoire-geo.json')

const source = JSON.parse(fs.readFileSync(SRC, 'utf8'))
const hg = JSON.parse(fs.readFileSync(HG_PATH, 'utf8'))

// Charger les explications (en gérant le cas où un fichier manque)
const explanations = {}
for (const file of [EXP_HISTO, EXP_GEO]) {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  Fichier manquant : ${path.basename(file)} — ignoré`)
    continue
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const id in data) {
    explanations[id] = data[id]
  }
}
console.log(`📚 ${Object.keys(explanations).length} explications chargées`)

// Index : texte exact de la question → id source (pour matcher)
const textToId = new Map()
for (const q of source.questions) {
  textToId.set(q.question.trim(), String(q.id))
}

// Trouver le chapitre vocab-hg dans histoire-geo
const vocabChap = hg.chapters.find((c) => c.id === 'vocab-hg-3e')
if (!vocabChap) {
  console.error('❌ Chapitre vocab-hg-3e introuvable dans histoire-geo.json')
  process.exit(1)
}

let updated = 0
let missing = 0
for (const q of vocabChap.questions) {
  const id = textToId.get(q.question.trim())
  if (!id) {
    console.warn(`⚠️  Question non matchée : "${q.question.slice(0, 60)}..."`)
    missing++
    continue
  }
  const newExp = explanations[id]
  if (newExp) {
    q.explanation = newExp.trim()
    updated++
  } else {
    missing++
  }
}

fs.writeFileSync(HG_PATH, JSON.stringify(hg, null, 2), 'utf8')

console.log(`\n✅ ${updated} explications mises à jour`)
if (missing > 0) {
  console.log(`⚠️  ${missing} questions sans nouvelle explication (fallback gardé)`)
}
console.log(`📖 Total dans vocab-hg-3e : ${vocabChap.questions.length} questions`)
