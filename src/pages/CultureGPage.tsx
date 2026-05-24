import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CULTURE_G, hasLesson } from '../data'
import { useInView } from '../hooks/useInView'
import {
  loadProgress,
  getChapterProgress,
} from '../storage/progress'

export default function CultureGPage() {
  const progress = useMemo(() => loadProgress(), [])
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const heroVisible = useInView<HTMLElement>({ threshold: 0.1 })

  return (
    <div className="culture-page">
      {/* Cosmic background */}
      <div className="cosmic-bg">
        <div className="cosmic-blob c1" />
        <div className="cosmic-blob c2" />
        <div className="star s1" />
        <div className="star s2" />
        <div className="star s3" />
        <div className="star s4" />
        <div className="star s5" />
        <div className="star s6" />
        <div className="star s7" />
        <div className="star s8" />
        <div className="star s9" />
        <div className="star s10" />
      </div>

      <header className="page-header floating">
        <Link to="/" className="back-btn">
          ←
        </Link>
        <h1 style={{ background: 'transparent' }}>🌍 Culture Générale</h1>
      </header>

      <section
        className={`culture-hero ${heroVisible.inView ? 'in-view' : ''}`}
        ref={heroVisible.ref}
      >
        <div className="culture-emoji-big">🌍</div>
        <h2>
          Explore les <span className="grad-purple">univers du savoir</span>
        </h2>
        <p>
          {CULTURE_G.chapters.length} thèmes • {' '}
          {CULTURE_G.chapters.reduce((a, c) => a + c.questions.length, 0)} questions
        </p>
      </section>

      {selectedChapter && (
        <div className="quiz-card glass">
          <h2 style={{ margin: '0 0 14px', fontSize: 17 }}>
            Mode de révision
          </h2>
          <div
            className={`mode-row ${hasLesson(CULTURE_G.id, selectedChapter) ? 'mode-row-3' : ''}`}
          >
            {hasLesson(CULTURE_G.id, selectedChapter) && (
              <Link
                className="mode-btn featured"
                to={`/lesson/${CULTURE_G.id}/${selectedChapter}`}
              >
                <span className="icon">📖</span>
                <span>Cours</span>
                <span className="desc">Avec lecture orale</span>
              </Link>
            )}
            <Link
              className="mode-btn"
              to={`/quiz/${CULTURE_G.id}/${selectedChapter}`}
            >
              <span className="icon">📝</span>
              <span>Quiz QCM</span>
              <span className="desc">Avec score</span>
            </Link>
            <Link
              className="mode-btn"
              to={`/flashcards/${CULTURE_G.id}/${selectedChapter}`}
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
        <div className="culture-grid">
          {CULTURE_G.chapters.map((chap, i) => {
            const prog = getChapterProgress(progress, CULTURE_G.id, chap.id)
            return (
              <button
                key={chap.id}
                className="culture-card"
                onClick={() => setSelectedChapter(chap.id)}
                style={{ ['--delay' as never]: `${i * 60}ms` } as React.CSSProperties}
              >
                <div className="culture-card-icon">
                  {chap.emoji ?? getThemeEmoji(chap.id, chap.title)}
                </div>
                <div className="culture-card-title">{chap.title}</div>
                <div className="culture-card-meta">
                  {chap.questions.length} questions
                  {prog.bestScore > 0 && (
                    <span className="best">🏆 {prog.bestScore}%</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Petit helper pour donner un émoji par thème
function getThemeEmoji(id: string, title: string): string {
  const lower = (id + ' ' + title).toLowerCase()
  if (lower.includes('géograph') || lower.includes('geograph')) return '🗺️'
  if (lower.includes('histoire') || lower.includes('mond')) return '⏳'
  if (lower.includes('science') || lower.includes('invention')) return '🔬'
  if (lower.includes('art') || lower.includes('littérat') || lower.includes('litterat')) return '🎨'
  if (lower.includes('cinéma') || lower.includes('cinema') || lower.includes('musique')) return '🎬'
  if (lower.includes('sport')) return '🏅'
  if (lower.includes('mythologie') || lower.includes('mythe')) return '⚡'
  if (lower.includes('nature') || lower.includes('animaux') || lower.includes('animal')) return '🦁'
  if (lower.includes('langue') || lower.includes('cult')) return '🗣️'
  if (lower.includes('logique') || lower.includes('énigme') || lower.includes('enigme')) return '🧩'
  return '✨'
}
