import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BREVET_SUBJECTS } from '../data'
import type { Question } from '../types'
import { shuffle, shuffleQuestionChoices } from '../utils/shuffle'
import { recordDailyActivity, recordExamResult } from '../storage/daily'

interface ExamQuestion extends Question {
  subjectLabel: string
  subjectEmoji: string
}

type Phase = 'config' | 'running' | 'done'

const LENGTHS = [10, 20, 40]
const SECONDS_PER_Q = 45

function buildPool(scope: string): ExamQuestion[] {
  const subjects =
    scope === 'all'
      ? BREVET_SUBJECTS
      : BREVET_SUBJECTS.filter((s) => s.id === scope)
  const pool: ExamQuestion[] = []
  for (const s of subjects) {
    for (const chap of s.chapters) {
      for (const q of chap.questions) {
        pool.push({ ...q, subjectLabel: s.label, subjectEmoji: s.emoji })
      }
    }
  }
  return pool
}

function mentionFor(percent: number): { label: string; color: string } {
  if (percent >= 80) return { label: 'Mention Très Bien 🏆', color: '#fbbf24' }
  if (percent >= 70) return { label: 'Mention Bien 🥇', color: '#7af0c2' }
  if (percent >= 60) return { label: 'Mention Assez Bien 👍', color: '#6aa6ff' }
  if (percent >= 50) return { label: 'Admis ✅', color: '#a78bfa' }
  return { label: 'Pas encore admis — continue ! 💪', color: '#ff7a7a' }
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function ExamPage() {
  const [phase, setPhase] = useState<Phase>('config')
  const [scope, setScope] = useState('all')
  const [length, setLength] = useState(20)

  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poolSize = useMemo(() => buildPool(scope).length, [scope])

  const start = () => {
    const pool = buildPool(scope)
    const picked = shuffle(pool)
      .slice(0, Math.min(length, pool.length))
      .map((q) => shuffleQuestionChoices(q) as ExamQuestion)
    setQuestions(picked)
    setAnswers(new Array(picked.length).fill(null))
    setIndex(0)
    setSecondsLeft(picked.length * SECONDS_PER_Q)
    setPhase('running')
  }

  // Timer
  useEffect(() => {
    if (phase !== 'running') return
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setPhase('done')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // Enregistrement du résultat à la fin
  const recordedRef = useRef(false)
  const score = useMemo(
    () =>
      questions.reduce(
        (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
        0
      ),
    [questions, answers]
  )
  const percent = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0
  const note20 = questions.length
    ? Math.round((score / questions.length) * 20 * 10) / 10
    : 0

  useEffect(() => {
    if (phase === 'done' && !recordedRef.current) {
      recordedRef.current = true
      recordDailyActivity(questions.length)
      recordExamResult(note20, percent)
    }
  }, [phase, questions.length, note20, percent])

  const choose = (i: number) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = i
      return next
    })
  }

  const next = () => {
    if (index < questions.length - 1) setIndex((i) => i + 1)
    else setPhase('done')
  }

  const answeredCount = answers.filter((a) => a !== null).length

  // ───────── CONFIG ─────────
  if (phase === 'config') {
    return (
      <>
        <header className="page-header">
          <Link to="/" className="back-btn">
            ←
          </Link>
          <h1>🎯 Examen blanc</h1>
        </header>

        <div className="exam-config">
          <p className="exam-intro">
            Entraîne-toi dans les conditions du jour J : questions mélangées,
            chrono, et une note sur 20 avec mention à la fin. Pas de correction
            pendant l'épreuve !
          </p>

          <h2 className="section-title">Matière</h2>
          <div className="exam-scope">
            <button
              className={`exam-scope-btn ${scope === 'all' ? 'active' : ''}`}
              onClick={() => setScope('all')}
            >
              🎓 Tout le brevet
            </button>
            {BREVET_SUBJECTS.map((s) => (
              <button
                key={s.id}
                className={`exam-scope-btn ${scope === s.id ? 'active' : ''}`}
                onClick={() => setScope(s.id)}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>

          <h2 className="section-title">Nombre de questions</h2>
          <div className="exam-length">
            {LENGTHS.map((l) => (
              <button
                key={l}
                className={`exam-length-btn ${length === l ? 'active' : ''}`}
                onClick={() => setLength(l)}
              >
                {l}
                <span className="exam-length-time">
                  {fmtTime(l * SECONDS_PER_Q)}
                </span>
              </button>
            ))}
          </div>

          <div className="exam-summary">
            {Math.min(length, poolSize)} questions ·{' '}
            {fmtTime(Math.min(length, poolSize) * SECONDS_PER_Q)} de chrono
          </div>

          <button className="btn-primary" onClick={start}>
            🚀 Démarrer l'examen
          </button>
        </div>
      </>
    )
  }

  // ───────── RUNNING ─────────
  if (phase === 'running') {
    const q = questions[index]
    const lowTime = secondsLeft <= 30
    return (
      <>
        <div className={`exam-timer-bar ${lowTime ? 'low' : ''}`}>
          <span className="exam-timer">⏱ {fmtTime(secondsLeft)}</span>
          <div className="exam-timer-progress">
            <span
              style={{
                width: `${((index + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
          <span className="exam-counter">
            {index + 1}/{questions.length}
          </span>
        </div>

        <div className="quiz-card" style={{ marginTop: 14 }}>
          <div className="exam-subject-tag">
            {q.subjectEmoji} {q.subjectLabel}
          </div>
          <div className="question">{q.question}</div>
          <div className="choices">
            {q.choices.map((choice, i) => (
              <button
                key={i}
                className={`choice ${answers[index] === i ? 'selected' : ''}`}
                onClick={() => choose(i)}
              >
                <span className="letter">{String.fromCharCode(65 + i)}</span>
                <span>{choice}</span>
              </button>
            ))}
          </div>

          <button className="btn-primary" onClick={next}>
            {index < questions.length - 1
              ? 'Question suivante →'
              : 'Terminer l\'examen'}
          </button>
          {index < questions.length - 1 && (
            <button
              className="btn-secondary"
              style={{ marginTop: 10 }}
              onClick={() => setPhase('done')}
            >
              Terminer maintenant ({answeredCount}/{questions.length} répondues)
            </button>
          )}
        </div>
      </>
    )
  }

  // ───────── DONE ─────────
  const mention = mentionFor(percent)
  return (
    <>
      <header className="page-header">
        <Link to="/" className="back-btn">
          ←
        </Link>
        <h1>Résultat de l'examen</h1>
      </header>

      <div
        className="result-card"
        style={{ ['--p' as never]: percent } as React.CSSProperties}
      >
        <div className="score-circle">
          <span>{note20}</span>
        </div>
        <h2 style={{ color: mention.color }}>{mention.label}</h2>
        <p>
          {score} bonnes réponses sur {questions.length} · {percent}% · note{' '}
          {note20}/20
        </p>
      </div>

      <div className="btn-row">
        <button
          className="btn-secondary"
          onClick={() => {
            recordedRef.current = false
            setPhase('config')
          }}
        >
          🔁 Nouvel examen
        </button>
        <Link className="btn-primary" to="/" style={{ textAlign: 'center' }}>
          Accueil
        </Link>
      </div>

      <h2 className="section-title" style={{ marginTop: 28 }}>
        Correction détaillée
      </h2>
      <div className="exam-review">
        {questions.map((q, i) => {
          const ok = answers[i] === q.correctIndex
          return (
            <div key={i} className={`exam-review-item ${ok ? 'ok' : 'ko'}`}>
              <div className="exam-review-q">
                <span className="exam-review-num">{i + 1}</span>
                {q.question}
              </div>
              <div className="exam-review-ans">
                {ok ? (
                  <span className="ok-tag">
                    ✓ Bonne réponse : {q.choices[q.correctIndex]}
                  </span>
                ) : (
                  <>
                    <span className="ko-tag">
                      ✗ Ta réponse :{' '}
                      {answers[i] !== null
                        ? q.choices[answers[i] as number]
                        : '(aucune)'}
                    </span>
                    <span className="ok-tag">
                      ✓ Bonne réponse : {q.choices[q.correctIndex]}
                    </span>
                  </>
                )}
              </div>
              <div className="exam-review-exp">{q.explanation}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
