import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Request failed'
    return Promise.reject(new Error(message))
  },
)

export async function startEval(config) {
  const { data } = await api.post('/eval/start', config)
  return data
}

export async function getEvalStatus(runId) {
  const { data } = await api.get(`/eval/${runId}/status`)
  return data
}

export async function getEvalResults(runId) {
  const { data } = await api.get(`/eval/${runId}/results`)
  return data
}

export async function getHistory() {
  const { data } = await api.get('/history')
  return data
}

export async function deleteRun(runId) {
  const { data } = await api.delete(`/history/${runId}`)
  return data
}

export async function getAvailableModels() {
  const { data } = await api.get('/models')
  return data
}

export function getPDFReportUrl(runId) {
  return `/api/report/${runId}/pdf`
}

export default api
