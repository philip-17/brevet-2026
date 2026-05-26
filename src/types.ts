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
}

export interface Lesson {
  title: string
  intro: string
  sections: LessonSection[]
  keyPoints: string[]
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
