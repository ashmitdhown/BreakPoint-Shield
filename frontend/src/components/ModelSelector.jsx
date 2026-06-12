import { useEffect, useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { getAvailableModels } from '../api/client'

const PROVIDER_COLORS = {
  groq: 'text-orange-400',
  openai: 'text-green-400',
  ollama: 'text-purple-400',
}

export default function ModelSelector({ value, onChange, compareMode, compareValue, onCompareChange }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAvailableModels()
      .then((data) => setModels(data.models || []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [])

  const renderSelect = (id, val, handler, label) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="section-label">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={val}
          onChange={(e) => handler(e.target.value)}
          className="w-full appearance-none bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 pr-10
                     text-surface-100 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60
                     transition-colors cursor-pointer"
        >
          <option value="">Select a model...</option>
          {loading && <option disabled>Loading models...</option>}
          {Object.entries(
            models.reduce((acc, m) => {
              acc[m.provider] = acc[m.provider] || []
              acc[m.provider].push(m)
              return acc
            }, {})
          ).map(([provider, providerModels]) => (
            <optgroup key={provider} label={provider.toUpperCase()}>
              {providerModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-surface-500">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {renderSelect('model-primary', value, onChange, 'Target Model')}
      {compareMode && renderSelect('model-compare', compareValue, onCompareChange, 'Comparison Model')}
    </div>
  )
}
