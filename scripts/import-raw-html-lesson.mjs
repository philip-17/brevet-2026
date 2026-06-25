// Importe le fichier HTML « cours-fonctions-phrase.html » TEL QUEL
// dans la leçon « fonctions-grammaticales » (champ rawHtml).
// Aucune modification du contenu du HTML : il est lu, encodé en JSON
// et stocké dans francais-lessons.json. Le rendu se fait dans un iframe.
//
// Usage : node scripts/import-raw-html-lesson.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LESSONS = join(__dirname, '..', 'src', 'data', 'francais-lessons.json')
// Le fichier source vit dans Downloads
const SRC = join(homedir(), 'Downloads', 'cours-fonctions-phrase.html')

const html = readFileSync(SRC, 'utf8')
const data = JSON.parse(readFileSync(LESSONS, 'utf8'))

data.lessons['fonctions-grammaticales'] = {
  title: 'Les fonctions dans la phrase',
  intro: '',
  sections: [],
  keyPoints: [],
  rawHtml: html,
}

writeFileSync(LESSONS, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`✅ Cours importé (${html.length} caractères)`)
