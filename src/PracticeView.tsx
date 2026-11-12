import { useState, useEffect } from 'react'
import { useTTS } from './hooks/useTTS'
import type { WordList, View } from './types'

interface PracticeViewProps {
  wordList: WordList
  onNavigate: (view: View) => void
  onComplete?: (missed: string[]) => void
}

export default function PracticeView({ wordList, onNavigate, onComplete }: PracticeViewProps) {
  const { speak, cancel } = useTTS()
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
      if (attempts > 0) {
        // was retried, already in missed
      }
    } else {
      setFeedback('wrong')
      setAttempts((a) => a + 1)
      if (!missed.includes(currentWord.text)) {
        setMissed((m) => [...m, currentWord.text])
      }
    }
  }

  function next() {
    setInput('')
    setFeedback(null)
    setAttempts(0)
    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1)
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-100 to-teal-100 p-6">
        <h2 className="mb-4 text-4xl font-extrabold text-green-700">Great job!</h2>
        <p className="mb-2 text-2xl text-gray-700">
          You practiced {words.length} words
        </p>
        {missed.length === 0 ? (
          <p className="mb-6 text-2xl font-bold text-green-600">All correct! ⭐⭐⭐</p>
        ) : (
          <p className="mb-6 text-xl text-gray-600">
            {missed.length} word{missed.length !== 1 ? 's' : ''} to review: {missed.join(', ')}
          </p>
        )}
        <div className="flex gap-4">
          <button
            className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-600 active:scale-95"
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
            className="rounded-2xl bg-gray-400 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-gray-500 active:scale-95"
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-emerald-100 p-6">
      <button
        className="mb-4 self-start text-lg font-semibold text-green-600 hover:text-green-800"
        onClick={() => onNavigate('home')}
      >
        ← Home
      </button>

      {/* Progress */}
      <div className="mb-6 w-full max-w-md">
        <div className="mb-1 flex justify-between text-sm text-gray-500">
          <span>
            Word {currentIndex + 1} of {words.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-green-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Speaker button */}
      <button
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-4xl text-white shadow-lg transition hover:bg-green-600 active:scale-95"
        onClick={() => speak(currentWord.text)}
        aria-label="Play word"
      >
        🔊
      </button>

      <p className="mb-4 text-lg text-gray-500">Listen, then type the word</p>

      {/* Input */}
      <input
        className="mb-4 w-full max-w-md rounded-2xl border-3 border-green-300 px-6 py-4 text-center text-3xl font-bold tracking-wider focus:border-green-500 focus:outline-none"
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setFeedback(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (feedback === 'correct') next()
            else if (feedback === 'wrong') retry()
            else check()
          }
        }}
        placeholder="type here..."
        autoFocus
        disabled={feedback === 'correct'}
      />

      {/* Feedback */}
      {feedback === 'correct' && (
        <div className="mb-4 text-3xl font-bold text-green-600">✅ Correct! Great job!</div>
      )}
      {feedback === 'wrong' && (
        <div className="mb-4 text-2xl font-bold text-red-500">
          Try again! 💪
          {attempts >= 2 && (
            <span className="ml-2 text-lg text-gray-500">
              (Hint: {currentWord.text.length} letters)
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4">
        {feedback === null && (
          <button
            className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-600 active:scale-95 disabled:opacity-40"
            disabled={!input.trim()}
            onClick={check}
          >
            Check
          </button>
        )}
        {feedback === 'wrong' && (
          <button
            className="rounded-2xl bg-yellow-500 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-yellow-600 active:scale-95"
            onClick={retry}
          >
            Try Again
          </button>
        )}
        {feedback === 'correct' && (
          <button
            className="rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-blue-600 active:scale-95"
            onClick={next}
          >
            {currentIndex < words.length - 1 ? 'Next Word →' : 'Finish! 🎉'}
          </button>
        )}
      </div>
    </div>
  )
}