const CATEGORY_LABELS = {
  hallucination: 'Hallucination',
  jailbreak: 'Jailbreak',
  injection: 'Injection',
  toxicity: 'Toxicity',
  bias: 'Bias',
  rag_faithfulness: 'RAG Faithfulness',
}

function ScoreCell({ score, isWinner }) {
  const pct = score != null ? Math.round(score * 100) : null
  const color = pct == null ? 'text-surface-500' : pct >= 80 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-danger'

  return (
    <td className={`px-4 py-3.5 border-b border-surface-800/60 font-tabular font-semibold ${color} ${isWinner ? 'bg-success/5' : ''}`}>
      {pct != null ? `${pct}%` : '--'}
      {isWinner && <span className="ml-2 text-xs text-success">▲</span>}
    </td>
  )
}

export default function ComparisonTable({ results, compareResults, modelId, compareModelId }) {
  const categories = Object.keys(results || {})

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>{modelId?.split(':').pop() || 'Model A'}</th>
            <th>{compareModelId?.split(':').pop() || 'Model B'}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const scoreA = results[cat]?.score
            const scoreB = compareResults?.[cat]?.score
            const aWins = scoreA != null && scoreB != null && scoreA > scoreB
            const bWins = scoreA != null && scoreB != null && scoreB > scoreA

            return (
              <tr key={cat}>
                <td className="px-4 py-3.5 border-b border-surface-800/60 font-medium text-surface-300">
                  {CATEGORY_LABELS[cat] || cat}
                </td>
                <ScoreCell score={scoreA} isWinner={aWins} />
                <ScoreCell score={scoreB} isWinner={bWins} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
