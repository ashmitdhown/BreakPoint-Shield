import { create } from 'zustand'

const initialCategoryState = (id) => ({
  id,
  status: 'queued',
  current: 0,
  total: 0,
  score: null,
  failureRate: null,
  latestPrompt: '',
  latestResult: null,
  duration: null,
})

const DEFAULT_CATEGORIES = [
  'hallucination',
  'jailbreak',
  'injection',
  'toxicity',
  'bias',
  'rag_faithfulness',
]

export const useEvalStore = create((set, get) => ({
  currentRun: null,
  categoryStates: {},
  logEntries: [],
  overallScore: null,
  results: null,
  wsStatus: 'disconnected',
  errorMessage: null,

  startRun: (runId, modelId, categories) => {
    const cats = categories || DEFAULT_CATEGORIES
    const categoryStates = {}
    cats.forEach((id) => {
      categoryStates[id] = initialCategoryState(id)
    })
    set({
      currentRun: { runId, modelId, startTime: Date.now(), categories: cats },
      categoryStates,
      logEntries: [],
      overallScore: null,
      results: null,
      wsStatus: 'connecting',
      errorMessage: null,
    })
  },

  setWsStatus: (status) => set({ wsStatus: status }),

  handleMessage: (msg) => {
    if (msg.type === 'progress') {
      set((state) => ({
        categoryStates: {
          ...state.categoryStates,
          [msg.category]: {
            ...state.categoryStates[msg.category],
            status: 'running',
            current: msg.current,
            total: msg.total,
            score: msg.score,
            latestPrompt: msg.latest_prompt,
            latestResult: msg.latest_result,
          },
        },
        logEntries: [
          ...state.logEntries.slice(-199),
          {
            id: Date.now() + Math.random(),
            type: msg.latest_result === 'fail' ? 'fail' : 'pass',
            category: msg.category,
            prompt: msg.latest_prompt,
            ts: new Date().toISOString(),
          },
        ],
      }))
    } else if (msg.type === 'category_complete') {
      set((state) => ({
        categoryStates: {
          ...state.categoryStates,
          [msg.category]: {
            ...state.categoryStates[msg.category],
            status: 'complete',
            score: msg.score,
            failureRate: msg.failure_rate,
            duration: msg.duration_seconds,
          },
        },
      }))
    } else if (msg.type === 'run_complete') {
      set({ overallScore: msg.overall_score })
    } else if (msg.type === 'error') {
      set({ wsStatus: 'error', errorMessage: msg.message })
    } else if (msg.type === 'iterative_start') {
      set((state) => ({
        logEntries: [
          ...state.logEntries.slice(-199),
          {
            id: Date.now(),
            type: 'info',
            category: 'system',
            prompt: `Iterative round 2 started for: ${(msg.categories || []).join(', ')}`,
            ts: new Date().toISOString(),
          },
        ],
      }))
    }
  },

  setResults: (results) => set({ results }),

  reset: () =>
    set({
      currentRun: null,
      categoryStates: {},
      logEntries: [],
      overallScore: null,
      results: null,
      wsStatus: 'disconnected',
      errorMessage: null,
    }),
}))
