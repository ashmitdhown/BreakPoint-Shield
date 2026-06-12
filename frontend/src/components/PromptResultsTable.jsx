import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Eye, EyeOff } from 'lucide-react'

const CATEGORY_LABELS = {
  hallucination: 'Hallucination',
  jailbreak: 'Jailbreak',
  injection: 'Injection',
  toxicity: 'Toxicity',
  bias: 'Bias',
  rag_faithfulness: 'RAG Faith.',
}

const PAGE_SIZE = 10

function flattenFailures(results) {
  const rows = []
  for (const [cat, data] of Object.entries(results || {})) {
    for (const pr of data?.prompt_results || []) {
      if (!pr.passed) {
        rows.push({ ...pr, category: cat })
      }
    }
  }
  return rows
}

function exportCSV(rows) {
  const header = ['Category', 'Prompt', 'Response', 'Failure Type']
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.category,
        `"${(r.prompt || '').replace(/"/g, '""')}"`,
        `"${(r.response || '').replace(/"/g, '""').slice(0, 200)}"`,
        r.failure_type || '',
      ].join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'redteam-failures.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function ResponseCell({ text }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="flex items-start gap-2">
      <span
        className={`text-xs text-surface-400 leading-relaxed flex-1 max-w-xs transition-all duration-200 ${
          !revealed ? 'blur-sm select-none' : ''
        }`}
      >
        {(text || '').slice(0, 200)}{text?.length > 200 ? '...' : ''}
      </span>
      <button
        onClick={() => setRevealed((v) => !v)}
        className="shrink-0 text-surface-600 hover:text-surface-300 transition-colors mt-0.5"
        title={revealed ? 'Hide' : 'Reveal'}
      >
        {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

export default function PromptResultsTable({ results }) {
  const [page, setPage] = useState(0)
  const rows = flattenFailures(results)
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-400">
          <span className="text-surface-200 font-semibold font-tabular">{rows.length}</span> failures found
        </p>
        <button
          onClick={() => exportCSV(rows)}
          className="btn-ghost text-xs gap-1.5"
          id="export-csv-btn"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-28">Category</th>
              <th>Prompt</th>
              <th>Response</th>
              <th className="w-32">Failure Type</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-surface-500 text-sm">
                  No failures recorded
                </td>
              </tr>
            )}
            {pageRows.map((row, i) => (
              <tr key={i}>
                <td className="px-4 py-3.5 border-b border-surface-800/60">
                  <span className="badge badge-danger text-xs">
                    {CATEGORY_LABELS[row.category] || row.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 border-b border-surface-800/60 max-w-xs">
                  <p className="text-xs text-surface-400 truncate-2 leading-relaxed">{row.prompt}</p>
                </td>
                <td className="px-4 py-3.5 border-b border-surface-800/60">
                  <ResponseCell text={row.response} />
                </td>
                <td className="px-4 py-3.5 border-b border-surface-800/60">
                  <span className="text-xs font-mono text-danger">{row.failure_type || 'unknown'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-500 text-xs font-mono">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost px-2.5 py-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-ghost px-2.5 py-1.5 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
