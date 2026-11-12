import { useCallback, useEffect, useState } from 'react'

export type FontMode = 'default' | 'easy-read'

const STORAGE_KEY = 'spell:fontMode'

function readInitialMode(): FontMode {
  if (typeof localStorage === 'undefined') return 'default'
  try {
    return localStorage.getItem(STORAGE_KEY) === 'easy-read' ? 'easy-read' : 'default'
  } catch {
    return 'default'
  }
}

/**
 * Easy-read / dyslexia-friendly text mode.
 * Applies `data-font` on <html> so CSS can switch the type treatment,
 * and persists the choice locally.
 */
export function useFontMode() {
  const [mode, setMode] = useState<FontMode>(readInitialMode)

  useEffect(() => {
    document.documentElement.dataset.font = mode
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Storage can be blocked (private mode / managed devices) - ignore.
    }
  }, [mode])

  const toggle = useCallback(() => {
    setMode((current) => (current === 'easy-read' ? 'default' : 'easy-read'))
  }, [])

  return { mode, easyRead: mode === 'easy-read', toggle }
}
