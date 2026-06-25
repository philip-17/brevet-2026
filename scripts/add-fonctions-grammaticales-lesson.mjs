// Ajoute une leçon « Fonctions grammaticales » (les fonctions dans la
// phrase : sujet, COD, COI, attributs, CC, complément d'agent, fonctions
// du nom) dans francais-lessons.json. Le contenu est tiré du cours HTML
// fourni par l'utilisateur (cours-fonctions-phrase.html).
//
// Usage : node scripts/add-fonctions-grammaticales-lesson.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = join(__dirname, '..', 'src', 'data', 'francais-lessons.json')

const data = JSON.parse(readFileSync(FILE, 'utf8'))

const lesson = {
  title: 'Fonctions grammaticales',
  intro:
    "Reconnaître les fonctions, c'est savoir quel rôle joue chaque mot (ou groupe de mots) dans une phrase précise. Sujet, COD, COI, attribut, complément circonstanciel, épithète… ce sont les questions « qui ? quoi ? à qui ? quand ? » qui te donnent la clé. Avec une méthode claire, tu ne te trompes plus.",
  sections: [
    {
      title: '1. Nature ≠ fonction (la base à ne pas rater)',
      content:
        "C'est l'erreur n°1 au brevet. La NATURE (ou classe grammaticale) d'un mot, c'est ce qu'il est en lui-même : un nom reste un nom, un adjectif reste un adjectif. La FONCTION, c'est le rôle qu'il joue dans UNE phrase précise — et elle peut changer d'une phrase à l'autre. Un même mot, de même nature, peut donc occuper des fonctions différentes.",
      terms: [
        {
          term: 'Une voiture rouge.',
          def: '« rouge » = nature : adjectif · fonction : épithète du nom « voiture ».',
        },
        {
          term: 'Cette voiture est rouge.',
          def: '« rouge » = nature : adjectif (toujours) · fonction : attribut du sujet « voiture ».',
        },
      ],
      svg: '<svg viewBox="0 0 460 150" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif"><text x="230" y="22" text-anchor="middle" fill="#94a3b8" font-size="11">Le même mot — deux questions différentes</text><rect x="30" y="38" width="180" height="52" rx="8" fill="#1e40af" opacity="0.85"/><text x="120" y="60" text-anchor="middle" fill="#e5e7eb" font-size="13" font-weight="bold">NATURE</text><text x="120" y="78" text-anchor="middle" fill="#bfdbfe" font-size="11">Ce qu\'est le mot</text><text x="120" y="96" text-anchor="middle" fill="#93c5fd" font-size="11">nom, verbe, adjectif…</text><rect x="250" y="38" width="180" height="52" rx="8" fill="#065f46" opacity="0.85"/><text x="340" y="60" text-anchor="middle" fill="#e5e7eb" font-size="13" font-weight="bold">FONCTION</text><text x="340" y="78" text-anchor="middle" fill="#a7f3d0" font-size="11">Ce que fait le mot</text><text x="340" y="96" text-anchor="middle" fill="#6ee7b7" font-size="11">sujet, COD, épithète…</text><text x="230" y="130" text-anchor="middle" fill="#e5e7eb" font-size="12" font-style="italic">« rouge » → adjectif (nature) / épithète ou attribut (fonction)</text></svg>',
    },
    {
      title: '2. La méthode générale pour trouver une fonction',
      content:
        "La quasi-totalité des fonctions se repère à partir du VERBE. Procède toujours dans cet ordre : 1) repère le verbe conjugué (c'est le noyau de la phrase) ; 2) pose les bonnes questions à partir de ce verbe ; 3) teste la manipulation (déplacement, suppression) pour distinguer un complément circonstanciel d'un COD/COI.",
      terms: [
        {
          term: 'Qui est-ce qui + verbe ?',
          def: 'On trouve le SUJET.',
        },
        {
          term: 'Verbe + qui ? / quoi ? (sans préposition)',
          def: 'On trouve le COD.',
        },
        {
          term: 'Verbe + à qui ? / de quoi ? (avec préposition)',
          def: 'On trouve le COI.',
        },
        {
          term: 'Quand ? Où ? Comment ? Pourquoi ?',
          def: 'On trouve un COMPLÉMENT CIRCONSTANCIEL (déplaçable, supprimable).',
        },
      ],
    },
    {
      title: '3. Le sujet',
      content:
        "Le sujet désigne qui fait l'action (verbe d'action) ou de qui / de quoi l'on parle (verbe d'état). C'est lui qui commande l'accord du verbe. On le trouve avec « Qui est-ce qui… ? » ou « Qu'est-ce qui… ? ». Attention : le sujet n'est pas toujours en tête de phrase, il peut être inversé ; et le premier mot de la phrase n'est pas forcément le sujet.",
      terms: [
        {
          term: 'Les élèves travaillent en silence.',
          def: 'Sujet = « Les élèves ». Question : qui est-ce qui travaille ?',
        },
        {
          term: 'Mentir est inutile.',
          def: 'Sujet = « Mentir » (verbe à l\'infinitif).',
        },
        {
          term: "Qu'il soit en retard m'agace.",
          def: 'Sujet = « Qu\'il soit en retard » (proposition subordonnée).',
        },
        {
          term: 'Sur la table reposait un livre.',
          def: 'Sujet INVERSÉ = « un livre ». « Sur la table » est un CC de lieu placé en tête.',
        },
        {
          term: 'Le matin, les oiseaux chantent.',
          def: 'Sujet = « les oiseaux ». Le premier groupe (« Le matin ») est un CC de temps.',
        },
      ],
    },
    {
      title: "4. Les compléments d'objet (COD, COI, COS)",
      content:
        "Ils complètent un verbe d'action et sont essentiels : on ne peut ni les déplacer ni les supprimer librement. COD = construit directement, question « qui ? / quoi ? ». COI = construit avec une préposition (à, de…), question « à qui ? / de quoi ? ». COS = un deuxième complément d'objet quand il y a déjà un COD. Le réflexe : regarde s'il y a une préposition juste devant le complément.",
      terms: [
        {
          term: 'Le chat attrape une souris.',
          def: '« une souris » = COD. Le chat attrape QUOI ? (sans préposition)',
        },
        {
          term: "Je téléphone à mon ami.",
          def: '« à mon ami » = COI. Je téléphone À QUI ? (avec la préposition « à »)',
        },
        {
          term: "J'offre un cadeau à ma mère.",
          def: '« un cadeau » = COD (offre quoi ?) · « à ma mère » = COS (à qui ? — il y a déjà un COD).',
        },
        {
          term: "J'aime lire.",
          def: '« lire » = COD (infinitif). J\'aime QUOI ?',
        },
        {
          term: 'Je crois qu\'il viendra.',
          def: '« qu\'il viendra » = COD (proposition subordonnée). Je crois QUOI ?',
        },
      ],
    },
    {
      title: '5. Les attributs (du sujet et du COD)',
      content:
        "L'attribut exprime une qualité, un état ou une identité que l'on rapporte au sujet (ou au COD) PAR L'INTERMÉDIAIRE D'UN VERBE. ATTRIBUT DU SUJET : relié au sujet par un verbe d'état (être, paraître, sembler, devenir, rester, demeurer, avoir l'air…) ; il s'accorde avec le sujet quand c'est un adjectif. ATTRIBUT DU COD : exprime une qualité du COD, avec des verbes comme trouver, juger, croire, estimer, rendre, nommer, élire, appeler.",
      terms: [
        {
          term: 'Mon frère est pompier.',
          def: '« pompier » = attribut du sujet « Mon frère » (verbe d\'état « est »).',
        },
        {
          term: 'Elles semblent fatiguées.',
          def: '« fatiguées » = attribut du sujet, adjectif accordé au pluriel féminin.',
        },
        {
          term: 'Il regarde un médecin.',
          def: '« un médecin » = COD. Verbe d\'action, deux personnes différentes.',
        },
        {
          term: 'Il est médecin.',
          def: '« médecin » = attribut du sujet. Verbe d\'état « est », même référent.',
        },
        {
          term: 'Je trouve ce film passionnant.',
          def: '« passionnant » = attribut du COD. Il qualifie le COD « ce film ».',
        },
      ],
    },
    {
      title: '6. Les compléments circonstanciels (CC)',
      content:
        "Ils précisent les circonstances de l'action (temps, lieu, manière, moyen, cause, but, accompagnement…). Leur signe distinctif : ils sont DÉPLAÇABLES et le plus souvent SUPPRIMABLES. Le test qui ne trompe pas : « Hier, il a plu » = « Il a plu hier » = « Il a plu » → c'est bien un CC. Nature possible : groupe nominal, adverbe, groupe prépositionnel, proposition subordonnée, gérondif.",
      terms: [
        {
          term: 'Il partira demain.',
          def: 'CC de TEMPS (quand ?).',
        },
        {
          term: 'Elle attend devant la gare.',
          def: 'CC de LIEU (où ?).',
        },
        {
          term: 'Il répond calmement.',
          def: 'CC de MANIÈRE (comment ?).',
        },
        {
          term: 'Il écrit avec un stylo.',
          def: 'CC de MOYEN (avec quoi ?).',
        },
        {
          term: 'Il tremble de froid.',
          def: 'CC de CAUSE (pourquoi ?).',
        },
        {
          term: 'Il travaille pour réussir.',
          def: 'CC de BUT (dans quel but ?).',
        },
        {
          term: 'Il sort avec ses amis.',
          def: 'CC d\'ACCOMPAGNEMENT (avec qui ?).',
        },
        {
          term: 'Les enfants rentraient en chantant.',
          def: 'CC de MANIÈRE — gérondif (comment ?).',
        },
      ],
    },
    {
      title: "7. Le complément d'agent",
      content:
        "Il apparaît UNIQUEMENT à la voix passive et désigne celui qui fait réellement l'action (alors que le sujet, lui, la subit). Il est introduit par « par » (parfois « de » avec certains verbes comme aimer, respecter, accompagner). À la voix active, le complément d'agent redevient le sujet. Ne le confonds pas avec un CC de lieu introduit par « par » : la clé, c'est la voix du verbe.",
      terms: [
        {
          term: 'La maison a été construite par les ouvriers.',
          def: '« par les ouvriers » = complément d\'agent. Voix passive : ce sont les ouvriers qui agissent réellement.',
        },
        {
          term: 'Ce professeur est respecté de tous.',
          def: '« de tous » = complément d\'agent. « De » est possible avec certains verbes (respecter, aimer…).',
        },
        {
          term: 'Le rat est mangé par le chat. → Le chat mange le rat.',
          def: 'Passif → actif : le complément d\'agent (« par le chat ») redevient sujet (« Le chat »).',
        },
        {
          term: 'Il passe par la forêt.',
          def: 'PAS un complément d\'agent : voix active, « par la forêt » = CC de lieu.',
        },
      ],
    },
    {
      title: '8. Les fonctions liées au nom (épithète, C. du nom, apposition)',
      content:
        "Ces fonctions complètent un NOM (à l'intérieur du groupe nominal), et non le verbe. ÉPITHÈTE = un adjectif (ou participe employé comme adjectif) relié directement à un nom, sans verbe d'état ; elle peut être liée (collée au nom) ou détachée (séparée par une virgule). COMPLÉMENT DU NOM = un nom qui complète un autre nom, introduit par une préposition (de, à, en, pour…). APPOSITION = un nom ou GN qui désigne la même réalité que le nom qu'il complète, le plus souvent encadré de virgules.",
      terms: [
        {
          term: 'Un ciel bleu.',
          def: '« bleu » = épithète liée du nom « ciel » (adjectif collé).',
        },
        {
          term: 'Fatigués, les enfants se sont endormis.',
          def: '« Fatigués » = épithète détachée (séparée par une virgule).',
        },
        {
          term: 'Le vélo de mon voisin.',
          def: '« de mon voisin » = complément du nom « vélo » (préposition + nom).',
        },
        {
          term: 'Une tasse à café.',
          def: '« à café » = complément du nom « tasse ».',
        },
        {
          term: 'Paris, la capitale de la France, est magnifique.',
          def: '« la capitale de la France » = apposition au nom « Paris » (équivalence, entre virgules).',
        },
        {
          term: 'Mon oncle, médecin, habite ici.',
          def: '« médecin » = apposition au nom « oncle ».',
        },
        {
          term: "L'homme qui parle est mon père.",
          def: '« qui parle » = subordonnée relative, complète le nom « homme » à la manière d\'une épithète.',
        },
      ],
    },
    {
      title: '9. Les pièges classiques du brevet',
      content:
        "Les confusions qui font perdre des points faciles. Anticipe-les : à chaque fois que tu identifies une fonction, demande-toi laquelle de ces erreurs tu pourrais commettre, et vérifie.",
      terms: [
        {
          term: '1. Nature vs fonction',
          def: 'Si on demande la NATURE, réponds « adjectif », « nom », « pronom »… Si on demande la FONCTION, réponds « sujet », « COD », « épithète »… Vérifie ce qu\'on te demande.',
        },
        {
          term: '2. COD vs attribut du sujet',
          def: 'Verbe d\'action + objet différent = COD ("Il appelle un ami"). Verbe d\'état + même référent = attribut ("Il est un ami").',
        },
        {
          term: '3. COD vs COI',
          def: 'Une préposition (à, de) signale le COI. "Il pense à toi" = COI, jamais COD.',
        },
        {
          term: '4. Le sujet inversé ou éloigné',
          def: '"Sur la table reposait un livre" → le sujet est « un livre », pas « la table ».',
        },
        {
          term: '5. Épithète vs complément du nom',
          def: 'Épithète = adjectif ("un homme riche"). Complément du nom = nom + préposition ("un homme de pouvoir").',
        },
        {
          term: "6. Le 1er mot n'est pas forcément le sujet",
          def: "En tête de phrase, c'est souvent un CC : « Demain, je pars. »",
        },
      ],
    },
    {
      title: '10. La méthode pour le jour J',
      content:
        "Au brevet, déroule toujours la même procédure : 1) Repère d'abord le verbe conjugué (toute l'analyse part de là). 2) Pose la question correspondante (qui ? quoi ? à qui ? quand ?…). 3) Teste le déplacement / la suppression pour repérer un CC. 4) Vérifie la préposition pour trancher entre COD et COI. 5) Pour un adjectif, demande-toi s'il y a un verbe d'état (→ attribut) ou non (→ épithète). 6) Rédige précisément : ne dis pas seulement « COD », dis « « une souris » est COD du verbe « attrape » » — donne la fonction ET le mot auquel elle se rattache.",
    },
  ],
  keyPoints: [
    "La nature d'un mot (nom, verbe, adjectif…) est fixe ; la fonction (sujet, COD, épithète…) dépend de la phrase.",
    "Toute analyse de fonction part du VERBE conjugué : repère-le d'abord, puis pose la bonne question.",
    'Sans préposition après le verbe = COD ; avec préposition (à, de) = COI.',
    "Un CC se déplace et se supprime ; un COD/COI, non. C'est le test décisif.",
    "L'attribut suppose un verbe d'état (être, sembler, devenir, paraître…) qui rapporte une qualité au sujet ou au COD.",
    "Le complément d'agent n'existe qu'à la voix passive (« par les ouvriers », parfois « de »).",
    "Épithète = adjectif (« un mur blanc ») · complément du nom = nom + préposition (« le toit de la maison ») · apposition = nom équivalent entre virgules (« Rome, la ville éternelle »).",
    'Au brevet, donne toujours la fonction ET le mot auquel elle se rattache : « COD du verbe attrape », pas juste « COD ».',
  ],
  revision: {
    flash: [
      "Nature = ce qu'EST le mot (fixe). Fonction = ce qu'il FAIT (dépend de la phrase).",
      "Toute analyse part du VERBE conjugué : pose la question à partir de lui.",
      'COD = quoi/qui sans préposition. COI = à/de qui/quoi.',
      'CC = déplaçable + supprimable. C\'est le test décisif.',
      "Attribut = verbe d'état (être, sembler, devenir, paraître…) qui qualifie le sujet.",
      "Épithète (adjectif) ≠ complément du nom (nom + préposition) ≠ apposition (= équivalence entre virgules).",
    ],
    reperes: [
      { label: 'Sujet', value: 'qui est-ce qui + verbe ?' },
      { label: 'COD', value: 'verbe + quoi/qui ? (sans préposition)' },
      { label: 'COI', value: 'verbe + à/de quoi/qui ? (avec préposition)' },
      { label: 'CC', value: 'quand/où/comment/pourquoi ? — déplaçable' },
      { label: "Complément d'agent", value: 'voix passive + « par » / « de »' },
      { label: 'Épithète', value: 'adjectif collé/détaché du nom' },
      { label: 'Complément du nom', value: 'nom + préposition (de, à, en…)' },
      { label: 'Apposition', value: 'nom équivalent encadré de virgules' },
    ],
    astuce:
      "Le verbe d'abord, toujours. Une fois que tu le tiens, tout le reste se débloque : tu poses la bonne question, et la fonction tombe.",
    piege:
      "Ne confonds pas nature et fonction. Si on te demande la nature de « rouge », réponds « adjectif ». Si on te demande la fonction, réponds « épithète » ou « attribut » selon la phrase.",
  },
}

data.lessons['fonctions-grammaticales'] = lesson

writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')

console.log(
  `✅ Leçon « fonctions-grammaticales » ajoutée — ${lesson.sections.length} sections, ${lesson.sections.reduce(
    (a, s) => a + (s.terms?.length ?? 0),
    0,
  )} exemples analysés`,
)
