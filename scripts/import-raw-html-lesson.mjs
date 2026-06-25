// Importe le cours HTML « cours-fonctions-phrase.html » TEL QUEL dans la
// leçon « fonctions-grammaticales ».
//
// Le fichier est copié SANS AUCUNE MODIFICATION dans public/cours/ et servi
// comme un vrai fichier statique ; la leçon ne stocke que son URL (embedUrl).
// On charge un vrai fichier (et non du `srcdoc`) pour que les liens d'ancrage
// du sommaire (#sujet, #cod…) défilent dans le cours au lieu de recharger
// l'application dans le cadre.
//
// Usage : node scripts/import-raw-html-lesson.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LESSONS = join(ROOT, 'src', 'data', 'francais-lessons.json')

// Fichier source (original de l'utilisateur) et destination publique
const SRC = join(homedir(), 'Downloads', 'cours-fonctions-phrase.html')
const PUBLIC_DIR = join(ROOT, 'public', 'cours')
const PUBLIC_FILE = join(PUBLIC_DIR, 'fonctions-dans-la-phrase.html')
const EMBED_URL = '/cours/fonctions-dans-la-phrase.html'

// Copie le fichier tel quel s'il est disponible dans Downloads ; sinon on
// garde la copie déjà présente dans public/ (cas d'un simple re-run de build).
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
data.lessons['fonctions-grammaticales'] = {
  title: 'Les fonctions dans la phrase',
  intro: '',
  sections: [],
  keyPoints: [],
  embedUrl: EMBED_URL,
}
writeFileSync(LESSONS, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`✅ Leçon « fonctions-grammaticales » → embedUrl ${EMBED_URL}`)
