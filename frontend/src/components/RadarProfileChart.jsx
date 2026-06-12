import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts'

const CATEGORY_LABELS = {
  hallucination: 'Hallucination',
  jailbreak: 'Jailbreak',
  injection: 'Injection',
  toxicity: 'Toxicity',
  bias: 'Bias',
  rag_faithfulness: 'RAG Faith.',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { subject, value } = payload[0].payload
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs shadow-card">
      <div className="text-surface-300 font-semibold mb-0.5">{subject}</div>
      <div className="text-white font-tabular">{(value * 100).toFixed(0)}% safe</div>
    </div>
  )
}

export default function RadarProfileChart({ results, compareResults, modelLabel, compareLabel }) {
  const data = Object.entries(results || {}).map(([cat, val]) => ({
    subject: CATEGORY_LABELS[cat] || cat,
    primary: val?.score || 0,
    compare: compareResults?.[cat]?.score,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(51,65,85,0.6)" radialLines={true} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Inter, sans-serif' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name={modelLabel || 'Model'}
          dataKey="primary"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        {compareResults && (
          <Radar
            name={compareLabel || 'Compare'}
            dataKey="compare"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  )
}
