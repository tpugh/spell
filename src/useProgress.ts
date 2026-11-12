import { useCallback, useEffect, useRef, useState } from 'react'
import { storage } from './db'
import { EMPTY_PROGRESS, recordSession } from './progress'
import type { Progress } from './types'

/**
 * Loads and saves stars/streak for this device. Sessions call `earnStars`
 * once when they finish; the in-memory value updates immediately so the
 * celebration is instant even if storage is slow.
 */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const latest = useRef<Progress>(EMPTY_PROGRESS)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const saved = await storage.getProgress()
        if (cancelled) return
        latest.current = saved
        setProgress(saved)
      } catch (error) {
        console.warn('Could not load stars and streak', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const earnStars = useCallback(async (stars: number): Promise<Progress> => {
    const next = recordSession(latest.current, stars)
    latest.current = next
    setProgress(next)
    try {
      await storage.saveProgress(next)
    } catch (error) {
      console.warn('Could not save stars and streak', error)
    }
    return next
  }, [])
  return { progress, loading, earnStars }
}
