import type { Question } from '../types'
import { LEVEL_META, type Level } from '../utils/levels'

// Écran de choix du niveau (calcul mental) : affiché avant le quiz /
// les flashcards quand les questions du chapitre ont une difficulté.

interface Props {
  questions: Question[]
  accentColor: string
  onSelect: (level: Level) => void
}

export default function LevelPicker({ questions, accentColor, onSelect }: Props) {
  const count = (l: 1 | 2 | 3) => questions.filter((q) => q.difficulty === l).length

  return (
    <div
      className="level-picker"
      style={{ ['--accent' as never]: accentColor } as React.CSSProperties}
    >
      <h2>Choisis ton niveau</h2>
      <p className="level-picker-sub">
        Les calculs sont classés du plus simple au plus dur.
      </p>

      <div className="level-list">
        {LEVEL_META.map((l) => (
          <button
            key={l.value}
            className={`level-btn level-${l.value}`}
            onClick={() => onSelect(l.value)}
            disabled={count(l.value) === 0}
          >
            <span className="level-emoji">{l.emoji}</span>
            <span className="level-text">
              <span className="level-label">{l.label}</span>
              <span className="level-desc">{l.desc}</span>
            </span>
            <span className="level-count">{count(l.value)} Q</span>
          </button>
        ))}

        <button className="level-btn level-all" onClick={() => onSelect('all')}>
          <span className="level-emoji">🌈</span>
          <span className="level-text">
            <span className="level-label">Tout mélangé</span>
            <span className="level-desc">Tous les niveaux en vrac</span>
          </span>
          <span className="level-count">{questions.length} Q</span>
        </button>
      </div>
    </div>
  )
}
