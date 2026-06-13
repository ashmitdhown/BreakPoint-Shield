import { useEffect, useState } from 'react'
import { ChevronDown, Loader2, Link as LinkIcon, X } from 'lucide-react'
import { getAvailableModels } from '../api/client'

const PROVIDER_COLORS = {
  groq: 'text-orange-400',
  openai: 'text-green-400',
  ollama: 'text-purple-400',
  custom: 'text-sky-400',
}

const CUSTOM_OPTION_VALUE = '__custom__'

export default function ModelSelector({
  value,
  onChange,
  onCustomConfig,
  compareMode,
  compareValue,
  onCompareChange,
  onCompareCustomConfig,
}) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCustom, setShowCustom] = useState(false)
  const [showCompareCustom, setShowCompareCustom] = useState(false)
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [customModelName, setCustomModelName] = useState('')
  const [compareCustomBaseUrl, setCompareCustomBaseUrl] = useState('')
  const [compareCustomModelName, setCompareCustomModelName] = useState('')

  useEffect(() => {
    getAvailableModels()
      .then((data) => setModels(data.models || []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [])

  const handlePrimaryChange = (val) => {
    if (val === CUSTOM_OPTION_VALUE) {
      setShowCustom(true)
      onChange('custom:')
    } else {
      setShowCustom(false)
      onChange(val)
      onCustomConfig?.(null)
    }
  }

  const handleCompareChange = (val) => {
    if (val === CUSTOM_OPTION_VALUE) {
      setShowCompareCustom(true)
      onCompareChange('custom:')
    } else {
      setShowCompareCustom(false)
      onCompareChange(val)
      onCompareCustomConfig?.(null)
    }
  }

  const applyCustom = () => {
    if (!customModelName || !customBaseUrl) return
    onChange(`custom:${customModelName}`)
    onCustomConfig?.({ base_url: customBaseUrl, model_name: customModelName })
  }

  const applyCompareCustom = () => {
    if (!compareCustomModelName || !compareCustomBaseUrl) return
    onCompareChange(`custom:${compareCustomModelName}`)
    onCompareCustomConfig?.({ base_url: compareCustomBaseUrl, model_name: compareCustomModelName })
  }

  const clearCustom = () => {
    setShowCustom(false)
    setCustomBaseUrl('')
    setCustomModelName('')
    onChange('')
    onCustomConfig?.(null)
  }

  const clearCompareCustom = () => {
    setShowCompareCustom(false)
    setCompareCustomBaseUrl('')
    setCompareCustomModelName('')
    onCompareChange('')
    onCompareCustomConfig?.(null)
  }

  const grouped = models.reduce((acc, m) => {
    acc[m.provider] = acc[m.provider] || []
    acc[m.provider].push(m)
    return acc
  }, {})

  const renderSelect = (id, val, handler, label, isCustomShown) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="section-label">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={isCustomShown ? CUSTOM_OPTION_VALUE : val}
          onChange={(e) => handler(e.target.value)}
          className="w-full appearance-none bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 pr-10
                     text-surface-100 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60
                     transition-colors cursor-pointer"
        >
          <option value="">Select a model...</option>
          {loading && <option disabled>Loading models...</option>}
          {Object.entries(grouped).map(([provider, providerModels]) => (
            <optgroup key={provider} label={provider.toUpperCase()}>
              {providerModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>
          ))}
          <optgroup label="CUSTOM">
            <option value={CUSTOM_OPTION_VALUE}>Custom OpenAI-compatible endpoint...</option>
          </optgroup>
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-surface-500">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
        </div>
      </div>
    </div>
  )

  const renderCustomInputs = (
    baseUrl, setBaseUrl,
    modelName, setModelName,
    onApply, onClear,
    idPrefix
  ) => (
    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
          <LinkIcon size={12} />
          Custom Endpoint
        </div>
        <button type="button" onClick={onClear} className="text-surface-500 hover:text-surface-300">
          <X size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-base-url`} className="section-label">API Base URL</label>
          <input
            id={`${idPrefix}-base-url`}
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.your-model-host.com/v1"
            className="input-field font-mono text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-model-name`} className="section-label">Model Identifier</label>
          <input
            id={`${idPrefix}-model-name`}
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. llama-3-8b or mistral-7b-instruct"
            className="input-field font-mono text-xs"
          />
        </div>
      </div>
      <button
        type="button"
        id={`${idPrefix}-apply-btn`}
        onClick={onApply}
        disabled={!baseUrl || !modelName}
        className="btn-primary text-xs py-2 justify-center disabled:opacity-40"
      >
        Apply Custom Endpoint
      </button>
      <p className="text-xs text-surface-600">
        Endpoint must implement the OpenAI Chat Completions API format. An optional API key can be entered below.
      </p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {renderSelect('model-primary', value, handlePrimaryChange, 'Target Model', showCustom)}
      {showCustom && renderCustomInputs(
        customBaseUrl, setCustomBaseUrl,
        customModelName, setCustomModelName,
        applyCustom, clearCustom,
        'custom-primary'
      )}
      {compareMode && renderSelect('model-compare', compareValue, handleCompareChange, 'Comparison Model', showCompareCustom)}
      {compareMode && showCompareCustom && renderCustomInputs(
        compareCustomBaseUrl, setCompareCustomBaseUrl,
        compareCustomModelName, setCompareCustomModelName,
        applyCompareCustom, clearCompareCustom,
        'custom-compare'
      )}
    </div>
  )
}
