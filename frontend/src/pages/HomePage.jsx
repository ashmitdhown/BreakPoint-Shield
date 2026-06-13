import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Play, ChevronRight, AlertCircle } from 'lucide-react'
import ModelSelector from '../components/ModelSelector'
import { useEvalRun } from '../hooks/useEvalRun'

const CATEGORIES = [
  { id: 'hallucination', label: 'Hallucination', desc: 'Factual accuracy on TruthfulQA' },
  { id: 'jailbreak', label: 'Jailbreak Resistance', desc: 'Safety guardrail bypass' },
  { id: 'injection', label: 'Prompt Injection', desc: 'System prompt override attacks' },
  { id: 'toxicity', label: 'Toxicity', desc: 'Harmful content detection' },
  { id: 'bias', label: 'Bias Detection', desc: 'Demographic fairness across 5 axes' },
  { id: 'rag_faithfulness', label: 'RAG Faithfulness', desc: 'Context grounding accuracy' },
]

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer group w-full text-left"
      role="switch"
      aria-checked={checked}
    >
      <div className={`toggle-switch ${checked ? 'bg-accent' : 'bg-surface-700'}`}>
        <span className={`toggle-thumb ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className={`text-sm transition-colors ${checked ? 'text-surface-200' : 'text-surface-400'} group-hover:text-surface-200`}>
        {label}
      </span>
    </button>
  )
}

export default function HomePage() {
  const [modelId, setModelId] = useState('')
  const [customConfig, setCustomConfig] = useState(null)
  const [compareCustomConfig, setCompareCustomConfig] = useState(null)
  const [selectedCats, setSelectedCats] = useState(CATEGORIES.map((c) => c.id))
  const [iterativeMode, setIterativeMode] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareModelId, setCompareModelId] = useState('')
  const { run, loading, error } = useEvalRun()

  const toggleCat = (id) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleRun = () => {
    if (!modelId || modelId === 'custom:') return
    const payload = {
      model_id: modelId,
      categories: selectedCats,
      iterative_mode: iterativeMode,
    }
    if (customConfig?.base_url) {
      payload.base_url = customConfig.base_url
    }
    if (compareMode && compareModelId && compareModelId !== 'custom:') {
      payload.compare_model_id = compareModelId
      if (compareCustomConfig?.base_url) {
        payload.compare_base_url = compareCustomConfig.base_url
      }
    }
    run(payload)
  }

  const isModelReady = !!modelId && modelId !== 'custom:' && (
    !modelId.startsWith('custom:') || (customConfig?.base_url && customConfig?.model_name)
  )

  const canRun = isModelReady && selectedCats.length > 0 && !loading

  return (
    <div className="flex-1 flex flex-col matrix-bg scan-line">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center animate-pulse-glow">
                <Shield size={28} className="text-accent" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger/80 border-2 border-surface-950 flex items-center justify-center">
                <span className="text-white text-[8px] font-black">!</span>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-surface-50 tracking-tight mb-3">
            Break
            <span className="text-gradient glitch-text" data-text="Point">
              Point
            </span>
          </h1>
          <p className="text-surface-400 text-lg max-w-md mx-auto leading-relaxed">
            Find where your LLM breaks —{' '}
            <span className="text-surface-300">before your users do.</span>
          </p>
          <div className="flex items-center justify-center gap-6 mt-5 text-xs text-surface-600 font-mono">
            <span>500+ adversarial prompts</span>
            <span className="w-1 h-1 rounded-full bg-surface-700" />
            <span>6 failure categories</span>
            <span className="w-1 h-1 rounded-full bg-surface-700" />
            <span>real-time streaming</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-xl"
        >
          <div className="glass-card p-6 flex flex-col gap-6">
            <div>
              <p className="section-label mb-3">Configuration</p>
              <ModelSelector
                value={modelId}
                onChange={setModelId}
                onCustomConfig={setCustomConfig}
                compareMode={compareMode}
                compareValue={compareModelId}
                onCompareChange={setCompareModelId}
                onCompareCustomConfig={setCompareCustomConfig}
              />
            </div>

            <div>
              <p className="section-label mb-3">Evaluation Categories</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const checked = selectedCats.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      id={`cat-${cat.id}`}
                      onClick={() => toggleCat(cat.id)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all duration-150 ${
                        checked
                          ? 'bg-accent/10 border-accent/30 text-surface-200'
                          : 'bg-surface-800/40 border-surface-700/40 text-surface-500 hover:border-surface-600/60 hover:text-surface-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          checked ? 'bg-accent border-accent' : 'border-surface-600'
                        }`}>
                          {checked && <span className="text-white text-[9px] font-black">✓</span>}
                        </div>
                        <div>
                          <div className="font-medium leading-none">{cat.label}</div>
                          <div className="text-xs text-surface-500 mt-0.5">{cat.desc}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <Toggle
                checked={iterativeMode}
                onChange={setIterativeMode}
                label="Iterative Red-Teaming Mode (2 rounds)"
              />
              <Toggle
                checked={compareMode}
                onChange={setCompareMode}
                label="Model Comparison Mode"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2.5">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              id="run-evaluation-btn"
              onClick={handleRun}
              disabled={!canRun}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting evaluation...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Evaluation
                  <ChevronRight size={14} className="ml-auto" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-surface-700 mt-4 font-mono">
            API keys are used only to call the selected model — never stored server-side.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
