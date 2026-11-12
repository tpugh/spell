import { useEffect, useState } from 'react'
import { useTTS } from './hooks/useTTS'
import type { WordList, View } from './types'

interface PracticeViewProps {
  wordList: WordList
  onNavigate: (view: View) => void
  onComplete?: (missed: string[]) => void
}

export default function PracticeView({ wordList, onNavigate, onComplete }: PracticeViewProps) {
  const { speak, cancel, isSupported } = useTTS()
  const words = wordList.words
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [missed, setMissed] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [completed, setCompleted] = useState(false)

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + (feedback === 'correct' ? 1 : 0)) / words.length) * 100

  useEffect(() => {
    if (currentWord && !completed) {
      // Auto-speak the word when it changes
      const timer = setTimeout(() => speak(currentWord.text), 300)
      return () => {
        clearTimeout(timer)
        cancel()
      }
    }
  }, [currentIndex, currentWord, completed, speak, cancel])

  function check() {
    if (!currentWord) return
    const isCorrect = input.trim().toLowerCase() === currentWord.text.toLowerCase()
    if (isCorrect) {
      setFeedback('correct')
    } else {
      setFeedback('wrong')
      setAttempts((count) => count + 1)
      if (!missed.includes(currentWord.text)) {
        setMissed((list) => [...list, currentWord.text])
      }
    }
  }

  function next() {
    setInput('')
    setFeedback(null)
    setAttempts(0)
    if (currentIndex < words.length - 1) {
      setCurrentIndex((index) => index + 1)
    } else {
      setCompleted(true)
      onComplete?.(missed)
    }
  }

  function retry() {
    setInput('')
    setFeedback(null)
  }

  if (completed) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-100 to-teal-100 p-6"
      >
        <h1 className="mb-4 text-4xl font-extrabold text-green-900">Great job!</h1>
        <p className="mb-2 text-2xl text-gray-800">You practiced {words.length} words</p>
        {missed.length === 0 ? (
          <p className="mb-6 text-2xl font-bold text-green-800">
            <span aria-hidden="true">⭐⭐⭐ </span>All correct!
          </p>
        ) : (
          <p className="mb-6 max-w-md text-center text-xl text-gray-800">
            {missed.length} word{missed.length !== 1 ? 's' : ''} to review: {missed.join(', ')}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-green-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-800 active:scale-95"
            onClick={() => {
              setCurrentIndex(0)
              setInput('')
              setFeedback(null)
              setMissed([])
              setAttempts(0)
              setCompleted(false)
            }}
          >
            Practice Again
          </button>
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-gray-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-gray-700 active:scale-95"
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-emerald-100 p-6"
    >
      <h1 className="sr-only">Practice mode</h1>

      <button
        type="button"
        className="mb-4 min-h-12 self-start rounded-lg px-3 py-2 text-lg font-semibold text-green-800 hover:bg-green-100"
        onClick={() => onNavigate('home')}
      >
        <span aria-hidden="true">← </span>Home
      </button>

      <div className="mb-6 w-full max-w-md">
        <div className="mb-1 flex justify-between text-sm text-gray-700">
          <span>
            Word {currentIndex + 1} of {words.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Practice progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-3 overflow-hidden rounded-full bg-green-200"
        >
          <div
            className="h-full rounded-full bg-green-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-700 text-4xl text-white shadow-lg transition hover:bg-green-800 active:scale-95"
        onClick={() => speak(currentWord.text)}
        aria-label="Play the word again"
      >
        <span aria-hidden="true">🔊</span>
      </button>

      {!isSupported && (
        <p className="mb-4 max-w-md rounded-xl bg-amber-100 p-3 text-center text-base text-amber-900">
          Audio isn&apos;t available on this device. Ask a grown-up to read the word aloud.
        </p>
      )}

      <label htmlFor="practice-answer" className="mb-2 text-center text-lg text-gray-800">
        Listen, then type the word
      </label>
      <input
        id="practice-answer"
        className="mb-4 w-full max-w-md rounded-2xl border-4 border-green-400 px-6 py-4 text-center text-3xl font-bold tracking-wider focus:border-green-700"
        value={input}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        onChange={(event) => {
          setInput(event.target.value)
          setFeedback(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (feedback === 'correct') next()
            else if (feedback === 'wrong') retry()
            else check()
          }
        }}
        placeholder="type here..."
        autoFocus
        disabled={feedback === 'correct'}
      />

      {/* Persistent live region so screen readers announce feedback */}
      <div role="status" aria-live="polite" className="mb-4 min-h-12 text-center">
        {feedback === 'correct' && (
          <p className="text-2xl font-bold text-green-800">
            <span aria-hidden="true">✅ </span>Correct! Great job!
          </p>
        )}
        {feedback === 'wrong' && (
          <p className="text-xl font-bold text-red-700">
            <span aria-hidden="true">💪 </span>Try again!
            {attempts >= 2 && (
              <span className="ml-2 block text-base font-normal text-gray-800">
                Hint: {currentWord.text.length} letters.
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {feedback === null && (
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-green-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-800 active:scale-95 disabled:opacity-50"
            disabled={!input.trim()}
            onClick={check}
          >
            Check
          </button>
        )}
        {feedback === 'wrong' && (
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-amber-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-amber-800 active:scale-95"
            onClick={retry}
          >
            Try Again
          </button>
        )}
        {feedback === 'correct' && (
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-blue-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-blue-800 active:scale-95"
            onClick={next}
          >
            {currentIndex < words.length - 1 ? (
              <>
                Next Word <span aria-hidden="true">→</span>
              </>
            ) : (
              <>
                Finish <span aria-hidden="true">🎉</span>
              </>
            )}
          </button>
        )}
      </div>
    </main>
  )
}
