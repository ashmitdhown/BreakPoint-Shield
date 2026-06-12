import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const CATEGORY_LABELS = {
  hallucination: 'Hallucination',
  jailbreak: 'Jailbreak',
  injection: 'Injection',
  toxicity: 'Toxicity',
  bias: 'Bias',
  rag_faithfulness: 'RAG Faith.',
}

function barColor(rate) {
  if (rate <= 0.15) return '#22c55e'
  if (rate <= 0.30) return '#f59e0b'
  return '#ef4444'
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs shadow-card">
      <div className="text-surface-300 font-semibold mb-0.5">{name}</div>
      <div className="text-white font-tabular">{(value * 100).toFixed(1)}% failure rate</div>
    </div>
  )
}

export default function FailureRateChart({ results }) {
  const data = Object.entries(results || {}).map(([cat, val]) => ({
    name: CATEGORY_LABELS[cat] || cat,
    value: val?.failure_rate || 0,
    category: cat,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 1]}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={82}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={barColor(entry.value)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
