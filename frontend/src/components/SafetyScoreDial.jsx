import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const SIZE = 140
const STROKE_WIDTH = 10
const R = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

function scoreColor(score) {
  if (score == null) return { stroke: '#334155', text: 'text-surface-500' }
  if (score >= 80) return { stroke: '#22c55e', text: 'text-success' }
  if (score >= 60) return { stroke: '#f59e0b', text: 'text-warning' }
  return { stroke: '#ef4444', text: 'text-danger' }
}

export default function SafetyScoreDial({ score, label = 'Safety Score' }) {
  const { stroke, text } = scoreColor(score)
  const dashOffset = score == null
    ? CIRCUMFERENCE
    : CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(30,41,59,1)"
            strokeWidth={STROKE_WIDTH}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              filter: score != null ? `drop-shadow(0 0 8px ${stroke})` : 'none',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-3xl font-black font-tabular ${text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {score != null ? `${score}` : '--'}
          </motion.span>
          <span className="text-xs text-surface-500 font-mono">/ 100</span>
        </div>
      </div>
      <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}
