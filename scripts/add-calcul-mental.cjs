/**
 * Ajoute 4 nouveaux chapitres de calcul mental à la matière Maths,
 * avec des EXPLICATIONS PÉDAGOGIQUES générées algorithmiquement.
 *
 * Pour chaque question "Combien font X op Y ?", on extrait X, op, Y,
 * on calcule la réponse, et on génère une explication structurée avec
 * une astuce mentale quand le cas s'y prête.
 *
 * Cas spéciaux gérés :
 *   - x0, x1, x10, x100, x1000
 *   - ×5 = ×10 ÷ 2 / ×9 = ×10 - n / ×11 (1 chiffre) = nn
 *   - Doubles (n × 2)
 *   - Complément à 10 pour les additions
 *   - Soustraction de 0, de soi-même
 *   - Division par 1, par soi-même, par 10/100/1000
 *
 * Idempotent : si on relance, les anciens chapitres calcul-mental sont
 * remplacés.
 *
 * Usage :
 *   node scripts/add-calcul-mental.cjs
 */

const fs = require('fs')
const path = require('path')

const MATHS_PATH = path.join(__dirname, '..', 'src', 'data', 'maths.json')

const CALC_MENTAL = [
  {
    id: 'calcul-mental-multiplications',
    title: '✖️ Multiplications — Calcul mental',
    sourceFile: 'source-calcul_mental_multiplications.json',
  },
  {
    id: 'calcul-mental-divisions',
    title: '➗ Divisions — Calcul mental',
    sourceFile: 'source-calcul_mental_divisions.json',
  },
  {
    id: 'calcul-mental-additions',
    title: '➕ Additions — Calcul mental',
    sourceFile: 'source-calcul_mental_additions.json',
  },
  {
    id: 'calcul-mental-soustractions',
    title: '➖ Soustractions — Calcul mental',
    sourceFile: 'source-calcul_mental_soustractions.json',
  },
]

// ─── Helpers ───

function parseOperation(question) {
  // Match : "Combien font 12 + 5 ?" et variantes
  const m = question.match(/(\-?\d+)\s*([+\-×÷xX*/])\s*(\-?\d+)/)
  if (!m) return null
  const a = parseInt(m[1], 10)
  const opRaw = m[2]
  const b = parseInt(m[3], 10)
  let op
  if (opRaw === '+') op = '+'
  else if (opRaw === '-') op = '−'
  else if (opRaw === '×' || opRaw.toLowerCase() === 'x' || opRaw === '*') op = '×'
  else if (opRaw === '÷' || opRaw === '/') op = '÷'
  return { a, b, op }
}

function isPowerOfTen(n) {
  return n > 0 && /^10*$/.test(String(n))
}

function countZeros(n) {
  return String(n).length - 1
}

// ─── Générateurs d'explication ───

function explainAddition(a, b, result) {
  const tips = []
  tips.push(`${a} + ${b} = ${result}.`)

  // Cas spéciaux
  if (a === 0 || b === 0) {
    tips.push(`Ajouter 0 ne change rien : le résultat reste le même.`)
  } else if (a === b) {
    tips.push(`Astuce : c'est le double de ${a}.`)
  } else if (a === 10 || b === 10) {
    const other = a === 10 ? b : a
    tips.push(
      `Astuce : ajouter 10 ne change pas les unités, ajoute juste 1 à la dizaine. Donc 10 + ${other} = ${result}.`
    )
  } else if (isPowerOfTen(a) || isPowerOfTen(b)) {
    const pow = isPowerOfTen(a) ? a : b
    tips.push(`Astuce : ajouter ${pow} décale d'un cran à gauche dans l'écriture.`)
  } else if (a < 10 && b < 10 && a + b > 10) {
    // Complément à 10
    const toTen = 10 - a
    if (b > toTen) {
      tips.push(
        `Astuce : décompose ${b} en ${toTen} + ${b - toTen}. Comme ${a} + ${toTen} = 10, on a 10 + ${b - toTen} = ${result}.`
      )
    }
  } else if (Math.max(a, b) >= 100) {
    tips.push(`Astuce : additionne les unités, puis les dizaines, puis les centaines (et les milliers si besoin).`)
  } else if (Math.max(a, b) >= 10) {
    tips.push(`Astuce : décompose en dizaines + unités. Ex: ${a} + ${b} = (${Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10}) + (${a % 10 + b % 10}).`)
  }

  return tips.join(' ')
}

function explainSoustraction(a, b, result) {
  const tips = []
  tips.push(`${a} − ${b} = ${result}.`)

  if (b === 0) {
    tips.push(`Soustraire 0 ne change rien.`)
  } else if (a === b) {
    tips.push(`Un nombre moins lui-même donne toujours 0.`)
  } else if (b === 1) {
    tips.push(`Soustraire 1 donne le nombre juste avant ${a}, c'est-à-dire ${result}.`)
  } else if (b === 10) {
    tips.push(`Astuce : soustraire 10 enlève juste 1 à la dizaine. ${a} − 10 = ${result}.`)
  } else if (isPowerOfTen(b)) {
    tips.push(`Astuce : soustraire ${b} déplace les chiffres dans l'écriture.`)
  } else {
    tips.push(`Vérification rapide : ${result} + ${b} = ${a}. ✓`)
  }

  return tips.join(' ')
}

function explainMultiplication(a, b, result) {
  const tips = []
  tips.push(`${a} × ${b} = ${result}.`)

  if (a === 0 || b === 0) {
    tips.push(`Règle : tout nombre multiplié par 0 donne 0.`)
  } else if (a === 1 || b === 1) {
    tips.push(`Multiplier par 1 ne change pas le nombre.`)
  } else if (isPowerOfTen(a) || isPowerOfTen(b)) {
    const pow = isPowerOfTen(a) ? a : b
    const other = isPowerOfTen(a) ? b : a
    const z = countZeros(pow)
    tips.push(
      `Astuce : multiplier par ${pow}, c'est ajouter ${z} zéro${z > 1 ? 's' : ''} à droite de ${other}.`
    )
  } else if (a === 2 || b === 2) {
    const other = a === 2 ? b : a
    tips.push(`Astuce : ×2 = le double. Le double de ${other} est ${result}.`)
  } else if (a === 5 || b === 5) {
    const other = a === 5 ? b : a
    tips.push(`Astuce : ×5 = ×10 ÷ 2. Donc ${other} × 10 = ${other * 10}, divisé par 2 = ${result}.`)
  } else if (a === 9 || b === 9) {
    const other = a === 9 ? b : a
    tips.push(`Astuce : ×9 = ×10 − le nombre. Donc ${other} × 10 = ${other * 10}, moins ${other} = ${result}.`)
  } else if ((a === 11 && b < 10) || (b === 11 && a < 10)) {
    const other = a === 11 ? b : a
    tips.push(`Astuce : 11 × ${other} = ${other}${other} (le chiffre écrit deux fois).`)
  } else if (a === 4 || b === 4) {
    const other = a === 4 ? b : a
    tips.push(`Astuce : ×4 = double du double. ${other} → ${other * 2} → ${result}.`)
  } else if (a === 25 || b === 25) {
    const other = a === 25 ? b : a
    tips.push(`Astuce : ×25 = ×100 ÷ 4. Donc ${other} × 100 = ${other * 100}, ÷ 4 = ${result}.`)
  } else if (a <= 12 && b <= 12) {
    tips.push(`C'est dans les tables : table de ${a}, ${b}e ligne (ou table de ${b}, ${a}e ligne).`)
  } else if (Math.max(a, b) >= 100) {
    const small = Math.min(a, b)
    const big = Math.max(a, b)
    tips.push(
      `Astuce : décompose ${big} pour multiplier morceau par morceau, puis additionne.`
    )
  } else {
    // 2 chiffres × 2 chiffres
    tips.push(
      `Astuce : décompose un des facteurs (ex: ${a} × ${b} = ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10}).`
    )
  }

  return tips.join(' ')
}

function explainDivision(a, b, result) {
  const tips = []
  tips.push(`${a} ÷ ${b} = ${result}.`)

  if (b === 1) {
    tips.push(`Diviser par 1 ne change rien.`)
  } else if (a === b) {
    tips.push(`Un nombre divisé par lui-même donne toujours 1.`)
  } else if (a === 0) {
    tips.push(`0 divisé par n'importe quel nombre donne 0.`)
  } else if (isPowerOfTen(b)) {
    const z = countZeros(b)
    tips.push(
      `Astuce : diviser par ${b}, c'est enlever ${z} zéro${z > 1 ? 's' : ''} à droite (ou décaler la virgule de ${z} cran${z > 1 ? 's' : ''} vers la gauche).`
    )
  } else if (b === 2) {
    tips.push(`Astuce : ÷2 = la moitié. La moitié de ${a} est ${result}.`)
  } else if (b === 5) {
    tips.push(`Astuce : ÷5 = ÷10 puis ×2. Ou alors : ${a} ÷ 5 = ${a * 2} ÷ 10 = ${result}.`)
  } else if (b === 4) {
    tips.push(`Astuce : ÷4 = ÷2 deux fois. ${a} ÷ 2 = ${a / 2}, puis ÷ 2 = ${result}.`)
  } else if (b <= 10) {
    tips.push(`Vérification : ${result} × ${b} = ${a}. ✓ (pense à la table de ${b}).`)
  } else {
    tips.push(`Vérification : ${result} × ${b} = ${a}. ✓`)
  }

  return tips.join(' ')
}

function generateExplanation(question, correctAnswer) {
  const parsed = parseOperation(question)
  if (!parsed) {
    return `Réponse : ${correctAnswer}`
  }
  const { a, b, op } = parsed
  const numericResult = parseInt(String(correctAnswer).replace(/\s/g, ''), 10)

  // Si la réponse correcte ne correspond pas au calcul, fallback
  let expectedResult = null
  if (op === '+') expectedResult = a + b
  else if (op === '−') expectedResult = a - b
  else if (op === '×') expectedResult = a * b
  else if (op === '÷' && b !== 0 && a % b === 0) expectedResult = a / b

  if (expectedResult !== null && expectedResult !== numericResult) {
    // Désync (rare) → on garde quand même les nombres détectés mais signale
    return `${a} ${op} ${b} = ${correctAnswer}.`
  }

  switch (op) {
    case '+': return explainAddition(a, b, correctAnswer)
    case '−': return explainSoustraction(a, b, correctAnswer)
    case '×': return explainMultiplication(a, b, correctAnswer)
    case '÷': return explainDivision(a, b, correctAnswer)
    default: return `Réponse : ${correctAnswer}`
  }
}

// ─── Conversion ───

function convert(q) {
  const correctAnswer = q.propositions[q.bonneReponse]
  return {
    question: q.question,
    choices: q.propositions,
    correctIndex: q.bonneReponse,
    explanation: generateExplanation(q.question, correctAnswer),
  }
}

// ─── Main ───

const maths = JSON.parse(fs.readFileSync(MATHS_PATH, 'utf8'))

// Idempotence
maths.chapters = maths.chapters.filter(
  (c) => !c.id.startsWith('calcul-mental-')
)

const newChapters = CALC_MENTAL.map((meta) => {
  const srcPath = path.join(__dirname, meta.sourceFile)
  if (!fs.existsSync(srcPath)) {
    console.error(`❌ Fichier source manquant : ${meta.sourceFile}`)
    process.exit(1)
  }
  const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  const questions = (src.questions || []).map(convert)
  return {
    id: meta.id,
    title: meta.title,
    accent: 'flash',
    section: 'calcul-mental',
    questions,
  }
})

maths.chapters = [...newChapters, ...maths.chapters]

fs.writeFileSync(MATHS_PATH, JSON.stringify(maths, null, 2), 'utf8')

console.log('⚡ 4 chapitres de calcul mental ajoutés avec explications pédagogiques :')
newChapters.forEach((c) =>
  console.log(`   ${c.title.padEnd(45)} ${String(c.questions.length).padStart(4)} questions`)
)

// Échantillon d'explications pour vérifier
console.log('\n📝 Échantillon d\'explications générées :')
newChapters.forEach((c) => {
  console.log(`\n   --- ${c.title} ---`)
  const sample = [c.questions[0], c.questions[Math.floor(c.questions.length / 2)], c.questions[c.questions.length - 1]]
  sample.forEach((q) => {
    console.log(`   Q: ${q.question}`)
    console.log(`     → ${q.explanation}`)
  })
})

const total = maths.chapters.reduce((a, c) => a + c.questions.length, 0)
console.log()
console.log(`🎯 Total Maths : ${total} questions sur ${maths.chapters.length} chapitres`)
