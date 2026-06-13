import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import EvalPage from './pages/EvalPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'

const REFERENCES = [
  {
    label: 'TruthfulQA',
    href: 'https://arxiv.org/abs/2109.07958',
  },
  {
    label: 'AdvBench',
    href: 'https://arxiv.org/abs/2307.15043',
  },
  {
    label: 'MART Framework',
    href: 'https://arxiv.org/abs/2311.07689',
  },
  {
    label: 'JailbreakBench',
    href: 'https://arxiv.org/abs/2404.01318',
  },
]

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
      <footer className="border-t border-surface-800/60 bg-surface-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-surface-400 tracking-widest uppercase">
              BreakPoint
            </span>
            <span className="text-surface-700 text-xs">v2.0</span>
            <span className="w-px h-3 bg-surface-700" />
            <a
              href="https://github.com/YOUR_USERNAME/breakpoint-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-surface-600 hover:text-accent transition-colors"
              id="footer-github-link"
            >
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-1 text-xs text-surface-700">
            <span className="mr-2 text-surface-600">Research references:</span>
            {REFERENCES.map((ref, idx) => (
              <span key={ref.label} className="flex items-center gap-1">
                <a
                  href={ref.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`footer-ref-${ref.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="hover:text-accent transition-colors"
                >
                  {ref.label}
                </a>
                {idx < REFERENCES.length - 1 && <span className="text-surface-800">·</span>}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
