import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Question } from '../types'
import ReviewBanner from './ReviewBanner'

// Moteur de quiz : joue une liste de questions par séries de 10.
// Réutilisé par QuizPage (un chapitre) et RevisionPage (les erreurs).
const SERIE_SIZE = 10

interface Props {
  /** Questions déjà mélangées (ordre + choix) par l'appelant. */
  questions: Question[]
  /** Couleur d'accent (couleur de la matière). */
  accentColor: string
  /** Destination du bouton de fin. */
  backTo: string
  /** Libellé du bouton de fin (par défaut « Continuer »). */
  backLabel?: string
  /** Affiche la bannière d'avis sur l'écran de résultat. */
  showReview?: boolean
  /** Appelé à chaque réponse. */
  onAnswer?: (q: Question, isCorrect: boolean) => void
  /** Appelé à la fin d'une série. */
  onSeriesFinish?: (total: number, correct: number) => void
}

export default function QuizRunner({
  questions,
  accentColor,
  backTo,
  backLabel = 'Continuer',
  showReview = false,
  onAnswer,
  onSeriesFinish,
}: Props) {
  const [serie, setSerie] = useState(0)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const accent = { ['--accent' as never]: accentColor } as React.CSSProperties
  const totalSeries = Math.max(1, Math.ceil(questions.length / SERIE_SIZE))
  const serieQuestions = questions.slice(serie * SERIE_SIZE, serie * SERIE_SIZE + SERIE_SIZE)
  const current = serieQuestions[index]
  const isLast = index === serieQuestions.length - 1
  const hasNextSerie = serie < totalSeries - 1

  const handleSelect = (i: number) => {
    if (selected !== null || !current) return
    setSelected(i)
    const isCorrect = i === current.correctIndex
    if (isCorrect) setScore((s) => s + 1)
    onAnswer?.(current, isCorrect)
  }

  const handleNext = () => {
    if (isLast) {
      onSeriesFinish?.(serieQuestions.length, score)
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
    }
  }

  const restartSerie = () => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  const nextSerie = () => {
    setSerie((s) => s + 1)
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const percent = serieQuestions.length ? Math.round((score / serieQuestions.length) * 100) : 0
    const message =
      percent >= 80
        ? 'Excellent !'
        : percent >= 60
          ? 'Bien joué !'
          : percent >= 40
            ? 'Continue tes efforts'
            : 'Il faut réviser !'
    return (
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
              {backLabel}
            </Link>
          )}
        </div>
        {showReview && <ReviewBanner />}
      </div>
    )
  }

  // Garde-fou : série vide (liste sans question) → pas de crash.
  if (!current) return null

  return (
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
  )
}
