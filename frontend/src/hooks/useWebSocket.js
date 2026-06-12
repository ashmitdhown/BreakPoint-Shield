import { useEffect, useRef, useCallback } from 'react'
import { useEvalStore } from '../store/evalStore'

export function useWebSocket(runId) {
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const mountedRef = useRef(true)
  const handleMessage = useEvalStore((s) => s.handleMessage)
  const setWsStatus = useEvalStore((s) => s.setWsStatus)

  const connect = useCallback(() => {
    if (!runId || !mountedRef.current) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const url = `${protocol}//${host}:8000/ws/eval/${runId}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setWsStatus('connected')
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const msg = JSON.parse(event.data)
        if (msg.type !== 'ping') {
          handleMessage(msg)
        }
      } catch {
        // malformed message, ignore
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setWsStatus('disconnected')
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [runId, handleMessage, setWsStatus])

  const disconnect = useCallback(() => {
    mountedRef.current = false
    clearTimeout(reconnectTimerRef.current)
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      disconnect()
    }
  }, [runId])

  return { disconnect }
}
