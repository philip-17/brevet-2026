import { useEffect, useMemo, useState } from 'react'
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

  // On arrive toujours en haut de la matière (évite d'atterrir en bas
  // à cause de la position de scroll de la page précédente)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [subjectId])

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

  const selectedTitle =
    subject.chapters.find((c) => c.id === selectedChapter)?.title ?? ''

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

      {/* Liste des chapitres regroupés par section (toujours affichée) */}
      {(() => {
        const groups: { key: string; chapters: typeof subject.chapters }[] = []
        const indexByKey = new Map<string, number>()
        for (const chap of subject.chapters) {
          const key = chap.section ?? '__default__'
          if (!indexByKey.has(key)) {
            indexByKey.set(key, groups.length)
            groups.push({ key, chapters: [] })
          }
          groups[indexByKey.get(key)!].chapters.push(chap)
        }

        return groups.map((group) => {
          const meta = SECTION_META[group.key] ?? DEFAULT_SECTION_META
          const totalQ = group.chapters.reduce(
            (a, c) => a + c.questions.length,
            0
          )
          return (
            <section key={group.key} className="chapter-section">
              <div className={`section-banner ${meta.cssClass}`}>
                <div className="section-banner-emoji">{meta.emoji}</div>
                <div className="section-banner-text">
                  <div className="section-banner-title">{meta.title}</div>
                  <div className="section-banner-subtitle">
                    {group.chapters.length} sous-chapitre
                    {group.chapters.length > 1 ? 's' : ''} · {totalQ} questions
                  </div>
                </div>
              </div>

              <div className="chapter-list">
                {group.chapters.map((chap) => {
                  const prog = getChapterProgress(progress, subject.id, chap.id)
                  const accent =
                    chap.accent ?? (chap.isNew ? 'new' : undefined)
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
                        <span className="badge">
                          {chap.questions.length} Q
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })
      })()}

      {/* Fenêtre de choix du mode (bottom sheet) — par-dessus la liste,
          aucun scroll nécessaire */}
      {selectedChapter && (
        <div
          className="sheet-overlay"
          onClick={() => setSelectedChapter(null)}
        >
          <div
            className="sheet"
            style={{ ['--accent' as never]: subject.color } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="sheet-title">{selectedTitle}</div>
            <div className="sheet-sub">Choisis ton mode de révision</div>

            <div className={`mode-row ${hasLesson(subject.id, selectedChapter) ? 'mode-row-3' : ''}`}>
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
        </div>
      )}
    </>
  )
}

// ============================================================
//  Métadonnées des sections (bannière)
// ============================================================

interface SectionMeta {
  emoji: string
  title: string
  cssClass: string
}

const DEFAULT_SECTION_META: SectionMeta = {
  emoji: '📚',
  title: 'Chapitres du brevet',
  cssClass: 'banner-default',
}

const SECTION_META: Record<string, SectionMeta> = {
  'calcul-mental': {
    emoji: '⚡',
    title: 'Calcul Mental',
    cssClass: 'banner-calcul-mental',
  },
  automatismes: {
    emoji: '🎯',
    title: 'Automatismes — DNB 2026',
    cssClass: 'banner-automatismes',
  },
}
