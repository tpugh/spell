import { useCallback, useRef } from 'react'

export interface TTSOptions {
  rate?: number
  pitch?: number
  lang?: string
}

export function useTTS(options: TTSOptions = {}) {
  const { rate = 0.75, pitch = 1.05, lang = 'en-US' } = options
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) return
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.lang = lang
      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [rate, pitch, lang],
  )

  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  return { speak, cancel, isSupported }
}