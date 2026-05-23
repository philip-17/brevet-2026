import type { ChapterProgress, ProgressState } from '../types'

const KEY = 'brevet-boost:progress:v1'

function emptyState(): ProgressState {
  return {
    chapters: {},
    totalQuestions: 0,
    totalCorrect: 0,
  }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as ProgressState
    // garde-fou : si la structure n'est pas bonne, on repart à zéro
    if (!parsed || typeof parsed !== 'object' || !parsed.chapters) {
      return emptyState()
    }
    return parsed
  } catch {
    return emptyState()
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // localStorage plein ou désactivé : on ignore
  }
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function chapterKey(subjectId: string, chapterId: string): string {
  return `${subjectId}/${chapterId}`
}

export function getChapterProgress(
  state: ProgressState,
  subjectId: string,
  chapterId: string
): ChapterProgress {
  return (
    state.chapters[chapterKey(subjectId, chapterId)] ?? {
      played: 0,
      correct: 0,
      bestScore: 0,
    }
  )
}

export interface QuizResult {
  subjectId: string
  chapterId: string
  total: number
  correct: number
}

export function recordQuizResult(result: QuizResult): ProgressState {
  const state = loadProgress()
  const key = chapterKey(result.subjectId, result.chapterId)
  const existing = state.chapters[key] ?? {
    played: 0,
    correct: 0,
    bestScore: 0,
  }
  const score = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0
  const newChapter: ChapterProgress = {
    played: existing.played + result.total,
    correct: existing.correct + result.correct,
    bestScore: Math.max(existing.bestScore, score),
  }
  const newState: ProgressState = {
    ...state,
    chapters: { ...state.chapters, [key]: newChapter },
    totalQuestions: state.totalQuestions + result.total,
    totalCorrect: state.totalCorrect + result.correct,
  }
  saveProgress(newState)
  return newState
}

// Petit utilitaire pour calculer le pourcentage global pour une matière
export function getSubjectStats(
  state: ProgressState,
  subjectId: string
): { played: number; correct: number; percent: number } {
  let played = 0
  let correct = 0
  for (const key in state.chapters) {
    if (key.startsWith(subjectId + '/')) {
      played += state.chapters[key].played
      correct += state.chapters[key].correct
    }
  }
  const percent = played > 0 ? Math.round((correct / played) * 100) : 0
  return { played, correct, percent }
}
