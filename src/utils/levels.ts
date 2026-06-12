import type { Question } from '../types'

// Niveaux de difficulté (calcul mental) : helpers partagés entre
// le LevelPicker, QuizPage et FlashcardsPage.

export type Level = 1 | 2 | 3 | 'all'

export const LEVEL_META = [
  { value: 1, emoji: '🟢', label: 'Facile', desc: 'Pour bien démarrer' },
  { value: 2, emoji: '🟠', label: 'Moyen', desc: 'Pour progresser' },
  { value: 3, emoji: '🔴', label: 'Difficile', desc: 'Pour les champions' },
] as const

/** Le chapitre propose-t-il des niveaux de difficulté ? */
export function hasDifficultyLevels(questions: Question[]): boolean {
  return questions.some((q) => q.difficulty !== undefined)
}

/** Filtre les questions selon le niveau choisi. */
export function filterByLevel(questions: Question[], level: Level): Question[] {
  if (level === 'all') return questions
  return questions.filter((q) => q.difficulty === level)
}
