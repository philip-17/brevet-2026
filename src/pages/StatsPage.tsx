import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBJECTS } from '../data'
import {
  loadProgress,
  resetProgress,
  getSubjectStats,
} from '../storage/progress'

export default function StatsPage() {
  const [progress, setProgress] = useState(() => loadProgress())

  const totalsByPath = useMemo(() => {
    let totalChapters = 0
    let chaptersTouched = 0
    SUBJECTS.forEach((s) => {
      s.chapters.forEach((c) => {
        totalChapters++
        const key = `${s.id}/${c.id}`
        if (progress.chapters[key]?.played) chaptersTouched++
      })
    })
    return { totalChapters, chaptersTouched }
  }, [progress])

  const handleReset = () => {
    if (
      window.confirm(
        'Effacer toute la progression ? Cette action est irréversible.'
      )
    ) {
      resetProgress()
      setProgress(loadProgress())
    }
  }

  const overallPercent =
    progress.totalQuestions > 0
      ? Math.round((progress.totalCorrect / progress.totalQuestions) * 100)
      : 0

  return (
    <>
      <header className="page-header">
        <Link to="/" className="back-btn">
          ←
        </Link>
        <h1>📊 Mes statistiques</h1>
      </header>

      <div className="stats-summary">
        <div className="tile">
          <div className="num">{progress.totalQuestions}</div>
          <div className="lbl">Questions jouées</div>
        </div>
        <div className="tile">
          <div className="num">{overallPercent}%</div>
          <div className="lbl">Réussite globale</div>
        </div>
        <div className="tile">
          <div className="num">
            {totalsByPath.chaptersTouched}/{totalsByPath.totalChapters}
          </div>
          <div className="lbl">Chapitres vus</div>
        </div>
      </div>

      <h2 className="section-title">Détail par matière</h2>
      {SUBJECTS.map((s) => {
        const stats = getSubjectStats(progress, s.id)
        return (
          <div
            key={s.id}
            className="stat-tile"
            style={
              {
                ['--accent' as never]: s.color,
              } as React.CSSProperties
            }
          >
            <div className="name">
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </div>
            <div className="row">
              <span>{stats.played} questions jouées</span>
              <span>{stats.percent}% réussite</span>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${stats.percent}%` }} />
            </div>
          </div>
        )
      })}

      {progress.totalQuestions === 0 && (
        <div className="empty" style={{ marginTop: 20 }}>
          <div className="emoji">📚</div>
          Tu n'as pas encore joué. Choisis une matière et lance-toi !
        </div>
      )}

      <button
        className="btn-secondary"
        style={{ marginTop: 24 }}
        onClick={handleReset}
      >
        🗑️ Réinitialiser la progression
      </button>
    </>
  )
}
