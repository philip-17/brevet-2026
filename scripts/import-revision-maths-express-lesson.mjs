// Importe la « Fiche express maths · révision de dernière minute » TELLE
// QUELLE et la rattache à la leçon `revision-maths-express` (matière Maths),
// ouverte depuis une 2ᵉ bannière en bas de la page Maths.
//
// Le fichier est copié SANS MODIFICATION dans public/cours/ et servi comme
// un vrai fichier (iframe src) pour que tout marche : formules MathJax,
// onglets de navigation, boutons « Voir la solution » (corrections révélées).
//
// Usage : node scripts/import-revision-maths-express-lesson.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LESSONS = join(ROOT, 'src', 'data', 'maths-lessons.json')

const SRC = join(homedir(), 'Downloads', 'brevet-maths-revision_1.html')
const PUBLIC_DIR = join(ROOT, 'public', 'cours')
const PUBLIC_FILE = join(PUBLIC_DIR, 'brevet-maths-revision_1.html')
const EMBED_URL = '/cours/brevet-maths-revision_1.html'

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
data.lessons['revision-maths-express'] = {
  title: 'Fiche express maths',
  intro: '',
  sections: [],
  keyPoints: [],
  embedUrl: EMBED_URL,
}
writeFileSync(LESSONS, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`✅ Leçon « revision-maths-express » → embedUrl ${EMBED_URL}`)
