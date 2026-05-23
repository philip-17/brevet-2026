import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BREVET_SUBJECTS, CULTURE_G } from '../data'
import { loadProgress, getSubjectStats } from '../storage/progress'
import { useInView } from '../hooks/useInView'

export default function HomePage() {
  const navigate = useNavigate()
  const progress = useMemo(() => loadProgress(), [])
  const brevetSectionRef = useRef<HTMLElement>(null)

  // Compteurs
  const totalQuestions = useMemo(
    () =>
      [...BREVET_SUBJECTS, CULTURE_G].reduce(
        (acc, s) =>
          acc + s.chapters.reduce((a, c) => a + c.questions.length, 0),
        0
      ),
    []
  )

  const brevetQuestions = useMemo(
    () =>
      BREVET_SUBJECTS.reduce(
        (acc, s) =>
          acc + s.chapters.reduce((a, c) => a + c.questions.length, 0),
        0
      ),
    []
  )

  const cultureQuestions = useMemo(
    () =>
      CULTURE_G.chapters.reduce((a, c) => a + c.questions.length, 0),
    []
  )

  // Scroll vers la section brevet
  const scrollToBrevet = () => {
    brevetSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Effet parallaxe léger sur le hero
  const heroRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (heroRef.current) {
        heroRef.current.style.setProperty('--y', `${y * 0.4}px`)
        heroRef.current.style.setProperty(
          '--opacity',
          String(Math.max(0, 1 - y / 500))
        )
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const brevetVisible = useInView<HTMLElement>({ threshold: 0.1 })
  const cultureVisible = useInView<HTMLElement>({ threshold: 0.15 })

  return (
    <div className="landing">
      {/* ============= HERO ============= */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-bg">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse" /> {totalQuestions} questions • PWA
          </div>
          <h1 className="hero-title">
            Boost ton
            <br />
            <span className="hero-gradient">brevet</span>
            <span className="and">&amp;</span>
            <span className="hero-gradient-2">culture G</span>
          </h1>
          <p className="hero-subtitle">
            Révise en quelques minutes par jour avec des quiz, des flashcards et
            un suivi de ta progression. Tout est sur ton téléphone.
          </p>

          <div className="hero-cta">
            <button className="btn-cta-primary" onClick={scrollToBrevet}>
              Commencer à réviser
              <span className="arrow">↓</span>
            </button>
            <Link to="/stats" className="btn-cta-secondary">
              📊 Mes stats
            </Link>
          </div>
        </div>

        <button className="scroll-indicator" onClick={scrollToBrevet} aria-label="Défiler">
          <span></span>
        </button>
      </section>

      {/* ============= BREVET SECTION ============= */}
      <section
        className={`section brevet-section ${brevetVisible.inView ? 'in-view' : ''}`}
        ref={(node) => {
          brevetSectionRef.current = node
          brevetVisible.ref.current = node
        }}
      >
        <div className="section-tag">
          <span className="dot" /> Partie 1
        </div>
        <h2 className="section-title-big">
          Révise <span className="grad-blue">ton brevet</span>
        </h2>
        <p className="section-lead">
          4 matières, {BREVET_SUBJECTS.length * 10}+ chapitres, {brevetQuestions} questions corrigées.
          Choisis ta matière et lance-toi.
        </p>

        <div className="subjects-grid-big">
          {BREVET_SUBJECTS.map((s, i) => {
            const stats = getSubjectStats(progress, s.id)
            const totalQ = s.chapters.reduce(
              (a, c) => a + c.questions.length,
              0
            )
            return (
              <Link
                key={s.id}
                to={`/subject/${s.id}`}
                className="subject-card-big"
                style={
                  {
                    ['--accent' as never]: s.color,
                    ['--delay' as never]: `${i * 80}ms`,
                  } as React.CSSProperties
                }
              >
                <div className="card-glow" />
                <div className="card-inner">
                  <div className="card-emoji">{s.emoji}</div>
                  <div className="card-info">
                    <h3 className="card-label">{s.label}</h3>
                    <p className="card-meta">
                      {s.chapters.length} chapitres • {totalQ} questions
                    </p>
                    {stats.played > 0 && (
                      <div className="card-progress">
                        <div className="bar">
                          <span style={{ width: `${stats.percent}%` }} />
                        </div>
                        <span className="pct">{stats.percent}%</span>
                      </div>
                    )}
                  </div>
                  <div className="card-arrow">→</div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ============= CULTURE G PORTAL ============= */}
      <section
        className={`section culture-portal ${cultureVisible.inView ? 'in-view' : ''}`}
        ref={cultureVisible.ref}
      >
        <div className="portal-bg">
          <div className="star s1" />
          <div className="star s2" />
          <div className="star s3" />
          <div className="star s4" />
          <div className="star s5" />
          <div className="star s6" />
          <div className="star s7" />
          <div className="star s8" />
        </div>

        <div className="portal-content">
          <div className="section-tag tag-purple">
            <span className="dot purple" /> Partie 2
          </div>
          <h2 className="section-title-big">
            Booste ta <span className="grad-purple">culture G</span>
          </h2>
          <p className="section-lead">
            Voyage à travers {CULTURE_G.chapters.length} univers : géographie,
            histoire, sciences, arts, mythologie, sport… {cultureQuestions} questions
            pour briller à l'oral et en société.
          </p>

          <div className="culture-themes">
            {CULTURE_G.chapters.slice(0, 6).map((c, i) => (
              <span
                key={c.id}
                className="theme-chip"
                style={{ ['--i' as never]: i } as React.CSSProperties}
              >
                {c.title}
              </span>
            ))}
            {CULTURE_G.chapters.length > 6 && (
              <span className="theme-chip more">
                +{CULTURE_G.chapters.length - 6} autres
              </span>
            )}
          </div>

          <button
            className="portal-btn"
            onClick={() => navigate('/culture-g')}
          >
            <span className="portal-icon">🌍</span>
            <span className="portal-label">
              <span className="big">Entrer dans la culture G</span>
              <span className="small">{cultureQuestions} questions à découvrir</span>
            </span>
            <span className="portal-arrow">→</span>
          </button>
        </div>
      </section>

      {/* ============= FOOTER ============= */}
      <footer className="landing-footer">
        <p>
          Fait avec 💜 pour réviser malin.
          <br />
          Tes stats restent sur ton téléphone, rien n'est envoyé en ligne.
        </p>
      </footer>
    </div>
  )
}
