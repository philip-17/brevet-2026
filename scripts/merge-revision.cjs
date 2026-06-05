/**
 * Injecte le champ `revision` (fiche de révision) dans chaque leçon des
 * fichiers *-lessons.json, à partir des fichiers revision-<matiere>.json.
 *
 * Usage : node scripts/merge-revision.cjs
 */

const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '..', 'src', 'data')
const PAIRS = [
  { lessons: 'maths-lessons.json', revision: 'revision-maths.json' },
  { lessons: 'francais-lessons.json', revision: 'revision-francais.json' },
  { lessons: 'histoire-geo-lessons.json', revision: 'revision-histoire-geo.json' },
  { lessons: 'sciences-lessons.json', revision: 'revision-sciences.json' },
]

function validRevision(r) {
  if (!r || typeof r !== 'object') return false
  if (!Array.isArray(r.flash) || r.flash.length === 0) return false
  if (r.reperes && !Array.isArray(r.reperes)) return false
  return true
}

let totalInjected = 0

for (const pair of PAIRS) {
  const lessonsPath = path.join(DATA, pair.lessons)
  const revPath = path.join(__dirname, pair.revision)

  if (!fs.existsSync(revPath)) {
    console.warn(`⚠️  ${pair.revision} introuvable — ignoré`)
    continue
  }

  const lessonsFile = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'))
  const revisions = JSON.parse(fs.readFileSync(revPath, 'utf8'))

  let injected = 0
  let missing = []
  for (const chapterId in lessonsFile.lessons) {
    const rev = revisions[chapterId]
    if (validRevision(rev)) {
      // Nettoyage léger
      lessonsFile.lessons[chapterId].revision = {
        flash: rev.flash.map((s) => String(s).trim()),
        ...(rev.reperes
          ? {
              reperes: rev.reperes
                .filter((x) => x && x.label && x.value)
                .map((x) => ({
                  label: String(x.label).trim(),
                  value: String(x.value).trim(),
                })),
            }
          : {}),
        ...(rev.astuce ? { astuce: String(rev.astuce).trim() } : {}),
        ...(rev.piege ? { piege: String(rev.piege).trim() } : {}),
      }
      injected++
      totalInjected++
    } else {
      missing.push(chapterId)
    }
  }

  fs.writeFileSync(lessonsPath, JSON.stringify(lessonsFile, null, 2), 'utf8')
  console.log(
    `✅ ${pair.lessons.padEnd(28)} : ${injected} fiches de révision injectées` +
      (missing.length ? ` (manquantes : ${missing.join(', ')})` : '')
  )
}

console.log(`\n🎯 Total : ${totalInjected} fiches de révision intégrées`)
