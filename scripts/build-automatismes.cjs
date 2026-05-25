/**
 * Convertit le fichier source automatismes-source.json (format officiel DNB 2026)
 * dans le format de l'app BrevetBoost, et regroupe les questions par grand domaine
 * en 5 chapitres.
 *
 * Sortie : src/data/automatismes.json
 *
 * Usage :
 *   node scripts/build-automatismes.cjs
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'automatismes-source.json')
const OUT = path.join(__dirname, '..', 'src', 'data', 'automatismes.json')

const source = JSON.parse(fs.readFileSync(SRC, 'utf8'))

// Mapping domaine -> identifiant de chapitre + titre court
const DOMAIN_MAP = {
  'Nombres et calculs': {
    id: 'auto-nombres-calculs',
    title: 'Nombres et calculs',
    emoji: '🔢',
  },
  'Espace et géométrie': {
    id: 'auto-geometrie',
    title: 'Espace et géométrie',
    emoji: '📐',
  },
  'Proportionnalité, fonctions': {
    id: 'auto-proportionnalite',
    title: 'Proportionnalité & fonctions',
    emoji: '📊',
  },
  'Organisation et gestion de données et probabilités': {
    id: 'auto-donnees-probas',
    title: 'Données & probabilités',
    emoji: '🎲',
  },
  'Algorithmique et programmation': {
    id: 'auto-algo',
    title: 'Algorithmique & programmation',
    emoji: '💻',
  },
}

// Convertit une question source dans le format de l'app
function convert(q) {
  return {
    question: q.enonce,
    choices: q.choix,
    correctIndex: q.bonneReponse,
    explanation: q.explication,
  }
}

// Regrouper les questions par domaine
const byDomain = {}
for (const q of source.questions) {
  if (!byDomain[q.domaine]) byDomain[q.domaine] = []
  byDomain[q.domaine].push(convert(q))
}

// Construire les chapitres dans l'ordre des DOMAIN_MAP
const chapters = []
for (const domain of Object.keys(DOMAIN_MAP)) {
  const meta = DOMAIN_MAP[domain]
  const questions = byDomain[domain] || []
  chapters.push({
    id: meta.id,
    title: `${meta.emoji} ${meta.title}`,
    questions,
    isNew: true,
  })
}

// Construire la matière finale
const subject = {
  id: 'automatismes',
  label: 'Automatismes',
  emoji: '⚡',
  color: '#22d3ee', // cyan électrique (rapidité, réflexes)
  chapters,
}

fs.writeFileSync(OUT, JSON.stringify(subject, null, 2), 'utf8')

const total = chapters.reduce((a, c) => a + c.questions.length, 0)
console.log('✅ automatismes.json construit')
console.log()
chapters.forEach((c) =>
  console.log(`  ${c.title.padEnd(40)} ${String(c.questions.length).padStart(4)} questions`)
)
console.log()
console.log(`🎯 Total : ${total} questions sur ${chapters.length} chapitres`)
