import { useCallback, useEffect, useState } from 'react'
import { setBlipsMuted } from './blip'

const STORAGE_KEY = 'spell:blips'

function readInitialSound(): boolean {
  if (typeof localStorage === 'undefined') return true
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/**
 * Arcade sound preference. Shared by every game and remembered on this
 * device, mirroring the easy-read font toggle.
 */
export function useSound() {
  const [soundOn, setSoundOn] = useState(readInitialSound)

  useEffect(() => {
    setBlipsMuted(!soundOn)
    try {
      localStorage.setItem(STORAGE_KEY, soundOn ? 'on' : 'off')
    } catch {
      // Storage can be blocked (private mode / managed devices) - ignore.
    }
  }, [soundOn])

  const toggle = useCallback(() => {
    setSoundOn((current) => !current)
  }, [])

  return { soundOn, toggle }
}
