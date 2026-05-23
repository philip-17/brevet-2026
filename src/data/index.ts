import type { Subject, SubjectLessons, Lesson } from '../types'
import maths from './maths.json'
import francais from './francais.json'
import histoireGeo from './histoire-geo.json'
import sciences from './sciences.json'
import cultureG from './culture-g.json'

import mathsLessons from './maths-lessons.json'
import francaisLessons from './francais-lessons.json'
import histoireGeoLessons from './histoire-geo-lessons.json'
import sciencesLessons from './sciences-lessons.json'

// ====== Matières (quiz / flashcards) ======

export const SUBJECTS: Subject[] = [
  maths as Subject,
  francais as Subject,
  histoireGeo as Subject,
  sciences as Subject,
  cultureG as Subject,
]

export const CULTURE_G_ID = 'culture-g'

export const BREVET_SUBJECTS: Subject[] = SUBJECTS.filter(
  (s) => s.id !== CULTURE_G_ID
)

export const CULTURE_G: Subject = SUBJECTS.find(
  (s) => s.id === CULTURE_G_ID
)! as Subject

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id)
}

export function getChapter(subjectId: string, chapterId: string) {
  const subject = getSubject(subjectId)
  if (!subject) return undefined
  const chapter = subject.chapters.find((c) => c.id === chapterId)
  if (!chapter) return undefined
  return { subject, chapter }
}

// ====== Cours / leçons ======

const LESSON_FILES: SubjectLessons[] = [
  mathsLessons as SubjectLessons,
  francaisLessons as SubjectLessons,
  histoireGeoLessons as SubjectLessons,
  sciencesLessons as SubjectLessons,
]

// Index rapide subjectId/chapterId -> Lesson
const LESSONS_INDEX = new Map<string, Lesson>()
for (const sl of LESSON_FILES) {
  for (const chapterId in sl.lessons) {
    LESSONS_INDEX.set(`${sl.subjectId}/${chapterId}`, sl.lessons[chapterId])
  }
}

export function getLesson(
  subjectId: string,
  chapterId: string
): Lesson | undefined {
  return LESSONS_INDEX.get(`${subjectId}/${chapterId}`)
}

export function hasLesson(subjectId: string, chapterId: string): boolean {
  return LESSONS_INDEX.has(`${subjectId}/${chapterId}`)
}

// Nombre de leçons par matière (pour affichage)
export function getLessonCount(subjectId: string): number {
  let count = 0
  for (const key of LESSONS_INDEX.keys()) {
    if (key.startsWith(subjectId + '/')) count++
  }
  return count
}
