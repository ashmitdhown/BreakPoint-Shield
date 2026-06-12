import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { startEval } from '../api/client'
import { useEvalStore } from '../store/evalStore'

export function useEvalRun() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const storeStartRun = useEvalStore((s) => s.startRun)

  const run = useCallback(async (config) => {
    setLoading(true)
    setError(null)
    try {
      const { run_id: runId } = await startEval(config)
      storeStartRun(runId, config.model_id, config.categories)
      navigate(`/eval/${runId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [navigate, storeStartRun])

  return { run, loading, error }
}
