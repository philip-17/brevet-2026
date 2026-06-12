// Classe les questions de calcul mental par difficulté (1=facile, 2=moyen, 3=difficile)
// et trie chaque chapitre du plus simple au plus dur.
// Usage :
//   node scripts/add-difficulty.mjs           → analyse seule (dry-run, affiche la répartition)
//   node scripts/add-difficulty.mjs --write   → modifie src/data/maths.json
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = join(__dirname, '..', 'src', 'data', 'maths.json')

const CHAPTERS = {
  'calcul-mental-multiplications': 'mult',
  'calcul-mental-divisions': 'div',
  'calcul-mental-additions': 'add',
  'calcul-mental-soustractions': 'sub',
}

// Extrait les deux opérandes de « Combien font A op B ? »
function parseOperands(question) {
  const m = question.match(/(\d+)\s*[×÷+\-−]\s*(\d+)/)
  if (!m) return null
  return [Number(m[1]), Number(m[2])]
}

// ----- Niveau (1/2/3) : règles pédagogiques par opération -----
function level(op, a, b) {
  switch (op) {
    case 'mult':
      // Facile : les tables (jusqu'à 10 × 10)
      if (a <= 10 && b <= 10) return 1
      // Moyen : un petit facteur (≤ 12) avec un nombre ≤ 2 chiffres,
      // ou multiples de 10 simples (30 × 4, 60 × 20…)
      if ((Math.min(a, b) <= 12 && Math.max(a, b) <= 99) ||
          ((a % 10 === 0 || b % 10 === 0) && Math.max(a, b) <= 99)) return 2
      // Difficile : 2 chiffres × 2 chiffres quelconques, 3 chiffres × 2 chiffres
      return 3
    case 'div':
      // Diviser par 10 ou 100 : facile (on enlève des zéros)
      if (b === 10 || b === 100) return a <= 1000 ? 1 : 2
      // Facile : tables à l'envers (dividende ≤ 100, diviseur ≤ 10)
      if (a <= 100 && b <= 10) return 1
      // Moyen : diviseur ≤ 12, diviseur rond (20, 30…), ou dividende ≤ 200
      if (b <= 12 || a <= 200 || (b % 10 === 0 && a <= 1000)) return 2
      return 3
    case 'add':
      // Facile : petits nombres (résultat ≤ 30)
      if (a + b <= 30) return 1
      // Moyen : nombres ≤ 3 chiffres
      if (a <= 999 && b <= 999) return 2
      // Difficile : milliers
      return 3
    case 'sub':
      // Facile : petits nombres (≤ 30)
      if (a <= 30) return 1
      // Moyen : nombres ≤ 3 chiffres
      if (a <= 999 && b <= 999) return 2
      return 3
  }
}

// ----- Score continu pour trier du plus simple au plus dur dans chaque niveau -----
function score(op, a, b) {
  const round = (n) => (n % 10 === 0 ? 0.6 : 1) // les nombres ronds sont plus faciles
  switch (op) {
    case 'mult':
      return a * b * round(a) * round(b)
    case 'div': {
      if (b === 10 || b === 100) return a * 0.05 // on enlève des zéros
      const ease = b % 10 === 0 ? 0.3 : 1
      return a * ease * (b > 12 ? 1.5 : 1)
    }
    case 'add':
      return (a + b) * round(a) * round(b)
    case 'sub': {
      // retenue (emprunt) = plus dur
      const borrow = String(b).split('').some((d, i, arr) => {
        const da = String(a).padStart(arr.length, '0')
        return Number(da[da.length - arr.length + i]) < Number(d)
      })
      return (a + b) * (borrow ? 1.3 : 1)
    }
  }
}

const write = process.argv.includes('--write')
const data = JSON.parse(readFileSync(FILE, 'utf8'))

for (const chapter of data.chapters) {
  const op = CHAPTERS[chapter.id]
  if (!op) continue

  let unparsed = 0
  for (const q of chapter.questions) {
    const ops = parseOperands(q.question)
    if (!ops) {
      unparsed++
      q.difficulty = 2
      q._score = 0
      continue
    }
    const [a, b] = ops
    q.difficulty = level(op, a, b)
    q._score = score(op, a, b)
  }

  // Tri : niveau croissant, puis score croissant
  chapter.questions.sort((x, y) => x.difficulty - y.difficulty || x._score - y._score)

  const counts = [1, 2, 3].map(
    (l) => chapter.questions.filter((q) => q.difficulty === l).length
  )
  console.log(
    `${chapter.id}: 🟢 ${counts[0]}  🟠 ${counts[1]}  🔴 ${counts[2]}` +
      (unparsed ? `  (⚠ ${unparsed} non analysées)` : '')
  )
  console.log(`  premiers : ${chapter.questions.slice(0, 3).map((q) => q.question).join(' | ')}`)
  const mid = chapter.questions.findIndex((q) => q.difficulty === 2)
  const hard = chapter.questions.findIndex((q) => q.difficulty === 3)
  if (mid >= 0) console.log(`  1er moyen : ${chapter.questions[mid].question}`)
  if (hard >= 0) console.log(`  1er difficile : ${chapter.questions[hard].question}`)
  console.log(`  derniers : ${chapter.questions.slice(-3).map((q) => q.question).join(' | ')}`)

  for (const q of chapter.questions) delete q._score
}

if (write) {
  writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log('\n✅ maths.json mis à jour')
} else {
  console.log('\n(dry-run — relance avec --write pour enregistrer)')
}
