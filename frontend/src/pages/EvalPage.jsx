import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { useEvalStore } from '../store/evalStore'
import { useWebSocket } from '../hooks/useWebSocket'
import CategoryCard from '../components/CategoryCard'
import LiveLogFeed from '../components/LiveLogFeed'
import SafetyScoreDial from '../components/SafetyScoreDial'

function ElapsedTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return (
    <span className="font-mono text-surface-400 text-sm tabular-nums">
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

function WsStatusDot({ status }) {
  if (status === 'connected') return <Wifi size={13} className="text-success" />
  if (status === 'error') return <AlertCircle size={13} className="text-danger" />
  return <WifiOff size={13} className="text-surface-600 animate-pulse" />
}

export default function EvalPage() {
  const { runId } = useParams()
  const navigate = useNavigate()
  const { disconnect } = useWebSocket(runId)

  const currentRun = useEvalStore((s) => s.currentRun)
  const categoryStates = useEvalStore((s) => s.categoryStates)
  const logEntries = useEvalStore((s) => s.logEntries)
  const overallScore = useEvalStore((s) => s.overallScore)
  const wsStatus = useEvalStore((s) => s.wsStatus)
  const errorMessage = useEvalStore((s) => s.errorMessage)
  const reset = useEvalStore((s) => s.reset)

  useEffect(() => {
    if (overallScore != null) {
      const timer = setTimeout(() => {
        disconnect()
        navigate(`/results/${runId}`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [overallScore, runId, navigate, disconnect])

  const handleCancel = () => {
    disconnect()
    reset()
    navigate('/')
  }

  const categories = currentRun?.categories || Object.keys(categoryStates)
  const completedCount = Object.values(categoryStates).filter((s) => s.status === 'complete').length
  const totalCount = categories.length

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-surface-800 bg-surface-925/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-surface-200">
                  {currentRun?.modelId || 'Evaluation Run'}
                </h1>
                <WsStatusDot status={wsStatus} />
              </div>
              <div className="text-xs text-surface-500 mt-0.5 font-mono">
                {completedCount}/{totalCount} categories complete
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentRun?.startTime && <ElapsedTimer startTime={currentRun.startTime} />}
            <button
              id="cancel-eval-btn"
              onClick={handleCancel}
              className="btn-ghost gap-1.5 text-xs"
            >
              <X size={13} />
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 page-container">
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-3 bg-danger/10 border border-danger/25 rounded-xl px-4 py-3"
          >
            <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-danger">Evaluation failed</p>
              <p className="text-xs text-surface-400 mt-0.5 font-mono">{errorMessage}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 h-full">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center py-4">
              <SafetyScoreDial
                score={overallScore}
                label={overallScore != null ? 'Final Score' : 'Live Score'}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((catId, idx) => (
                <CategoryCard
                  key={catId}
                  categoryId={catId}
                  state={categoryStates[catId]}
                  index={idx}
                />
              ))}
            </div>

            {overallScore != null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-4 text-center border-accent/30"
              >
                <p className="text-sm font-semibold text-surface-200">
                  Evaluation complete — redirecting to results...
                </p>
              </motion.div>
            )}
          </div>

          <div className="lg:min-h-[500px] h-[400px] lg:h-auto">
            <LiveLogFeed entries={logEntries} />
          </div>
        </div>
      </div>
    </div>
  )
}
