import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SubjectPage from './pages/SubjectPage'
import QuizPage from './pages/QuizPage'
import FlashcardsPage from './pages/FlashcardsPage'
import StatsPage from './pages/StatsPage'
import CultureGPage from './pages/CultureGPage'
import LessonPage from './pages/LessonPage'
import ExamPage from './pages/ExamPage'
import './App.css'

export default function App() {
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
            <QuizPage />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
