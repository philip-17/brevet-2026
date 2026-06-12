// Génère le cours « Vocabulaire HG » à partir des 120 questions
// du chapitre `vocab-hg-3e` (src/data/histoire-geo.json). Pour chaque
// question, on extrait le terme et sa définition, puis on les classe
// par grand thème pour produire une leçon structurée avec des
// listes de définitions.
//
// Usage : node scripts/build-vocab-hg-lesson.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'src', 'data')
const QUIZ_FILE = join(DATA, 'histoire-geo.json')
const LESSONS_FILE = join(DATA, 'histoire-geo-lessons.json')

const quiz = JSON.parse(readFileSync(QUIZ_FILE, 'utf8'))
const lessons = JSON.parse(readFileSync(LESSONS_FILE, 'utf8'))

const chapter = quiz.chapters.find((c) => c.id === 'vocab-hg-3e')
if (!chapter) throw new Error('Chapitre vocab-hg-3e introuvable')

// ----- Extraction du terme depuis la question -----
function extractTerm(question) {
  // 1) Texte entre guillemets français « ... »
  const m1 = question.match(/«\s*([^»]+?)\s*»/)
  if (m1) return m1[1]
  // 2) "Qu'est-ce qu'un/une/le/la/les ... ?"
  const m2 = question.match(
    /Qu'est-ce qu['e]?\s*(?:un|une|le|la|les|l')?\s*(.+?)\s*\?/i,
  )
  if (m2) return m2[1]
  // 3) "Que sont les ... ?"
  const m3 = question.match(/Que sont (?:les )?(.+?)\s*\?/)
  if (m3) return m3[1]
  // 4) "Qui était le chef de la ... depuis ... ?" → cas spécial : on retient « France libre »
  if (/chef de la France libre/i.test(question)) return 'France libre (chef)'
  // Fallback : la question entière sans le point d'interrogation
  return question.replace(/\?$/, '').trim()
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ----- Classification par thème -----
// Chaque thème : titre, intro, et tableau de mots-clés (recherchés dans
// le terme normalisé). L'ordre détermine la priorité.
const THEMES = [
  {
    key: 'pgm',
    title: '1. Première Guerre mondiale (1914-1918)',
    intro:
      "Les mots-clés du premier grand conflit mondial : la nature des combats, l'expérience des soldats, l'horreur de la violence de masse.",
    keywords: [
      'poilu',
      'armistice',
      'guerre totale',
      'guerre de position',
      'génocide arménien',
      'génocide', // attention : on classe ici la définition générale aussi
    ],
  },
  {
    key: 'totalitarismes',
    title: '2. Entre-deux-guerres et régimes totalitaires',
    intro:
      "Après 1918, des régimes nouveaux contrôlent toute la société par la propagande, la terreur et le culte du chef. Les démocraties, fragilisées, cherchent à résister.",
    keywords: [
      'régime totalitaire',
      'propagande',
      'culte de la personnalité',
      'antisémitisme',
      'nazisme',
      'kolkhoze',
      'goulag',
      'front populaire',
      'démocratie',
    ],
  },
  {
    key: 'sgm',
    title: '3. Seconde Guerre mondiale, Vichy et Shoah',
    intro:
      "Le conflit le plus meurtrier de l'histoire (1939-1945) : guerre éclair, occupation, collaboration, Résistance, génocides industrialisés. La justice internationale naît de ses ruines.",
    keywords: [
      'blitzkrieg',
      'shoah',
      "camp d'extermination",
      'solution finale',
      'déporté',
      'rafle',
      'collaboration',
      'résistance',
      'france libre',
      'sto',
      'service du travail obligatoire',
      'crime contre l',
      'épuration',
      'débarquement',
      'onu',
      'nuremberg',
    ],
  },
  {
    key: 'gf-deco',
    title: '4. Guerre froide et décolonisation',
    intro:
      "De 1947 à 1991, le monde est coupé en deux blocs. Pendant que les superpuissances s'affrontent, les peuples colonisés arrachent leur indépendance.",
    keywords: [
      'guerre froide',
      'rideau de fer',
      'otan',
      'décolonisation',
      'tiers-monde',
      "guerre d'algérie",
      'ceca',
      'traités de rome',
      'métropole (au sens colonial)',
      'bloc',
    ],
  },
  {
    key: 'republique',
    title: '5. République, institutions et EMC',
    intro:
      "Comment fonctionne la France ? République, démocratie, droit de vote, laïcité, État-providence : les principes que tu dois connaître pour le brevet d'EMC.",
    keywords: [
      'république',
      'constitution',
      'suffrage universel',
      'référendum',
      'cohabitation',
      'laïcité',
      'trente glorieuses',
      'état-providence',
      'parité',
      'média',
    ],
  },
  {
    key: 'mondialisation',
    title: '6. Mondialisation et France dans le monde',
    intro:
      "Le monde est connecté comme jamais : marchandises, capitaux, informations, personnes circulent en permanence. Quelques mots-clés pour décrypter ces flux.",
    keywords: [
      'mondialisation',
      'ftn',
      'firme transnationale',
      'flux',
      'hub',
      'conteneur',
      'façade maritime',
      'métropole mondiale',
      'mégalopole',
      'pays émergents',
      'pma',
      'délocalisation',
      'zip',
      'paradis fiscal',
      'migration',
      'fracture numérique',
      'soft power',
      'superpuissance',
      'brics',
      'francophonie',
      'zee',
      'frontière',
      'état',
      'souveraineté',
    ],
  },
  {
    key: 'france-ue',
    title: '7. France, Union européenne et territoires',
    intro:
      "La France est inscrite dans l'Union européenne et organise ses territoires entre métropole, outre-mer et grandes régions.",
    keywords: [
      'union européenne',
      'ue',
      'schengen',
      'zone euro',
      'eurorégion',
      'drom',
      'aménagement du territoire',
      'collectivité territoriale',
      'décentralisation',
      'région',
    ],
  },
  {
    key: 'geo-france',
    title: '8. Espaces français : villes, ruralité, productions',
    intro:
      "Aires urbaines, périurbanisation, espaces productifs, faibles densités : comment l'espace français est organisé et transformé.",
    keywords: [
      'aire urbaine',
      'périurbanisation',
      'étalement urbain',
      'banlieue',
      'diagonale du vide',
      'espace productif',
      'agriculture productiviste',
      'technopôle',
      'espace de faible densité',
    ],
  },
  {
    key: 'villes-monde',
    title: '9. Villes et notions générales de géographie',
    intro:
      "Le vocabulaire commun de la géographie : population, ressources, environnement, organisation des villes.",
    keywords: [
      'développement durable',
      'biodiversité',
      'risque naturel',
      'ressource',
      'densité de population',
      'exode rural',
      'urbanisation',
      'littoral',
      'territoire',
      'ville-centre',
      'couronne périurbaine',
      'agglomération',
      'pôle urbain',
      'cbd',
      'central business district',
      'gentrification',
      'ségrégation',
      'ville nouvelle',
      'conurbation',
      'friche urbaine',
      'rénovation urbaine',
      'zone pavillonnaire',
      'grand ensemble',
      'hlm',
      'bidonville',
      'éco-quartier',
      'migration pendulaire',
      'navette',
      'zone commerciale',
      'métropolisation',
      'mixité sociale',
      'intercommunalité',
    ],
  },
]

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function pickTheme(term) {
  const n = normalize(term)
  for (const t of THEMES) {
    for (const kw of t.keywords) {
      if (n.includes(normalize(kw))) return t.key
    }
  }
  return null
}

// ----- Extraction des paires (terme, définition) -----
const all = chapter.questions.map((q) => ({
  term: capitalize(extractTerm(q.question).trim()),
  def: q.choices[q.correctIndex],
}))

// Dédoublonne sur le terme (au cas où deux questions porteraient sur le même)
const seen = new Set()
const unique = all.filter((t) => {
  const k = normalize(t.term)
  if (seen.has(k)) return false
  seen.add(k)
  return true
})

// Classe chaque terme dans un thème
const byTheme = new Map(THEMES.map((t) => [t.key, []]))
const unclassified = []
for (const t of unique) {
  const k = pickTheme(t.term)
  if (k) byTheme.get(k).push(t)
  else unclassified.push(t)
}

console.log('--- Répartition ---')
for (const t of THEMES) {
  console.log(`${t.key}: ${byTheme.get(t.key).length}`)
}
if (unclassified.length) {
  console.log(`\n⚠ Non classés (${unclassified.length}) :`)
  for (const u of unclassified) console.log(`  - ${u.term}`)
}

// ----- Construction de la leçon -----
const sections = THEMES.filter((t) => byTheme.get(t.key).length > 0).map(
  (t) => ({
    title: t.title,
    content: t.intro,
    terms: byTheme.get(t.key),
  }),
)

// Repères chiffrés transverses
const reperes = [
  { label: 'Première Guerre mondiale', value: '1914-1918' },
  { label: 'Seconde Guerre mondiale', value: '1939-1945' },
  { label: 'Armistice du 11 novembre', value: '1918' },
  { label: 'Création de l’ONU', value: '1945' },
  { label: 'Décolonisation', value: 'années 1945-1970' },
  { label: 'Chute du mur de Berlin', value: '1989' },
  { label: 'Traité de Maastricht (UE)', value: '1992' },
  { label: "Naissance de l'euro", value: '2002' },
]

const lesson = {
  title: '📚 Vocabulaire d’histoire-géo — 120 termes officiels',
  intro:
    "Voici toutes les définitions à connaître pour le brevet d'histoire-géo, classées par grand thème. Chaque mot que tu retrouveras dans le quiz est ici expliqué clairement. Lis une section, fais le quiz du chapitre pour vérifier — et reviens ici dès qu'un mot te résiste.",
  sections,
  keyPoints: [
    "Le vocabulaire d'histoire-géo n'est pas du « par cœur » pur : chaque mot raconte une époque ou un espace.",
    "Première Guerre mondiale : tranchées, guerre totale, génocide arménien. Mots-clés de la violence de masse moderne.",
    "Entre-deux-guerres : régimes totalitaires (nazisme, stalinisme) qui contrôlent tout par propagande et terreur.",
    "Seconde Guerre mondiale : Shoah, Résistance, débarquement, ONU — la justice internationale naît à Nuremberg.",
    "Après 1945 : monde bipolaire (Guerre froide) et fin des empires coloniaux. La France se reconstruit (Trente Glorieuses, Ve République).",
    "Mondialisation : FTN, hubs, conteneurs, métropoles mondiales — un monde de flux, mais aussi d'inégalités (PMA, fracture numérique).",
    "Territoires français : métropolisation, périurbanisation, faibles densités, DROM, intégration dans l'UE.",
  ],
  revision: {
    flash: [
      "Un terme = une définition courte + un exemple. Sois précis, le correcteur attend du vocabulaire exact.",
      "Distingue armistice (cesser le feu) et traité de paix (règle officielle du conflit).",
      "Un génocide est une extermination programmée : Arméniens (1915), Juifs et Tsiganes (Shoah), Tutsis (1994).",
      "Régime totalitaire = parti unique + idéologie unique + propagande + terreur + culte du chef.",
      "Décolonisation = indépendance des anciennes colonies (Inde 1947, Algérie 1962…).",
      "Mondialisation = mise en relation des territoires par les flux ; FTN = entreprise présente dans plusieurs pays.",
    ],
    reperes,
    astuce:
      "Construis ta propre fiche : 1 ligne par mot, en français simple. Plus tu reformules avec tes mots, mieux tu retiens.",
    piege:
      "Ne confonds pas démocratie (peuple décide) et république (sans roi) : un pays peut être l'une sans l'autre.",
  },
}

if (!lessons.lessons) lessons.lessons = {}
lessons.lessons['vocab-hg-3e'] = lesson

writeFileSync(LESSONS_FILE, JSON.stringify(lessons, null, 2) + '\n', 'utf8')

const totalTerms = sections.reduce((a, s) => a + s.terms.length, 0)
console.log(
  `\n✅ Leçon vocab-hg-3e écrite — ${sections.length} sections, ${totalTerms} définitions`,
)
