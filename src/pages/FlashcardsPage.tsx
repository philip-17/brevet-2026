import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getChapter } from '../data'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function FlashcardsPage() {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()
  const ctx = subjectId && chapterId ? getChapter(subjectId, chapterId) : undefined

  const cards = useMemo(
    () => (ctx ? shuffle(ctx.chapter.questions) : []),
    [ctx]
  )

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

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
  const card = cards[index]
  const isLast = index === cards.length - 1
  const correctAnswer = card.choices[card.correctIndex]

  const next = () => {
    if (isLast) {
      setIndex(0)
    } else {
      setIndex((i) => i + 1)
    }
    setFlipped(false)
  }

  const prev = () => {
    if (index === 0) return
    setIndex((i) => i - 1)
    setFlipped(false)
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
          <span style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
        </div>
        <span className="count">
          {index + 1} / {cards.length}
        </span>
      </div>

      <div className="flashcard" onClick={() => setFlipped((f) => !f)}>
        {!flipped ? (
          <>
            <div className="label">Question</div>
            <div className="content">{card.question}</div>
            <div className="hint">Touche la carte pour voir la réponse</div>
          </>
        ) : (
          <>
            <div className="label">Réponse</div>
            <div className="content" style={{ color: '#6ee7b7' }}>
              ✓ {correctAnswer}
            </div>
            <div
              className="hint"
              style={{ marginTop: 14, color: 'var(--text-dim)' }}
            >
              {card.explanation}
            </div>
          </>
        )}
      </div>

      <div className="btn-row">
        <button
          className="btn-secondary"
          onClick={prev}
          disabled={index === 0}
          style={{ opacity: index === 0 ? 0.5 : 1 }}
        >
          ← Précédent
        </button>
        <button className="btn-primary" onClick={next}>
          {isLast ? '🔁 Recommencer' : 'Suivant →'}
        </button>
      </div>
    </>
  )
}
