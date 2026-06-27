// Importe le cours « Mathématiques — Cours approfondi » TEL QUEL et le
// rattache à la leçon `revision-maths` (matière Maths), ouverte depuis la
// bannière « Tout à savoir en maths — dernière minute ».
//
// Le fichier est copié SANS MODIFICATION dans public/cours/ et servi comme
// un vrai fichier (iframe src) pour que tout marche : formules MathJax,
// chapitres dépliables (<details>), exercices à solution cachée, bouton
// « Tout déplier », sommaire ancré + surbrillance au défilement.
//
// Usage : node scripts/import-revision-maths-lesson.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LESSONS = join(ROOT, 'src', 'data', 'maths-lessons.json')

const SRC = join(homedir(), 'Downloads', 'cours-maths-brevet.html')
const PUBLIC_DIR = join(ROOT, 'public', 'cours')
const PUBLIC_FILE = join(PUBLIC_DIR, 'cours-maths-brevet.html')
const EMBED_URL = '/cours/cours-maths-brevet.html'

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
data.lessons['revision-maths'] = {
  title: 'Tout à savoir en maths',
  intro: '',
  sections: [],
  keyPoints: [],
  embedUrl: EMBED_URL,
}
writeFileSync(LESSONS, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`✅ Leçon « revision-maths » → embedUrl ${EMBED_URL}`)
