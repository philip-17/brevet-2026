import { useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getSubject, hasLesson } from '../data'
import {
  loadProgress,
  getChapterProgress,
} from '../storage/progress'

export default function SubjectPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const subject = subjectId ? getSubject(subjectId) : undefined
  const progress = useMemo(() => loadProgress(), [])
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)

  if (!subject) {
    return (
      <>
        <header className="page-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ←
          </button>
          <h1>Matière introuvable</h1>
        </header>
        <div className="empty">
          <div className="emoji">🤔</div>
          Cette matière n'existe pas.
        </div>
      </>
    )
  }

  return (
    <>
      <header className="page-header">
        <Link to="/" className="back-btn">
          ←
        </Link>
        <h1>
          {subject.emoji} {subject.label}
        </h1>
      </header>

      {selectedChapter && (
        <div
          className="quiz-card"
          style={
            {
              ['--accent' as never]: subject.color,
            } as React.CSSProperties
          }
        >
          <h2 style={{ margin: '0 0 14px', fontSize: 17 }}>
            Mode de révision
          </h2>
          <div className="mode-row mode-row-3">
            {hasLesson(subject.id, selectedChapter) && (
              <Link
                className="mode-btn featured"
                to={`/lesson/${subject.id}/${selectedChapter}`}
              >
                <span className="icon">📖</span>
                <span>Cours</span>
                <span className="desc">Avec lecture orale</span>
              </Link>
            )}
            <Link
              className="mode-btn"
              to={`/quiz/${subject.id}/${selectedChapter}`}
            >
              <span className="icon">📝</span>
              <span>Quiz QCM</span>
              <span className="desc">Avec score</span>
            </Link>
            <Link
              className="mode-btn"
              to={`/flashcards/${subject.id}/${selectedChapter}`}
            >
              <span className="icon">🎴</span>
              <span>Flashcards</span>
              <span className="desc">Question / réponse</span>
            </Link>
          </div>
          <button
            className="btn-secondary"
            style={{ marginTop: 12 }}
            onClick={() => setSelectedChapter(null)}
          >
            Annuler
          </button>
        </div>
      )}

      {!selectedChapter && (
        <>
          <h2 className="section-title">Chapitres</h2>
          <div className="chapter-list">
            {subject.chapters.map((chap) => {
              const prog = getChapterProgress(progress, subject.id, chap.id)
              // accent prend le pas sur isNew. Fallback : isNew -> 'new'
              const accent = chap.accent ?? (chap.isNew ? 'new' : undefined)
              const accentClass = accent ? `is-${accent}` : ''
              return (
                <button
                  key={chap.id}
                  className={`chapter-item ${accentClass}`}
                  onClick={() => setSelectedChapter(chap.id)}
                >
                  {accent === 'new' && (
                    <span className="new-ribbon">NEW</span>
                  )}
                  {accent === 'flash' && (
                    <span className="flash-ribbon">⚡ FLASH</span>
                  )}
                  <span className="title">{chap.title}</span>
                  {prog.bestScore > 0 ? (
                    <span className="badge success">
                      🏆 {prog.bestScore}%
                    </span>
                  ) : (
                    <span className="badge">{chap.questions.length} Q</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
