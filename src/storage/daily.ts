/**
 * Suivi de l'activité quotidienne : objectif du jour + streak (jours
 * d'affilée). 100 % local (localStorage), comme le reste de l'app.
 */

const KEY = 'brevet-boost:daily:v1'
const DEFAULT_GOAL = 20

interface DailyStore {
  days: Record<string, number> // 'YYYY-MM-DD' -> nombre de questions répondues
  goal: number // objectif quotidien
  bestStreak: number
  bestExam: { note20: number; percent: number; date: string } | null
}

export interface DailyStats {
  todayCount: number
  goal: number
  streak: number
  bestStreak: number
  goalReachedToday: boolean
  bestExam: { note20: number; percent: number; date: string } | null
}

// ─── Dates (locales) ───

function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function today(): string {
  return fmt(new Date())
}

// ─── Persistance ───

function empty(): DailyStore {
  return { days: {}, goal: DEFAULT_GOAL, bestStreak: 0, bestExam: null }
}

function load(): DailyStore {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as DailyStore
    if (!parsed || typeof parsed !== 'object' || !parsed.days) return empty()
    return {
      days: parsed.days ?? {},
      goal: parsed.goal ?? DEFAULT_GOAL,
      bestStreak: parsed.bestStreak ?? 0,
      bestExam: parsed.bestExam ?? null,
    }
  } catch {
    return empty()
  }
}

function save(store: DailyStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

// ─── Calcul du streak ───

function computeStreak(days: Record<string, number>): number {
  const cursor = new Date()
  // Si rien aujourd'hui, on regarde à partir d'hier (jour de grâce :
  // le streak ne casse pas tant qu'on n'a pas raté une journée entière)
  if (!days[fmt(cursor)]) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days[fmt(cursor)]) return 0
  }
  let streak = 0
  while (days[fmt(cursor)]) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ─── API publique ───

export function loadDailyStats(): DailyStats {
  const store = load()
  const t = today()
  const todayCount = store.days[t] ?? 0
  const streak = computeStreak(store.days)
  return {
    todayCount,
    goal: store.goal,
    streak,
    bestStreak: Math.max(store.bestStreak, streak),
    goalReachedToday: todayCount >= store.goal,
    bestExam: store.bestExam,
  }
}

/** Enregistre `count` questions répondues aujourd'hui. */
export function recordDailyActivity(count: number): DailyStats {
  if (!count || count <= 0) return loadDailyStats()
  const store = load()
  const t = today()
  store.days[t] = (store.days[t] ?? 0) + count
  const streak = computeStreak(store.days)
  store.bestStreak = Math.max(store.bestStreak, streak)
  save(store)
  return loadDailyStats()
}

/** Change l'objectif quotidien. */
export function setDailyGoal(goal: number): DailyStats {
  const store = load()
  store.goal = Math.max(5, Math.min(200, Math.round(goal)))
  save(store)
  return loadDailyStats()
}

/** Enregistre le résultat d'un examen blanc s'il bat le record. */
export function recordExamResult(note20: number, percent: number): void {
  const store = load()
  if (!store.bestExam || note20 > store.bestExam.note20) {
    store.bestExam = { note20, percent, date: today() }
    save(store)
  }
}

export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50]
