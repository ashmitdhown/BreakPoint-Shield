import { useEffect, useRef } from 'react'

const TYPE_STYLES = {
  pass: 'text-success',
  fail: 'text-danger',
  info: 'text-accent',
}

const TYPE_PREFIX = {
  pass: '✓',
  fail: '✗',
  info: '▸',
}

const CAT_LABEL = {
  hallucination: 'hall',
  jailbreak: 'jail',
  injection: 'inject',
  toxicity: 'tox',
  bias: 'bias',
  rag_faithfulness: 'rag',
  system: 'sys',
}

export default function LiveLogFeed({ entries }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries])

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-surface-925 rounded-xl border border-surface-800 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-800 bg-surface-900">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs font-mono text-surface-500 ml-1">eval.log</span>
        </div>
        <span className="text-xs font-mono text-surface-600">{entries.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5 min-h-0">
        {entries.length === 0 && (
          <div className="text-surface-600 pt-4 text-center">
            Waiting for evaluation to start
            <span className="animate-terminal-blink ml-0.5">_</span>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-2 items-start leading-5">
            <span className="text-surface-700 shrink-0 w-16 truncate">
              {new Date(entry.ts).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className={`shrink-0 w-12 ${TYPE_STYLES[entry.type] || 'text-surface-400'}`}>
              [{CAT_LABEL[entry.category] || entry.category}]
            </span>
            <span className={`${TYPE_STYLES[entry.type] || 'text-surface-400'} shrink-0 w-3`}>
              {TYPE_PREFIX[entry.type] || '·'}
            </span>
            <span className="text-surface-400 truncate min-w-0">{entry.prompt}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
