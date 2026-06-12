import { motion } from 'framer-motion'
import {
  Brain, ShieldOff, Terminal, AlertTriangle, Scale, FileSearch,
  CheckCircle2, XCircle, Clock, Loader2
} from 'lucide-react'

const ICON_MAP = {
  hallucination: Brain,
  jailbreak: ShieldOff,
  injection: Terminal,
  toxicity: AlertTriangle,
  bias: Scale,
  rag_faithfulness: FileSearch,
}

const LABEL_MAP = {
  hallucination: 'Hallucination',
  jailbreak: 'Jailbreak',
  injection: 'Injection',
  toxicity: 'Toxicity',
  bias: 'Bias',
  rag_faithfulness: 'RAG Faithfulness',
}

function scoreColor(score) {
  if (score == null) return 'text-surface-400'
  const pct = score * 100
  if (pct >= 80) return 'text-success'
  if (pct >= 60) return 'text-warning'
  return 'text-danger'
}

function scoreBadgeClass(score) {
  if (score == null) return 'badge-neutral'
  const pct = score * 100
  if (pct >= 80) return 'badge-success'
  if (pct >= 60) return 'badge-warning'
  return 'badge-danger'
}

export default function CategoryCard({ categoryId, state, index = 0 }) {
  const Icon = ICON_MAP[categoryId] || Brain
  const label = LABEL_MAP[categoryId] || categoryId
  const { status, current, total, score, latestPrompt } = state || {}

  const progressPct = total > 0 ? Math.round((current / total) * 100) : 0

  const StatusIcon = () => {
    if (status === 'complete') {
      return score >= 0.8
        ? <CheckCircle2 size={14} className="text-success" />
        : <XCircle size={14} className="text-danger" />
    }
    if (status === 'running') return <Loader2 size={14} className="text-accent animate-spin" />
    return <Clock size={14} className="text-surface-600" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={`glass-card p-4 flex flex-col gap-3 transition-all duration-300 ${
        status === 'running' ? 'border-accent/30 shadow-glow-blue/20' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            status === 'running'
              ? 'bg-accent/15 border border-accent/30'
              : status === 'complete'
              ? 'bg-surface-800 border border-surface-700'
              : 'bg-surface-800/60 border border-surface-700/40'
          }`}>
            <Icon size={15} className={status === 'running' ? 'text-accent' : 'text-surface-400'} />
          </div>
          <div>
            <div className="text-sm font-semibold text-surface-200 leading-none">{label}</div>
            <div className="text-xs text-surface-500 mt-0.5 font-mono">
              {status === 'running' && total > 0 ? `${current}/${total} prompts` : status}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon />
          {status === 'complete' && score != null && (
            <span className={`badge ${scoreBadgeClass(score)} font-tabular`}>
              {Math.round(score * 100)}%
            </span>
          )}
        </div>
      </div>

      {status === 'running' && (
        <>
          <div className="progress-bar-track">
            <motion.div
              className="progress-bar-fill bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {latestPrompt && (
            <p className="text-xs text-surface-500 font-mono truncate" title={latestPrompt}>
              <span className="text-surface-600 mr-1">›</span>{latestPrompt}
            </p>
          )}
        </>
      )}

      {status === 'complete' && score != null && (
        <div className="flex items-center gap-2">
          <div className="progress-bar-track flex-1">
            <motion.div
              className={`progress-bar-fill ${
                score >= 0.8 ? 'bg-success' : score >= 0.6 ? 'bg-warning' : 'bg-danger'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(score * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className={`text-xs font-semibold font-tabular ${scoreColor(score)}`}>
            {Math.round((1 - score) * 100)}% fail
          </span>
        </div>
      )}
    </motion.div>
  )
}
