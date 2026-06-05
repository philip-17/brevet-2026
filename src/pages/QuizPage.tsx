import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getChapter } from '../data'
import { recordQuizResult } from '../storage/progress'
import { recordDailyActivity } from '../storage/daily'
import { recordAnswer } from '../storage/errors'
import { shuffle, shuffleQuestionChoices } from '../utils/shuffle'
import QuizRunner from '../components/QuizRunner'

export default function QuizPage() {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()
  const ctx = subjectId && chapterId ? getChapter(subjectId, chapterId) : undefined

  // Mélange une seule fois (questions + choix). Les QCM sont ensuite joués
  // par séries de 10 dans QuizRunner.
  const questions = useMemo(
    () => (ctx ? shuffle(ctx.chapter.questions).map(shuffleQuestionChoices) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subjectId, chapterId],
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

  return (
    <>
      <header className="page-header">
        <Link to={backTo} className="back-btn">
          ←
        </Link>
        <h1 style={{ fontSize: 17 }}>
          {subject.emoji} {chapter.title}
        </h1>
      </header>

      <QuizRunner
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
    </>
  )
}
