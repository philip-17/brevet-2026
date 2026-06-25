import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getSubject, getLesson } from '../data'
import { useSpeech } from '../hooks/useSpeech'
import RawHtmlLesson from '../components/RawHtmlLesson'

export default function LessonPage() {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()
  const subject = subjectId ? getSubject(subjectId) : undefined
  const lesson = subjectId && chapterId ? getLesson(subjectId, chapterId) : undefined

  const speech = useSpeech()
  const [showVoices, setShowVoices] = useState(false)
  const [showRevision, setShowRevision] = useState(false)

  // Texte complet pour la lecture à l'oral
  const fullText = useMemo(() => {
    if (!lesson) return ''
    const parts = [
      lesson.title + '.',
      lesson.intro,
      ...lesson.sections.flatMap((s) => [
        s.title + '.',
        s.content,
        ...(s.terms?.map((t) => `${t.term} : ${t.def}`) ?? []),
      ]),
      'Points clés à retenir :',
      ...lesson.keyPoints.map((p, i) => `${i + 1}. ${p}.`),
    ]
    if (lesson.revision) {
      parts.push('Fiche de révision. L\'essentiel :')
      parts.push(...lesson.revision.flash)
      if (lesson.revision.reperes) {
        parts.push('Repères clés :')
        parts.push(
          ...lesson.revision.reperes.map((r) => `${r.label} : ${r.value}.`)
        )
      }
      if (lesson.revision.astuce) parts.push('Astuce : ' + lesson.revision.astuce)
      if (lesson.revision.piege) parts.push('Piège à éviter : ' + lesson.revision.piege)
    }
    return parts.join(' ')
  }, [lesson])

  if (!subject) {
    return (
      <>
        <header className="page-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ←
          </button>
          <h1>Matière introuvable</h1>
        </header>
      </>
    )
  }

  if (!lesson) {
    return (
      <>
        <header className="page-header">
          <Link
            to={
              subject.id === 'culture-g'
                ? '/culture-g'
                : `/subject/${subject.id}`
            }
            className="back-btn"
          >
            ←
          </Link>
          <h1>Cours indisponible</h1>
        </header>
        <div className="empty">
          <div className="emoji">📚</div>
          La fiche de cours pour ce chapitre n'est pas encore disponible.
          <br />
          Tu peux quand même faire le quiz pour t'entraîner !
          <Link
            to={`/quiz/${subject.id}/${chapterId}`}
            className="btn-primary"
            style={{ marginTop: 18, display: 'inline-block', maxWidth: 240 }}
          >
            Lancer le quiz
          </Link>
        </div>
      </>
    )
  }

  const togglePlay = () => {
    if (!speech.supported) return
    if (speech.speaking && !speech.paused) {
      speech.pause()
    } else if (speech.speaking && speech.paused) {
      speech.resume()
    } else {
      speech.speak(fullText)
    }
  }

  const speakSection = (text: string) => {
    if (!speech.supported) return
    speech.speak(text)
  }

  return (
    <>
      <header className="page-header">
        <Link
          to={
            subject.id === 'culture-g'
              ? '/culture-g'
              : `/subject/${subject.id}`
          }
          className="back-btn"
        >
          ←
        </Link>
        <h1 style={{ fontSize: 17 }}>
          {subject.emoji} {lesson.title}
        </h1>
      </header>

      {/* Cours autonome embarqué (HTML servi depuis /public) : on l'affiche
          tel quel dans un iframe (pas de lecture orale ni de fiche de révision) */}
      {lesson.embedUrl && (
        <div className="lesson" style={{ display: 'block', width: '100%' }}>
          <RawHtmlLesson url={lesson.embedUrl} />
          <div className="lesson-cta" style={{ marginTop: 24 }}>
            <Link
              to={`/quiz/${subject.id}/${chapterId}`}
              className="btn-primary"
            >
              ✅ Je passe au quiz
            </Link>
            <Link
              to={`/flashcards/${subject.id}/${chapterId}`}
              className="btn-secondary"
            >
              🎴 Réviser en flashcards
            </Link>
          </div>
        </div>
      )}

      {/* Barre de lecture sticky */}
      {!lesson.embedUrl && speech.supported && (
        <div className="audio-bar">
          <button
            className={`audio-play ${speech.speaking ? 'playing' : ''}`}
            onClick={togglePlay}
            aria-label={
              speech.speaking && !speech.paused
                ? 'Pause'
                : 'Lire le cours à voix haute'
            }
          >
            {speech.speaking && !speech.paused ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="audio-info">
            <div className="audio-title">
              {speech.speaking
                ? speech.paused
                  ? '⏸ En pause'
                  : '🔊 Lecture en cours'
                : '🎧 Écouter le cours'}
            </div>
            <div className="audio-sub">
              {speech.speaking
                ? 'Touche pour mettre en pause'
                : 'Le cours te sera lu à voix haute'}
            </div>
          </div>
          {speech.speaking && (
            <button
              className="audio-stop"
              onClick={speech.stop}
              aria-label="Arrêter la lecture"
            >
              ✕
            </button>
          )}
          <button
            className="audio-settings"
            onClick={() => setShowVoices((s) => !s)}
            aria-label="Réglages"
          >
            ⚙
          </button>
        </div>
      )}

      {!lesson.embedUrl && !speech.supported && (
        <div className="empty" style={{ marginBottom: 16 }}>
          ℹ️ La lecture à voix haute n'est pas disponible sur ce navigateur.
        </div>
      )}

      {/* Panneau de réglages */}
      {!lesson.embedUrl && showVoices && speech.supported && (
        <div className="voice-panel">
          <div className="voice-row">
            <label>Vitesse</label>
            <div className="speed-buttons">
              {[0.75, 1, 1.25, 1.5].map((r) => (
                <button
                  key={r}
                  className={`speed-btn ${speech.rate === r ? 'active' : ''}`}
                  onClick={() => speech.setRate(r)}
                >
                  {r}×
                </button>
              ))}
            </div>
          </div>
          {speech.voices.filter((v) => v.lang.toLowerCase().startsWith('fr'))
            .length > 1 && (
            <div className="voice-row">
              <label>Voix</label>
              <select
                value={speech.currentVoice?.name ?? ''}
                onChange={(e) => {
                  const v = speech.voices.find(
                    (vv) => vv.name === e.target.value
                  )
                  if (v) speech.setVoice(v)
                }}
              >
                {speech.voices
                  .filter((v) => v.lang.toLowerCase().startsWith('fr'))
                  .map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Contenu du cours */}
      {!lesson.embedUrl && (
      <article className="lesson" style={{ ['--accent' as never]: subject.color } as React.CSSProperties}>
        <div className="lesson-intro">{lesson.intro}</div>

        {lesson.sections.map((s, i) => (
          <section key={i} className="lesson-section">
            <div className="lesson-section-header">
              <h3>{s.title}</h3>
              {speech.supported && (
                <button
                  className="speak-section"
                  onClick={() =>
                    speakSection(
                      `${s.title}. ${s.content} ${(s.terms ?? [])
                        .map((t) => `${t.term} : ${t.def}.`)
                        .join(' ')}`,
                    )
                  }
                  aria-label={`Écouter : ${s.title}`}
                  title="Écouter cette section"
                >
                  🔊
                </button>
              )}
            </div>
            <p>{s.content}</p>
            {s.svg && (
              <figure
                className="lesson-figure"
                aria-label={`Schéma : ${s.title}`}
                dangerouslySetInnerHTML={{ __html: s.svg }}
              />
            )}
            {s.terms && s.terms.length > 0 && (
              <dl className="terms-list">
                {s.terms.map((t, j) => (
                  <div className="term-item" key={j}>
                    <dt>{t.term}</dt>
                    <dd>{t.def}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}

        <section className="key-points">
          <h3>💡 À retenir</h3>
          <ul>
            {lesson.keyPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>

        {lesson.revision && !showRevision && (
          <button
            className="revision-toggle"
            onClick={() => setShowRevision(true)}
          >
            <span className="revision-toggle-icon">📋</span>
            <span className="revision-toggle-text">
              <span className="revision-toggle-title">
                Voir la fiche de révision
              </span>
              <span className="revision-toggle-sub">
                L'essentiel en 1 minute
              </span>
            </span>
            <span className="revision-toggle-arrow">▾</span>
          </button>
        )}

        {lesson.revision && showRevision && (
          <section className="revision-card">
            <div className="revision-header">
              <span className="revision-badge">📋 Fiche de révision</span>
              <span className="revision-sub">L'essentiel en 1 minute</span>
            </div>

            <div className="revision-flash">
              {lesson.revision.flash.map((f, i) => (
                <div className="revision-flash-item" key={i}>
                  <span className="rf-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {lesson.revision.reperes &&
              lesson.revision.reperes.length > 0 && (
                <div className="revision-reperes">
                  {lesson.revision.reperes.map((r, i) => (
                    <div className="repere" key={i}>
                      <div className="repere-label">{r.label}</div>
                      <div className="repere-value">{r.value}</div>
                    </div>
                  ))}
                </div>
              )}

            {lesson.revision.astuce && (
              <div className="revision-callout astuce">
                <span className="callout-icon">💡</span>
                <div>
                  <strong>Astuce</strong>
                  {lesson.revision.astuce}
                </div>
              </div>
            )}

            {lesson.revision.piege && (
              <div className="revision-callout piege">
                <span className="callout-icon">⚠️</span>
                <div>
                  <strong>Piège à éviter</strong>
                  {lesson.revision.piege}
                </div>
              </div>
            )}

            <button
              className="revision-hide"
              onClick={() => setShowRevision(false)}
            >
              Masquer la fiche ▴
            </button>
          </section>
        )}

        <div className="lesson-cta">
          <Link
            to={`/quiz/${subject.id}/${chapterId}`}
            className="btn-primary"
            onClick={() => speech.stop()}
          >
            ✅ Je passe au quiz
          </Link>
          <Link
            to={`/flashcards/${subject.id}/${chapterId}`}
            className="btn-secondary"
            onClick={() => speech.stop()}
          >
            🎴 Réviser en flashcards
          </Link>
        </div>

        {lesson.pdf && (
          <a
            className="lesson-pdf"
            href={lesson.pdf}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => speech.stop()}
          >
            <span className="lesson-pdf-icon">📄</span>
            <span className="lesson-pdf-text">
              <span className="lesson-pdf-title">Cours d'origine (PDF)</span>
              <span className="lesson-pdf-sub">
                La séquence complète distribuée en classe
              </span>
            </span>
            <span className="lesson-pdf-arrow">↗</span>
          </a>
        )}
      </article>
      )}
    </>
  )
}
