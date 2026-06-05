// Types partagés pour l'app BrevetBoost

export interface Question {
  question: string
  choices: string[]
  correctIndex: number
  explanation: string
}

export interface Chapter {
  id: string
  title: string
  questions: Question[]
  isNew?: boolean
  emoji?: string
  /** Style visuel spécial du chapitre :
   * - 'new'  : ruban "NEW" doré (orange→rose→violet) — pour les chapitres
   *            fraîchement ajoutés
   * - 'flash': bannière "⚡ FLASH" feu (orange→rouge→jaune) — pour les
   *            chapitres type calcul mental, entraînement rapide */
  accent?: 'new' | 'flash'
  /** Groupe d'appartenance du chapitre dans la matière (pour afficher
   * une grande bannière de section au-dessus du groupe).
   * Ex: 'calcul-mental' regroupe ✖️ × ➗ ÷ ➕ + ➖ −
   * Si absent, le chapitre apparaît dans le groupe "Chapitres" par défaut. */
  section?: string
}

export interface Subject {
  id: string
  label: string
  emoji: string
  color: string
  chapters: Chapter[]
}

// ====== Cours / leçons ======

export interface LessonSection {
  title: string
  content: string
  /** Schéma illustratif optionnel : markup SVG inline (contrôlé par l'app,
   * affiché tel quel). Sert à illustrer la notion (triangle, atome, frise…). */
  svg?: string
}

/** Fiche de révision synthétique affichée à la fin d'un cours :
 * l'essentiel à mémoriser, présenté de façon dense et motivante. */
export interface LessonRevision {
  /** 3 à 6 affirmations ultra-percutantes : le must-know absolu. */
  flash: string[]
  /** Repères clés (label → valeur) : dates, formules, définitions courtes
   * selon la matière. Affichés en mini-cartes. */
  reperes?: { label: string; value: string }[]
  /** Astuce / moyen mnémotechnique pour retenir facilement. */
  astuce?: string
  /** Erreur classique à éviter (le piège du brevet). */
  piege?: string
}

export interface Lesson {
  title: string
  intro: string
  sections: LessonSection[]
  keyPoints: string[]
  revision?: LessonRevision
}

export interface SubjectLessons {
  subjectId: string
  lessons: Record<string, Lesson>
}

// Stockage de la progression
export interface ChapterProgress {
  played: number // nombre de questions jouées (cumul)
  correct: number // nombre de bonnes réponses (cumul)
  bestScore: number // meilleur score en % sur un quiz
}

export interface ProgressState {
  // clé = `${subjectId}/${chapterId}`
  chapters: Record<string, ChapterProgress>
  // dernière session
  totalQuestions: number
  totalCorrect: number
}
