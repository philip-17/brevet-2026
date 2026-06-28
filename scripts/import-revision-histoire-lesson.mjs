// Importe le cours interactif « Histoire-Géo — Brevet 2026 » TEL QUEL et le
// rattache à la leçon `revision-histoire` (matière Histoire-Géo), ouverte
// depuis la bannière « Tout à savoir en histoire-géo — dernière minute ».
//
// Le fichier est copié SANS MODIFICATION dans public/cours/ et servi comme
// un vrai fichier (iframe src) pour que tout marche : bascule Cours/Quiz,
// onglets Histoire/Géographie, sélection de thèmes, frise chronologique,
// quiz interactif (réponse, correction, score, recommencer).
//
// Usage : node scripts/import-revision-histoire-lesson.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LESSONS = join(ROOT, 'src', 'data', 'histoire-geo-lessons.json')

const SRC = join(homedir(), 'Downloads', 'histoire-geo-brevet.html')
const PUBLIC_DIR = join(ROOT, 'public', 'cours')
const PUBLIC_FILE = join(PUBLIC_DIR, 'histoire-geo-brevet.html')
const EMBED_URL = '/cours/histoire-geo-brevet.html'

if (existsSync(SRC)) {
  mkdirSync(PUBLIC_DIR, { recursive: true })
  copyFileSync(SRC, PUBLIC_FILE)
  console.log(`📄 Copié : ${SRC} → ${PUBLIC_FILE}`)
} else if (!existsSync(PUBLIC_FILE)) {
  throw new Error(`Introuvable : ni ${SRC} ni ${PUBLIC_FILE}`)
} else {
  console.log(`ℹ️  Source absente, on conserve ${PUBLIC_FILE}`)
}

const data = JSON.parse(readFileSync(LESSONS, 'utf8'))
data.lessons['revision-histoire'] = {
  title: 'Tout à savoir en histoire-géo',
  intro: '',
  sections: [],
  keyPoints: [],
  embedUrl: EMBED_URL,
}
writeFileSync(LESSONS, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`✅ Leçon « revision-histoire » → embedUrl ${EMBED_URL}`)
