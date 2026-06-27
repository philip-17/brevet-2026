// Importe le cours interactif « Révision Physique-Chimie » TEL QUEL et le
// rattache à la leçon `revision-pc` (matière Sciences), ouverte depuis la
// bannière « Choses à voir absolument avant le brevet ».
//
// Le fichier est copié SANS MODIFICATION dans public/cours/ et servi comme
// un vrai fichier (iframe src) pour que toutes ses interactions marchent
// (calculatrices, QCM, cartes, équilibreur, atome animé, sommaire ancré…).
//
// Usage : node scripts/import-revision-pc-lesson.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LESSONS = join(ROOT, 'src', 'data', 'sciences-lessons.json')

const SRC = join(homedir(), 'Downloads', 'revision-physique-chimie-brevet.html')
const PUBLIC_DIR = join(ROOT, 'public', 'cours')
const PUBLIC_FILE = join(PUBLIC_DIR, 'revision-physique-chimie-brevet.html')
const EMBED_URL = '/cours/revision-physique-chimie-brevet.html'

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
data.lessons['revision-pc'] = {
  title: 'Révision Physique-Chimie',
  intro: '',
  sections: [],
  keyPoints: [],
  embedUrl: EMBED_URL,
}
writeFileSync(LESSONS, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`✅ Leçon « revision-pc » → embedUrl ${EMBED_URL}`)
