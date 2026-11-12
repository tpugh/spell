/**
 * Tiny 8-bit sound effects for the arcade games, synthesised with the Web
 * Audio API so there are no audio assets to download or bundle.
 */

export type BlipKind = 'correct' | 'wrong' | 'complete'

type AudioContextConstructor = new () => AudioContext

let context: AudioContext | null = null
let muted = false

/** Called by the sound toggle; keeps every game quiet when off. */
export function setBlipsMuted(value: boolean): void {
  muted = value
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const candidates = window as unknown as {
    AudioContext?: AudioContextConstructor
    webkitAudioContext?: AudioContextConstructor
  }
  const Constructor = candidates.AudioContext ?? candidates.webkitAudioContext
  if (!Constructor) return null

  if (!context) {
    try {
      context = new Constructor()
    } catch {
      return null
    }
  }

  if (context.state === 'suspended') {
    void context.resume()
  }
  return context
}

function tone(
  audio: AudioContext,
  frequency: number,
  delay: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.05,
): void {
  const start = audio.currentTime + delay
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain).connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export function playBlip(kind: BlipKind): void {
  if (muted) return
  const audio = getContext()
  if (!audio) return

  switch (kind) {
    case 'correct':
      tone(audio, 660, 0, 0.07)
      tone(audio, 880, 0.07, 0.09)
      break
    case 'wrong':
      tone(audio, 170, 0, 0.16, 'sawtooth', 0.04)
      break
    case 'complete':
      for (const [index, frequency] of [523, 659, 784, 1046].entries()) {
        tone(audio, frequency, index * 0.09, 0.12)
      }
      break
  }
}
