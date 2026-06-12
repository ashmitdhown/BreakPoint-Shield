import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts'

const CATEGORY_LABELS = {
  hallucination: 'Hallucination',
  jailbreak: 'Jailbreak',
  injection: 'Injection',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs shadow-card">
      <div className="text-surface-300 font-semibold mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }} className="font-tabular">
          {p.name}: {(p.value * 100).toFixed(1)}% failure
        </div>
      ))}
    </div>
  )
}

export default function DeltaCompareChart({ iterativeResults }) {
  if (!iterativeResults?.round1 || !iterativeResults?.round2) return null

  const cats = iterativeResults.categories_retested || []
  const data = cats.map((cat) => ({
    name: CATEGORY_LABELS[cat] || cat,
    'Round 1': iterativeResults.round1[cat] || 0,
    'Round 2': iterativeResults.round2[cat] || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
        />
        <Bar dataKey="Round 1" fill="rgba(100,116,139,0.6)" radius={[3, 3, 0, 0]} maxBarSize={32} />
        <Bar dataKey="Round 2" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={32}>
          <LabelList
            dataKey="Round 2"
            position="top"
            formatter={(v) => `${(v * 100).toFixed(0)}%`}
            style={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
