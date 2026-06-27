// Calme la page Sciences : retire les rubans « NEW » et les bordures orange
// (et le 🆕 des titres Pack PC). Ne touche qu'à la matière Sciences.
//
// Usage : node scripts/calm-sciences-accents.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = join(__dirname, '..', 'src', 'data', 'sciences.json')

const data = JSON.parse(readFileSync(FILE, 'utf8'))

let removedAccent = 0
let removedIsNew = 0
let strippedEmoji = 0

for (const chap of data.chapters) {
  // 7 fiches PC : accent "new" → bordure orange + ruban NEW
  if (chap.accent === 'new') {
    delete chap.accent
    removedAccent++
  }
  // 4 Pack PC : isNew true → ruban NEW (déclenché via le fallback isNew)
  if (chap.isNew) {
    delete chap.isNew
    removedIsNew++
  }
  // 🆕 en début de titre (Pack PC)
  if (typeof chap.title === 'string' && chap.title.startsWith('🆕 ')) {
    chap.title = chap.title.replace(/^🆕\s+/, '')
    strippedEmoji++
  }
}

writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(
  `✅ Sciences calmée — accent retiré: ${removedAccent}, isNew retiré: ${removedIsNew}, 🆕 retiré du titre: ${strippedEmoji}`,
)
