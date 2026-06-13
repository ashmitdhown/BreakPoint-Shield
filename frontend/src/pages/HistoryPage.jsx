import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Search, Trash2, ChevronRight, Loader2, History, AlertTriangle, X } from 'lucide-react'
import { getHistory, deleteRun, deleteAllHistory } from '../api/client'

function scoreColor(score) {
  if (score == null) return 'text-surface-500'
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-danger'
}

function scoreBadge(score) {
  if (score == null) return 'badge-neutral'
  if (score >= 80) return 'badge-success'
  if (score >= 60) return 'badge-warning'
  return 'badge-danger'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)

  const fetchHistory = () => {
    setLoading(true)
    getHistory()
      .then((data) => setRuns(data.runs || []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleDelete = async (e, runId) => {
    e.stopPropagation()
    setDeleting(runId)
    try {
      await deleteRun(runId)
      setRuns((prev) => prev.filter((r) => r.run_id !== runId))
    } catch {
      // silently ignore
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAll = async () => {
    setClearingAll(true)
    try {
      await deleteAllHistory()
      setRuns((prev) => prev.filter((r) => r.run_id === 'sample-demo-run-0001' || r.run_id === 'sample_run'))
    } catch {
      // silently ignore
    } finally {
      setClearingAll(false)
      setClearConfirm(false)
    }
  }

  const deletableRuns = runs.filter(
    (r) => r.run_id !== 'sample-demo-run-0001' && r.run_id !== 'sample_run'
  )

  const filtered = runs.filter(
    (r) =>
      !search ||
      (r.model_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.run_id || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Evaluation History</h1>
          <p className="text-sm text-surface-500 mt-1">
            {runs.length} run{runs.length !== 1 ? 's' : ''} recorded
          </p>
        </div>

        {deletableRuns.length > 0 && (
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {clearConfirm ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm text-surface-400">Delete {deletableRuns.length} run{deletableRuns.length !== 1 ? 's' : ''}?</span>
                  <button
                    id="confirm-clear-all-btn"
                    onClick={handleClearAll}
                    disabled={clearingAll}
                    className="btn-ghost text-sm text-danger hover:bg-danger/10 px-3 py-1.5 border border-danger/30"
                  >
                    {clearingAll
                      ? <Loader2 size={13} className="animate-spin" />
                      : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setClearConfirm(false)}
                    className="btn-ghost px-2 py-1.5 text-surface-500"
                    id="cancel-clear-all-btn"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  id="clear-all-history-btn"
                  onClick={() => setClearConfirm(true)}
                  className="btn-ghost text-sm text-danger hover:bg-danger/10 flex items-center gap-1.5 px-3 py-1.5 border border-danger/20"
                >
                  <Trash2 size={13} />
                  Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
        <input
          id="history-search"
          type="text"
          placeholder="Search by model or run ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-surface-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-500 gap-3">
          <History size={32} className="text-surface-700" />
          <p className="text-sm">{search ? 'No runs match your search.' : 'No runs recorded yet.'}</p>
          {!search && (
            <button onClick={() => navigate('/')} className="btn-primary text-sm mt-2">
              Run your first evaluation
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Score</th>
                <th>Categories</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Run ID</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((run, idx) => (
                <motion.tr
                  key={run.run_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => navigate(`/results/${run.run_id}`)}
                  className="cursor-pointer group"
                >
                  <td className="px-4 py-3.5 border-b border-surface-800/60">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-surface-200">
                        {run.model_id?.split(':').pop() || run.model_id}
                      </span>
                      {run.run_id === 'sample-demo-run-0001' && (
                        <span className="badge badge-accent text-xs">demo</span>
                      )}
                      {run.iterative_mode && (
                        <span className="badge badge-neutral text-xs">iterative</span>
                      )}
                    </div>
                    <div className="text-xs text-surface-600 mt-0.5">
                      {run.model_id?.split(':')[0] || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 border-b border-surface-800/60">
                    <span className={`badge ${scoreBadge(run.overall_score)} font-tabular`}>
                      {run.overall_score != null ? `${run.overall_score}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-surface-800/60">
                    <span className="text-surface-400 text-sm font-tabular">
                      {(run.categories || []).length}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-surface-800/60">
                    <span className="font-mono text-sm text-surface-400">
                      {run.duration_seconds != null ? `${run.duration_seconds}s` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-surface-800/60">
                    <span className="text-sm text-surface-400">{formatDate(run.start_time)}</span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-surface-800/60">
                    <span className="font-mono text-xs text-surface-600">{run.run_id?.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-surface-800/60">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {run.run_id !== 'sample-demo-run-0001' && run.run_id !== 'sample_run' && (
                        <button
                          onClick={(e) => handleDelete(e, run.run_id)}
                          disabled={deleting === run.run_id}
                          className="btn-ghost px-2 py-1 text-danger hover:bg-danger/10"
                          title="Delete run"
                          id={`delete-run-${run.run_id?.slice(0, 8)}`}
                        >
                          {deleting === run.run_id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />
                          }
                        </button>
                      )}
                      <ChevronRight size={12} className="text-surface-600" />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
