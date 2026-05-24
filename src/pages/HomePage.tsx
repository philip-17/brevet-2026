import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BREVET_SUBJECTS, CULTURE_G } from '../data'

// ============================================================
//  Couleurs et données du design (fidèle au prototype Claude Design)
// ============================================================

const DESIGN_COLORS: Record<string, string> = {
  maths: '#6aa6ff',
  francais: '#ff7a7a',
  'histoire-geo': '#ffc26a',
  sciences: '#7af0c2',
}

const SUBJECT_TAGS: Record<string, string> = {
  maths: 'Algèbre · Géo · Stats',
  francais: 'Grammaire · Texte · Brevet',
  'histoire-geo': '20e · Géopolitique · EMC',
  sciences: 'SVT · Physique · Techno',
}

// Bandeau marquee — extraits de thèmes Culture G
const CULTURE_MARQUEE = [
  '🌍 Géo',
  '🏛️ Histoire',
  '⚜️ France',
  '⚗️ Sciences',
  '🌿 Nature',
  '🪐 Espace',
  '📚 Littérature',
  '🎬 Cinéma',
]

// Aperçu d'univers Culture G dans la section 2
const CULTURE_PREVIEW = [
  { emoji: '🏛️', label: 'Histoire mondiale' },
  { emoji: '⚜️', label: 'Histoire de France' },
  { emoji: '🌍', label: 'Géographie' },
  { emoji: '⚗️', label: 'Physique-Chimie' },
  { emoji: '🌿', label: 'Biologie & Nature' },
  { emoji: '🪐', label: 'Astronomie & Espace' },
  { emoji: '➗', label: 'Mathématiques' },
  { emoji: '📚', label: 'Littérature' },
  { emoji: '🎬', label: 'Cinéma' },
]

// ============================================================
//  Hooks
// ============================================================

function useCount(target: number, duration = 2000, start = 0) {
  const [n, setN] = useState(start)
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      setN(Math.round(start + (target - start) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])
  return n
}

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setTimeout(() => setSeen(true), delay)
            obs.disconnect()
            return
          }
        }
      },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return { ref, seen }
}

function useScrollProgressEl(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    let raf = 0
    const tick = () => {
      raf = 0
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      const vh = window.innerHeight
      const total = r.height + vh
      const offset = vh - r.top
      setP(Math.max(0, Math.min(1, offset / total)))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
  return p
}

function usePointer(ref: React.RefObject<HTMLDivElement | null>) {
  const [p, setP] = useState({ x: 50, y: 30 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const move = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        setP({
          x: ((e.clientX - r.left) / r.width) * 100,
          y: ((e.clientY - r.top) / r.height) * 100,
        })
      })
    }
    el.addEventListener('mousemove', move)
    return () => {
      el.removeEventListener('mousemove', move)
      cancelAnimationFrame(raf)
    }
  }, [ref])
  return p
}

// ============================================================
//  HERO
// ============================================================

function Hero({ totalQuestions, onStartCTA }: { totalQuestions: number; onStartCTA: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pointer = usePointer(containerRef)
  const total = useCount(totalQuestions, 2000)
  const [tab, setTab] = useState(0)
  const [pressed, setPressed] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const t = setInterval(
      () => setTab((x) => (x + 1) % BREVET_SUBJECTS.length),
      2200
    )
    return () => clearInterval(t)
  }, [])

  return (
    <div ref={containerRef} className="bb-hero">
      {/* ─── Fond animé ─── */}
      <div className="bb-hero-bg">
        <div
          className="bb-spotlight"
          style={{
            background: `radial-gradient(420px circle at ${pointer.x}% ${pointer.y}%, rgba(120,90,255,0.22), transparent 60%)`,
          }}
        />
        <div className="bb-blob bb-blob-1" />
        <div className="bb-blob bb-blob-2" />
        <div className="bb-blob bb-blob-3" />
        <div className="bb-noise" />
        <div className="bb-grid" />
      </div>

      {/* ─── Top bar ─── */}
      <div className="bb-topbar">
        <div className="bb-brand">
          <div className="bb-logo">B</div>
          <div className="bb-brand-text">
            <span className="bb-brand-name">BrevetBoost</span>
            <span className="bb-brand-tag">Brevet 2026</span>
          </div>
        </div>
        <div className="bb-live-badge">
          <span className="bb-pulse-dot" />
          <span className="bb-live-text">
            {total}
            <span className="bb-live-sub"> Q · PWA</span>
          </span>
        </div>
      </div>

      {/* ─── Headline ─── */}
      <div className="bb-headline-wrap">
        <h1 className="bb-headline">
          Boost ton<br />
          <span className="bb-grad-purple-pink">brevet</span>{' '}
          <span className="bb-amp">&amp;</span>
          <br />ta{' '}
          <span className="bb-grad-mint-blue">culture G</span>.
        </h1>
      </div>

      <p className="bb-sub">
        Quiz, flashcards et suivi de progression.{' '}
        <span className="bb-sub-strong">15 min/jour</span> et le brevet devient
        une formalité —{' '}
        <span className="bb-sub-strong">100 % sur ton tel</span>.
      </p>

      {/* ─── Subject rotator card ─── */}
      <div className="bb-rotator">
        {BREVET_SUBJECTS.map((s, i) => {
          const offset = (i - tab + BREVET_SUBJECTS.length) % BREVET_SUBJECTS.length
          const visible = offset < 3
          const color = DESIGN_COLORS[s.id] ?? s.color
          const totalQ = s.chapters.reduce((a, c) => a + c.questions.length, 0)
          return (
            <Link
              key={s.id}
              to={`/subject/${s.id}`}
              className="bb-rotator-card"
              style={
                {
                  top: offset * 5,
                  opacity: visible ? 1 - offset * 0.32 : 0,
                  transform: `scale(${1 - offset * 0.04})`,
                  background:
                    offset === 0
                      ? `linear-gradient(135deg, ${color}26, ${color}0d)`
                      : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${offset === 0 ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                  zIndex: 10 - offset,
                  boxShadow: offset === 0 ? `0 8px 30px ${color}25` : 'none',
                  pointerEvents: offset === 0 ? 'auto' : 'none',
                } as React.CSSProperties
              }
            >
              <div
                className="bb-rotator-emoji"
                style={{
                  background:
                    offset === 0 ? color + '20' : 'rgba(255,255,255,0.04)',
                  borderColor:
                    offset === 0 ? color + '40' : 'rgba(255,255,255,0.06)',
                }}
              >
                {s.emoji}
              </div>
              <div className="bb-rotator-info">
                <div
                  className="bb-rotator-tag"
                  style={{
                    color: offset === 0 ? color : 'rgba(244,244,248,0.4)',
                  }}
                >
                  Matière en vedette
                </div>
                <div className="bb-rotator-row">
                  <span>{s.label}</span>
                  <span className="bb-rotator-q">{totalQ} Q</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ─── Marquee Culture G ─── */}
      <div className="bb-marquee-wrap">
        <div className="bb-marquee-track">
          {[...CULTURE_MARQUEE, ...CULTURE_MARQUEE].map((t, i) => (
            <div key={i} className="bb-marquee-chip">
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTA + bas ─── */}
      <div className="bb-cta-wrap">
        <button
          className="bb-cta"
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => {
            setPressed(false)
            setHover(false)
          }}
          onMouseEnter={() => setHover(true)}
          onClick={onStartCTA}
          style={{
            transform: pressed
              ? 'scale(0.98)'
              : hover
                ? 'scale(1.01)'
                : 'scale(1)',
            boxShadow: hover
              ? '0 14px 40px rgba(122,86,255,0.5), 0 0 0 1px rgba(255,255,255,0.15) inset'
              : '0 8px 24px rgba(122,86,255,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
          }}
        >
          <div className="bb-cta-shimmer" />
          <span className="bb-cta-label">Commencer à réviser</span>
          <span className="bb-cta-icon">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M3 6.5h7m0 0L7 3.5M10 6.5L7 9.5"
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        <div className="bb-cta-meta">
          <Link to="/stats" className="bb-cta-meta-item">
            <span>📊</span>
            <span>Mes stats</span>
          </Link>
          <span className="bb-cta-meta-sep" />
          <span>100 % local · sans pub</span>
        </div>

        <div className="bb-signature">
          Made by{' '}
          <span className="bb-grad-purple-pink-static">Philip</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
//  Scroll hint en bas du hero
// ============================================================

function ScrollHint({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bb-scroll-hint"
      aria-label="Défiler vers le brevet"
    >
      <span className="bb-scroll-hint-pill">
        <span className="bb-scroll-hint-text">
          Scroll · découvre tes matières
        </span>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
          <path
            d="M5 1v11m0 0L1 8m4 4l4-4"
            stroke="rgba(244,244,248,0.7)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}

// ============================================================
//  Section transition (ligne + chiffre serif)
// ============================================================

function SectionTransition({
  number,
  label,
  tint,
}: {
  number: string
  label: string
  tint: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const p = useScrollProgressEl(wrapRef)
  const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
  const linePct = Math.max(0, Math.min(1, (p - 0.1) / 0.5)) * 100
  const numRotate = -20 + 20 * Math.max(0, Math.min(1, (p - 0.2) / 0.6))
  const numScale = 0.85 + 0.15 * Math.max(0, Math.min(1, (p - 0.2) / 0.6))
  const numOpacity = Math.max(0, Math.min(1, (p - 0.25) / 0.3))
  const labelY = 20 * (1 - Math.max(0, Math.min(1, (p - 0.35) / 0.4)))
  const labelOpacity = Math.max(0, Math.min(1, (p - 0.35) / 0.3))

  return (
    <div ref={wrapRef} className="bb-transition">
      <div className="bb-transition-bg-line" />
      <div
        className="bb-transition-active-line"
        style={{
          height: `${linePct}%`,
          background: `linear-gradient(180deg, transparent, ${tint}, transparent)`,
          boxShadow: `0 0 12px ${tint}80`,
        }}
      />
      <div
        className="bb-transition-num"
        style={{
          transform: `translate(-50%, -50%) scale(${numScale}) rotate(${numRotate}deg)`,
          WebkitTextStroke: `1px ${tint}`,
          opacity: numOpacity * 0.45,
        }}
      >
        {number}
      </div>
      <div
        className="bb-transition-dot"
        style={{
          transform: `translate(-50%, -50%) scale(${1 + eased * 0.5})`,
          background: tint,
          boxShadow: `0 0 ${8 + eased * 16}px ${tint}`,
          opacity: 0.4 + eased * 0.6,
        }}
      />
      <div
        className="bb-transition-label"
        style={{
          color: tint,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        <span style={{ opacity: 0.6 }}>↓</span> {label}
      </div>
      {[0.2, 0.5, 0.8].map((y, i) => (
        <div
          key={i}
          className="bb-transition-tick"
          style={{
            top: `${y * 100}%`,
            width: linePct > y * 100 ? 16 : 0,
            background: tint,
          }}
        />
      ))}
    </div>
  )
}

// ============================================================
//  Section Brevet
// ============================================================

function SubjectCard({ s, index }: { s: typeof BREVET_SUBJECTS[number]; index: number }) {
  const { ref, seen } = useReveal(index * 90)
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)
  const color = DESIGN_COLORS[s.id] ?? s.color
  const totalQ = s.chapters.reduce((a, c) => a + c.questions.length, 0)
  const tag = SUBJECT_TAGS[s.id] ?? ''

  return (
    <Link
      to={`/subject/${s.id}`}
      ref={ref as unknown as React.Ref<HTMLAnchorElement>}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setPressed(false)
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      className="bb-subject-card"
      style={{
        background: hover
          ? `linear-gradient(135deg, ${color}28, ${color}0a)`
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hover ? color + '55' : 'rgba(255,255,255,0.07)'}`,
        opacity: seen ? 1 : 0,
        transform: `translateY(${seen ? 0 : 24}px) scale(${pressed ? 0.99 : 1})`,
        boxShadow: hover ? `0 12px 32px ${color}25` : 'none',
      }}
    >
      <div
        className="bb-subject-sweep"
        style={{
          background: `linear-gradient(90deg, ${color}22, transparent)`,
          opacity: hover ? 1 : 0,
          transform: hover ? 'translateX(0)' : 'translateX(-40%)',
        }}
      />
      <div
        className="bb-subject-emoji"
        style={{
          background: hover ? color + '25' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hover ? color + '40' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        {s.emoji}
      </div>
      <div className="bb-subject-info">
        <div className="bb-subject-label">{s.label}</div>
        <div className="bb-subject-meta">
          {s.chapters.length} chapitres · {totalQ} questions
        </div>
        <div
          className="bb-subject-tag"
          style={{ color: hover ? color : 'rgba(244,244,248,0.4)' }}
        >
          {tag}
        </div>
      </div>
      <div
        className="bb-subject-arrow"
        style={{
          background: hover ? color : 'rgba(255,255,255,0.05)',
          transform: hover ? 'translateX(2px)' : 'translateX(0)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M3 6h6m0 0L6.5 3.5M9 6L6.5 8.5"
            stroke={hover ? '#07070c' : '#f4f4f8'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  )
}

function BrevetSection({ totalBrevetQuestions }: { totalBrevetQuestions: number }) {
  const { ref: headRef, seen: headSeen } = useReveal()
  const totalChapters = BREVET_SUBJECTS.reduce(
    (a, s) => a + s.chapters.length,
    0
  )

  return (
    <section className="bb-section bb-brevet">
      <div className="bb-section-blob bb-section-blob-blue" />
      <div className="bb-section-blob bb-section-blob-mint" />

      <div
        ref={headRef}
        className="bb-section-head"
        style={{
          opacity: headSeen ? 1 : 0,
          transform: headSeen ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="bb-section-pill bb-pill-blue">
          <span className="bb-pill-dot" style={{ background: '#6aa6ff' }} />
          <span>Partie 01</span>
        </div>
        <h2 className="bb-section-title">
          Révise{' '}
          <span className="bb-grad-blue-mint">ton brevet</span>
        </h2>
        <p className="bb-section-lead">
          4 matières, {totalChapters} chapitres,{' '}
          <span style={{ color: '#f4f4f8' }}>{totalBrevetQuestions} questions</span>{' '}
          corrigées. Choisis ta matière et lance-toi.
        </p>
      </div>

      <div className="bb-subjects-list">
        {BREVET_SUBJECTS.map((s, i) => (
          <SubjectCard key={s.id} s={s} index={i} />
        ))}
      </div>
    </section>
  )
}

// ============================================================
//  Section Culture G
// ============================================================

function UniverseTile({ u, index }: { u: typeof CULTURE_PREVIEW[number]; index: number }) {
  const { ref, seen } = useReveal(80 + index * 50)
  const [hover, setHover] = useState(false)
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="bb-univ-tile"
      style={{
        background: hover
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}`,
        opacity: seen ? 1 : 0,
        transform: `translateY(${seen ? 0 : 20}px) scale(${hover ? 1.03 : 1})`,
      }}
    >
      <div className="bb-univ-emoji">{u.emoji}</div>
      <div className="bb-univ-label">{u.label}</div>
    </div>
  )
}

function PlusTile({ index, extra }: { index: number; extra: number }) {
  const { ref, seen } = useReveal(80 + index * 50)
  return (
    <div
      ref={ref}
      className="bb-univ-plus"
      style={{
        opacity: seen ? 1 : 0,
        transform: `translateY(${seen ? 0 : 20}px)`,
      }}
    >
      <div className="bb-univ-plus-num">+{extra}</div>
      <div className="bb-univ-plus-label">autres</div>
    </div>
  )
}

function CultureSection({ totalCultureQuestions }: { totalCultureQuestions: number }) {
  const navigate = useNavigate()
  const { ref: headRef, seen: headSeen } = useReveal()
  const { ref: ctaRef, seen: ctaSeen } = useReveal(200)
  const [ctaHover, setCtaHover] = useState(false)
  const totalUnivers = CULTURE_G.chapters.length
  const extra = Math.max(0, totalUnivers - CULTURE_PREVIEW.length)

  return (
    <section className="bb-section bb-culture">
      <div className="bb-section-blob bb-section-blob-gold" />
      <div className="bb-section-blob bb-section-blob-purple" />

      <div
        ref={headRef}
        className="bb-section-head"
        style={{
          opacity: headSeen ? 1 : 0,
          transform: headSeen ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="bb-section-pill bb-pill-gold">
          <span className="bb-pill-dot" style={{ background: '#ffc26a' }} />
          <span>Partie 02</span>
        </div>
        <h2 className="bb-section-title">
          Booste ta{' '}
          <span className="bb-grad-gold-coral">culture G</span>
        </h2>
        <p className="bb-section-lead">
          {totalUnivers} univers,{' '}
          <span style={{ color: '#f4f4f8' }}>{totalCultureQuestions} questions</span>{' '}
          pour briller à l'oral et en société.
        </p>
      </div>

      <div className="bb-univ-grid">
        {CULTURE_PREVIEW.map((u, i) => (
          <UniverseTile key={u.label} u={u} index={i} />
        ))}
        {extra > 0 && <PlusTile index={CULTURE_PREVIEW.length} extra={extra} />}
      </div>

      <div
        ref={ctaRef}
        className="bb-culture-cta-wrap"
        style={{
          opacity: ctaSeen ? 1 : 0,
          transform: ctaSeen ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <button
          type="button"
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          onClick={() => navigate('/culture-g')}
          className="bb-culture-cta"
          style={{
            transform: ctaHover ? 'scale(1.01)' : 'scale(1)',
            boxShadow: ctaHover
              ? '0 14px 40px rgba(255,194,106,0.4)'
              : '0 8px 24px rgba(255,194,106,0.25)',
          }}
        >
          <div className="bb-cta-shimmer" />
          <span style={{ position: 'relative' }}>Entrer dans la culture G</span>
          <span className="bb-culture-cta-icon">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M3 6.5h7m0 0L7 3.5M10 6.5L7 9.5"
                stroke="#1a0e08"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>

      <div className="bb-footer">
        <span>Fait avec 💜 pour réviser malin.</span>
        <span>Tes stats restent sur ton téléphone.</span>
      </div>
    </section>
  )
}

// ============================================================
//  Scroll rail (sticky à droite)
// ============================================================

function ScrollRail({
  sections,
}: {
  sections: React.RefObject<HTMLDivElement | null>[]
}) {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const tick = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      setProgress(p)
      let best = 0
      let bestDist = Infinity
      sections.forEach((ref, i) => {
        if (!ref.current) return
        const top = ref.current.getBoundingClientRect().top
        const d = -top + 100
        if (d >= 0 && d < bestDist) {
          bestDist = d
          best = i
        }
      })
      setActive(best)
    }
    tick()
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick)
    return () => {
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
    }
  }, [sections])

  return (
    <div className="bb-scroll-rail">
      <div className="bb-rail-track">
        <div
          className="bb-rail-fill"
          style={{ height: `${progress * 100}%` }}
        />
      </div>
      <div className="bb-rail-counter">
        {String(active + 1).padStart(2, '0')}/
        {String(sections.length).padStart(2, '0')}
      </div>
    </div>
  )
}

// ============================================================
//  PAGE PRINCIPALE
// ============================================================

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const brevetRef = useRef<HTMLDivElement>(null)
  const cultureRef = useRef<HTMLDivElement>(null)

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
    () => CULTURE_G.chapters.reduce((a, c) => a + c.questions.length, 0),
    []
  )

  const scrollToBrevet = () => {
    brevetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Reset scroll au mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="bb-page">
      <ScrollRail sections={[heroRef, brevetRef, cultureRef]} />

      <div ref={heroRef} className="bb-hero-screen">
        <Hero totalQuestions={totalQuestions} onStartCTA={scrollToBrevet} />
        <ScrollHint onClick={scrollToBrevet} />
      </div>

      <div ref={brevetRef}>
        <SectionTransition number="01" label="Révise ton brevet" tint="#6aa6ff" />
        <BrevetSection totalBrevetQuestions={brevetQuestions} />
      </div>

      <div ref={cultureRef}>
        <SectionTransition number="02" label="Booste ta culture G" tint="#ffc26a" />
        <CultureSection totalCultureQuestions={cultureQuestions} />
      </div>
    </div>
  )
}
