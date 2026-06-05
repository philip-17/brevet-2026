import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getErrors, recordAnswer } from '../storage/errors'
import { recordDailyActivity } from '../storage/daily'
import { shuffle, shuffleQuestionChoices } from '../utils/shuffle'
import QuizRunner from '../components/QuizRunner'

// Mode « Mes erreurs » : rejoue les questions ratées (toutes matières confondues),
// par séries de 10. Une question réussie ici est retirée de la liste (maîtrisée).
export default function RevisionPage() {
  const errors = useMemo(() => getErrors(), [])
  // Pour retrouver la matière/le chapitre d'une question au moment de la réponse.
  const originByText = useMemo(() => {
    const m = new Map<string, { subjectId: string; chapterId: string }>()
    errors.forEach((e) => m.set(e.q.question, { subjectId: e.subjectId, chapterId: e.chapterId }))
    return m
  }, [errors])
  const questions = useMemo(
    () => shuffle(errors.map((e) => e.q)).map(shuffleQuestionChoices),
    [errors],
  )

  return (
    <>
      <header className="page-header">
        <Link to="/" className="back-btn">
          ←
        </Link>
        <h1 style={{ fontSize: 17 }}>🎯 Mes erreurs</h1>
      </header>

      {questions.length === 0 ? (
        <div className="empty">
          <div className="emoji">🎉</div>
          Aucune erreur à revoir — bravo&nbsp;!
          <br />
          Les questions ratées dans les quiz apparaîtront ici pour que tu les retravailles.
          <Link
            to="/"
            className="btn-primary"
            style={{ marginTop: 18, display: 'inline-block', maxWidth: 260 }}
          >
            Retour à l'accueil
          </Link>
        </div>
      ) : (
        <QuizRunner
          questions={questions}
          accentColor="#ef4444"
          backTo="/"
          backLabel="Terminer"
          onAnswer={(q, isCorrect) => {
            const o = originByText.get(q.question)
            if (o) recordAnswer(o.subjectId, o.chapterId, q, isCorrect)
          }}
          onSeriesFinish={(total) => recordDailyActivity(total)}
        />
      )}
    </>
  )
}
