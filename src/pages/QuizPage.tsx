import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getChapter } from '../data'
import { recordQuizResult } from '../storage/progress'
import { recordDailyActivity } from '../storage/daily'
import { shuffle, shuffleQuestionChoices } from '../utils/shuffle'
import ReviewBanner from '../components/ReviewBanner'

// Les QCM se jouent par séries de 10 questions : l'élève enchaîne les séries
// successives s'il le souhaite, jusqu'à couvrir tout le chapitre.
const SERIE_SIZE = 10

export default function QuizPage() {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()
  const ctx = subjectId && chapterId ? getChapter(subjectId, chapterId) : undefined

  // On mélange UNE SEULE FOIS au montage (questions + ordre des choix).
  // On garde TOUTES les questions : elles sont découpées en séries de 10.
  const allQuestions = useMemo(() => {
    if (!ctx) return []
    return shuffle(ctx.chapter.questions).map(shuffleQuestionChoices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, chapterId])

  const [serie, setSerie] = useState(0) // n° de la série en cours (0-based)
  const [index, setIndex] = useState(0) // position dans la série
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

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
  const accent = { ['--accent' as never]: subject.color } as React.CSSProperties
  const backTo = subject.id === 'culture-g' ? '/culture-g' : `/subject/${subject.id}`

  const totalSeries = Math.max(1, Math.ceil(allQuestions.length / SERIE_SIZE))
  const serieQuestions = allQuestions.slice(serie * SERIE_SIZE, serie * SERIE_SIZE + SERIE_SIZE)
  const current = serieQuestions[index]
  const isLast = index === serieQuestions.length - 1
  const hasNextSerie = serie < totalSeries - 1

  const handleSelect = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    if (i === current.correctIndex) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (isLast) {
      recordQuizResult({
        subjectId: subject.id,
        chapterId: chapter.id,
        total: serieQuestions.length,
        correct: score,
      })
      recordDailyActivity(serieQuestions.length)
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
    }
  }

  // Recommence la même série de 10.
  const restartSerie = () => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  // Passe à la série suivante de 10 (nouvelles questions).
  const nextSerie = () => {
    setSerie((s) => s + 1)
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const percent = Math.round((score / serieQuestions.length) * 100)
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
          <Link to={backTo} className="back-btn">
            ←
          </Link>
          <h1>Résultat</h1>
        </header>
        <div className="quiz-live" style={accent}>
          <div className="result-card" style={{ ['--p' as never]: percent } as React.CSSProperties}>
            <div className="score-circle">
              <span>{percent}%</span>
            </div>
            <h2>{message}</h2>
            <p>
              {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''} sur {serieQuestions.length}
            </p>
            {totalSeries > 1 && (
              <p className="serie-line">
                Série {serie + 1} / {totalSeries} terminée
              </p>
            )}
          </div>
          <div className="btn-row">
            <button className="btn-secondary" onClick={restartSerie}>
              🔁 Refaire
            </button>
            {hasNextSerie ? (
              <button className="btn-primary" onClick={nextSerie}>
                Série suivante →
              </button>
            ) : (
              <Link className="btn-primary" to={backTo} style={{ textAlign: 'center' }}>
                Continuer
              </Link>
            )}
          </div>

          <ReviewBanner />
        </div>
      </>
    )
  }

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

      <div className="quiz-live" style={accent}>
        <div className="quiz-progress">
          <div className="bar">
            <span style={{ width: `${((index + 1) / serieQuestions.length) * 100}%` }} />
          </div>
          <span className="count">
            {index + 1} / {serieQuestions.length}
          </span>
          {totalSeries > 1 && <span className="serie-badge">Série {serie + 1}/{totalSeries}</span>}
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
                  <span className="letter">{String.fromCharCode(65 + i)}</span>
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
      </div>
    </>
  )
}
