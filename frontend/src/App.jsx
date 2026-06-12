import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import EvalPage from './pages/EvalPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-950">
      <NavBar />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/eval/:runId" element={<EvalPage />} />
          <Route path="/results/:runId" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  )
}
