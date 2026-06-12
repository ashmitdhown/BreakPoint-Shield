import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download, RotateCcw, Plus, Share2,
  AlertTriangle, Clock, Target, Shield, Loader2
} from 'lucide-react'
import { getEvalResults, getPDFReportUrl } from '../api/client'
import SafetyScoreDial from '../components/SafetyScoreDial'
import FailureRateChart from '../components/FailureRateChart'
import RadarProfileChart from '../components/RadarProfileChart'
import DeltaCompareChart from '../components/DeltaCompareChart'
import ComparisonTable from '../components/ComparisonTable'
import PromptResultsTable from '../components/PromptResultsTable'

function StatCard({ icon: Icon, label, value, sub, color = 'text-surface-50', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="stat-card"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-surface-500" />
        <span className="label">{label}</span>
      </div>
      <div className={`value ${color}`}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </motion.div>
  )
}

function Section({ title, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <h2 className="section-label mb-4">{title}</h2>
      {children}
    </motion.section>
  )
}

function highestRiskCategory(results) {
  if (!results) return null
  let worst = null
  let worstRate = -1
  for (const [cat, data] of Object.entries(results)) {
    if ((data?.failure_rate || 0) > worstRate) {
      worstRate = data.failure_rate
      worst = cat
    }
  }
  return worst
    ? {
        label: worst.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        rate: worstRate,
      }
    : null
}

export default function ResultsPage() {
  const { runId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getEvalResults(runId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [runId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-mono">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-sm">
          <AlertTriangle size={28} className="text-warning mx-auto mb-3" />
          <p className="text-surface-200 font-semibold mb-1">Results not found</p>
          <p className="text-surface-500 text-sm mb-4">{error}</p>
          <Link to="/" className="btn-primary">Start new evaluation</Link>
        </div>
      </div>
    )
  }

  if (data.status === 'running' || data.status === 'queued') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-sm">
          <Loader2 size={28} className="animate-spin text-accent mx-auto mb-3" />
          <p className="text-surface-200 font-semibold mb-1">Evaluation in progress</p>
          <p className="text-surface-500 text-sm mb-4">
            Results will be available when the run completes.
          </p>
          <button onClick={() => navigate(`/eval/${runId}`)} className="btn-primary">
            Watch live
          </button>
        </div>
      </div>
    )
  }

  const { results, compare_results, iterative_results, model_id, compare_model_id } = data
  const risk = highestRiskCategory(results)
  const totalPrompts = Object.values(results || {}).reduce((s, c) => s + (c?.total || 0), 0)
  const scoreColor = data.overall_score >= 80 ? 'score-green' : data.overall_score >= 60 ? 'score-yellow' : 'score-red'

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).catch(() => {})
  }

  return (
    <div className="page-container flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Evaluation Results</h1>
          <p className="text-sm text-surface-500 mt-1 font-mono">
            {model_id} &nbsp;·&nbsp; Run {runId?.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="btn-ghost text-xs gap-1.5" id="share-results-btn">
            <Share2 size={13} />
            Share
          </button>
          <a
            href={getPDFReportUrl(runId)}
            download
            className="btn-ghost text-xs gap-1.5"
            id="download-pdf-btn"
          >
            <Download size={13} />
            PDF Report
          </a>
          <Link to="/" className="btn-primary text-sm gap-1.5" id="new-eval-btn">
            <Plus size={14} />
            New Evaluation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 md:col-span-1 flex justify-center">
          <SafetyScoreDial score={data.overall_score} label="Overall Score" />
        </div>
        <StatCard
          icon={Target}
          label="Prompts Tested"
          value={totalPrompts.toLocaleString()}
          sub="across all categories"
          delay={0.1}
        />
        <StatCard
          icon={AlertTriangle}
          label="Highest Risk"
          value={risk?.label || 'N/A'}
          sub={risk ? `${(risk.rate * 100).toFixed(0)}% failure rate` : ''}
          color="text-warning"
          delay={0.15}
        />
        <StatCard
          icon={Clock}
          label="Total Runtime"
          value={`${data.duration_seconds}s`}
          sub={`~${((data.duration_seconds || 0) / 60).toFixed(1)} min`}
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Failure Rate by Category" delay={0.25}>
          <div className="glass-card p-5">
            <FailureRateChart results={results} />
          </div>
        </Section>
        <Section title="Safety Profile Radar" delay={0.3}>
          <div className="glass-card p-5">
            <RadarProfileChart
              results={results}
              compareResults={compare_results}
              modelLabel={model_id?.split(':').pop()}
              compareLabel={compare_model_id?.split(':').pop()}
            />
          </div>
        </Section>
      </div>

      {iterative_results?.round1 && (
        <Section title="Iterative Red-Teaming — Round Comparison" delay={0.35}>
          <div className="glass-card p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="badge badge-accent">
                {iterative_results.generated_prompt_count} adversarial prompts generated
              </div>
              {Object.entries(iterative_results.round1 || {}).map(([cat, r1]) => {
                const r2 = iterative_results.round2?.[cat]
                if (r2 == null) return null
                const delta = ((r1 - r2) * 100).toFixed(0)
                return (
                  <span key={cat} className="text-xs text-surface-400">
                    <span className="font-semibold text-surface-200">
                      {cat.replace(/_/g, ' ')}:
                    </span>{' '}
                    <span className="text-success font-mono">-{delta}%</span>
                  </span>
                )
              })}
            </div>
            <DeltaCompareChart iterativeResults={iterative_results} />
          </div>
        </Section>
      )}

      {compare_results && (
        <Section title="Model Comparison" delay={0.4}>
          <ComparisonTable
            results={results}
            compareResults={compare_results}
            modelId={model_id}
            compareModelId={compare_model_id}
          />
        </Section>
      )}

      <Section title="Worst Performing Prompts" delay={0.45}>
        <PromptResultsTable results={results} />
      </Section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 pb-4"
      >
        <button
          onClick={() => navigate('/')}
          className="btn-ghost gap-1.5 text-sm"
          id="run-again-btn"
        >
          <RotateCcw size={14} />
          Run Again
        </button>
      </motion.div>
    </div>
  )
}
