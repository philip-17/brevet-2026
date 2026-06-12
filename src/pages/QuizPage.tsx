import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getChapter } from '../data'
import { recordQuizResult } from '../storage/progress'
import { recordDailyActivity } from '../storage/daily'
import { recordAnswer } from '../storage/errors'
import { shuffle, shuffleQuestionChoices } from '../utils/shuffle'
import QuizRunner from '../components/QuizRunner'
import LevelPicker from '../components/LevelPicker'
import {
  LEVEL_META,
  filterByLevel,
  hasDifficultyLevels,
  type Level,
} from '../utils/levels'

export default function QuizPage() {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()
  const ctx = subjectId && chapterId ? getChapter(subjectId, chapterId) : undefined

  // Chapitres avec niveaux (calcul mental) : on demande d'abord le niveau.
  const hasLevels = ctx ? hasDifficultyLevels(ctx.chapter.questions) : false
  const [level, setLevel] = useState<Level | null>(null)

  // Mélange une seule fois (questions + choix). Les QCM sont ensuite joués
  // par séries de 10 dans QuizRunner.
  const questions = useMemo(
    () => {
      if (!ctx) return []
      const pool =
        hasLevels && level !== null
          ? filterByLevel(ctx.chapter.questions, level)
          : ctx.chapter.questions
      return shuffle(pool).map(shuffleQuestionChoices)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subjectId, chapterId, level],
  )

  if (!ctx) {
    return (
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ←
        </button>
        <h1>Chapitre introuvable</h1>
      </header>
    )
  }

  const { subject, chapter } = ctx
  const backTo = subject.id === 'culture-g' ? '/culture-g' : `/subject/${subject.id}`
  const levelMeta = LEVEL_META.find((l) => l.value === level)

  return (
    <>
      <header className="page-header">
        {hasLevels && level !== null ? (
          // Retour à l'écran de choix du niveau (pas à la liste des chapitres)
          <button className="back-btn" onClick={() => setLevel(null)}>
            ←
          </button>
        ) : (
          <Link to={backTo} className="back-btn">
            ←
          </Link>
        )}
        <h1 style={{ fontSize: 17 }}>
          {subject.emoji} {chapter.title}
        </h1>
        {levelMeta && (
          <span className="level-badge">
            {levelMeta.emoji} {levelMeta.label}
          </span>
        )}
        {level === 'all' && <span className="level-badge">🌈 Tout</span>}
      </header>

      {hasLevels && level === null ? (
        <LevelPicker
          questions={chapter.questions}
          accentColor={subject.color}
          onSelect={setLevel}
        />
      ) : (
        <QuizRunner
          key={String(level)}
          questions={questions}
          accentColor={subject.color}
          backTo={backTo}
          showReview
          onAnswer={(q, isCorrect) => recordAnswer(subject.id, chapter.id, q, isCorrect)}
          onSeriesFinish={(total, correct) => {
            recordQuizResult({ subjectId: subject.id, chapterId: chapter.id, total, correct })
            recordDailyActivity(total)
          }}
        />
      )}
    </>
  )
}
