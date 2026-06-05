import { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SubjectPage from './pages/SubjectPage'
import QuizPage from './pages/QuizPage'
import FlashcardsPage from './pages/FlashcardsPage'
import StatsPage from './pages/StatsPage'
import CultureGPage from './pages/CultureGPage'
import LessonPage from './pages/LessonPage'
import ExamPage from './pages/ExamPage'
import AdminPage from './pages/AdminPage'
import './App.css'

// Remonte QuizPage à chaque changement de matière/chapitre, pour repartir d'un
// état propre (évite un état de série/index figé en passant d'un quiz à un autre).
function QuizRoute() {
  const { subjectId, chapterId } = useParams()
  return <QuizPage key={`${subjectId}/${chapterId}`} />
}

export default function App() {
  // Journal de connexion : un ping à l'ouverture du site (sauf la page admin).
  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/admin')) return
    fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'visit', page: path }),
      keepalive: true,
    }).catch(() => {})
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/stats"
        element={
          <div className="app-shell">
            <StatsPage />
          </div>
        }
      />
      <Route path="/culture-g" element={<CultureGPage />} />
      <Route
        path="/exam"
        element={
          <div className="app-shell">
            <ExamPage />
          </div>
        }
      />
      <Route
        path="/subject/:subjectId"
        element={
          <div className="app-shell">
            <SubjectPage />
          </div>
        }
      />
      <Route
        path="/lesson/:subjectId/:chapterId"
        element={
          <div className="app-shell">
            <LessonPage />
          </div>
        }
      />
      <Route
        path="/quiz/:subjectId/:chapterId"
        element={
          <div className="app-shell">
            <QuizRoute />
          </div>
        }
      />
      <Route
        path="/flashcards/:subjectId/:chapterId"
        element={
          <div className="app-shell">
            <FlashcardsPage />
          </div>
        }
      />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
