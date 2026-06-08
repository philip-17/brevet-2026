/**
 * Ajoute les 7 fiches de cours Physique-Chimie (issues des cours du prof) à
 * la matière "sciences" : 7 nouveaux chapitres (section "Mes fiches PC") avec
 * leurs QCM dans sciences.json + leurs cours dans sciences-lessons.json.
 *
 * Idempotent : relancer le script remplace proprement les chapitres/leçons
 * dont l'id commence par "fiche-pc-".
 *
 * Usage :
 *   node scripts/add-pc-fiches.cjs
 */

const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '..', 'src', 'data')
const SCIENCES_PATH = path.join(DATA, 'sciences.json')
const LESSONS_PATH = path.join(DATA, 'sciences-lessons.json')
const PREFIX = 'fiche-pc-'

// Source générée à partir des fiches condensées du prof
const SOURCE = require('./pc-fiches-app.json').chapters

// --- Construire les nouveaux chapitres (quiz) ---
const newChapters = SOURCE.map((c) => ({
  id: c.id,
  title: `${c.emoji} ${c.title}`,
  emoji: c.emoji,
  section: 'fiches-pc',
  accent: 'new',
  questions: c.questions,
}))

// --- Construire les nouvelles leçons (cours) ---
const newLessons = {}
for (const c of SOURCE) newLessons[c.id] = c.lesson

// --- Mettre à jour sciences.json (chapitres) ---
const sciences = JSON.parse(fs.readFileSync(SCIENCES_PATH, 'utf8'))
sciences.chapters = sciences.chapters.filter((c) => !c.id.startsWith(PREFIX))
sciences.chapters = [...newChapters, ...sciences.chapters] // en tête = bien visibles
fs.writeFileSync(SCIENCES_PATH, JSON.stringify(sciences, null, 2), 'utf8')

// --- Mettre à jour sciences-lessons.json (cours) ---
const lessons = JSON.parse(fs.readFileSync(LESSONS_PATH, 'utf8'))
for (const key of Object.keys(lessons.lessons)) {
  if (key.startsWith(PREFIX)) delete lessons.lessons[key]
}
// Insérer les nouvelles leçons en tête de l'objet (ordre d'affichage interne)
lessons.lessons = { ...newLessons, ...lessons.lessons }
fs.writeFileSync(LESSONS_PATH, JSON.stringify(lessons, null, 2), 'utf8')

// --- Résumé ---
console.log('✅ Fiches PC ajoutées :')
newChapters.forEach((c) =>
  console.log(`   - ${c.title} : ${c.questions.length} QCM + cours`)
)
console.log(
  `\nsciences.json : ${sciences.chapters.length} chapitres ; ` +
    `sciences-lessons.json : ${Object.keys(lessons.lessons).length} cours`
)
