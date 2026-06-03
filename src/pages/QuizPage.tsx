import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getChapter } from '../data'
import { recordQuizResult } from '../storage/progress'
import { recordDailyActivity } from '../storage/daily'
import { shuffle, shuffleQuestionChoices } from '../utils/shuffle'
import ReviewBanner from '../components/ReviewBanner'

export default function QuizPage() {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()
  const ctx = subjectId && chapterId ? getChapter(subjectId, chapterId) : undefined

  // IMPORTANT : on shuffle UNE SEULE FOIS au montage du composant
  // (sinon chaque re-render re-mélange et l'index saute)
  // On mélange aussi l'ordre des CHOIX pour éviter le biais
  // (certaines sources ont toutes les bonnes réponses en position A)
  // On limite à 20 questions max par session pour éviter les quiz
  // interminables (les chapitres d'Automatismes ont jusqu'à 175 questions)
  const MAX_PER_SESSION = 20
  const questions = useMemo(() => {
    if (!ctx) return []
    const shuffled = shuffle(ctx.chapter.questions).map(shuffleQuestionChoices)
    return shuffled.length > MAX_PER_SESSION
      ? shuffled.slice(0, MAX_PER_SESSION)
      : shuffled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, chapterId])

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  if (!ctx) {
    return (
      <>
        <header className="page-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ←
          </button>
          <h1>Chapitre introuvable</h1>
        </header>
      </>
    )
  }

  const { subject, chapter } = ctx
  const current = questions[index]
  const isLast = index === questions.length - 1

  const handleSelect = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    if (i === current.correctIndex) {
      setScore((s) => s + 1)
    }
  }

  const handleNext = () => {
    if (isLast) {
      recordQuizResult({
        subjectId: subject.id,
        chapterId: chapter.id,
        total: questions.length,
        correct: score,
      })
      // Compte les questions du jour pour le streak / objectif quotidien
      recordDailyActivity(questions.length)
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
    }
  }

  const handleReplay = () => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const percent = Math.round((score / questions.length) * 100)
    const message =
      percent >= 80
        ? 'Excellent !'
        : percent >= 60
          ? 'Bien joué !'
          : percent >= 40
            ? 'Continue tes efforts'
            : 'Il faut réviser !'

    return (
      <>
        <header className="page-header">
          <Link to={subject.id === 'culture-g' ? '/culture-g' : `/subject/${subject.id}`} className="back-btn">
            ←
          </Link>
          <h1>Résultat</h1>
        </header>
        <div
          className="result-card"
          style={{ ['--p' as never]: percent } as React.CSSProperties}
        >
          <div className="score-circle">
            <span>{percent}%</span>
          </div>
          <h2>{message}</h2>
          <p>
            {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''}{' '}
            sur {questions.length}
          </p>
        </div>
        <div className="btn-row">
          <button className="btn-secondary" onClick={handleReplay}>
            🔁 Refaire
          </button>
          <Link
            className="btn-primary"
            to={subject.id === 'culture-g' ? '/culture-g' : `/subject/${subject.id}`}
            style={{ textAlign: 'center' }}
          >
            Continuer
          </Link>
        </div>

        <ReviewBanner />
      </>
    )
  }

  return (
    <>
      <header className="page-header">
        <Link to={subject.id === 'culture-g' ? '/culture-g' : `/subject/${subject.id}`} className="back-btn">
          ←
        </Link>
        <h1 style={{ fontSize: 17 }}>
          {subject.emoji} {chapter.title}
        </h1>
      </header>

      <div className="quiz-progress">
        <div className="bar">
          <span
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="count">
          {index + 1} / {questions.length}
        </span>
      </div>

      <div className="quiz-card">
        <div className="question">{current.question}</div>
        <div className="choices">
          {current.choices.map((choice, i) => {
            let cls = 'choice'
            if (selected !== null) {
              if (i === current.correctIndex) cls += ' correct'
              else if (i === selected) cls += ' wrong'
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
              >
                <span className="letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{choice}</span>
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <>
            <div className="explanation">
              <strong>Explication</strong>
              {current.explanation}
            </div>
            <button className="btn-primary" onClick={handleNext}>
              {isLast ? 'Voir le résultat' : 'Question suivante →'}
            </button>
          </>
        )}
      </div>
    </>
  )
}
