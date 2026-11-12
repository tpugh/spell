import { useEffect } from 'react'
import { useTTS } from './hooks/useTTS'
import { starGlyphs, starLabel } from './progress'
import type { TestResult, View } from './types'

interface ResultsViewProps {
  result: TestResult
  starsEarned: number
  totalStars: number
  onNavigate: (view: View) => void
  onRetryMissed?: () => void
}

const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            left: `${(index * 37) % 100}%`,
            animationDelay: `${(index % 6) * 0.12}s`,
            backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          }}
        />
      ))}
    </div>
  )
}

export default function ResultsView({
  result,
  starsEarned,
  totalStars,
  onNavigate,
  onRetryMissed,
}: ResultsViewProps) {
  const percent =
    result.totalWords > 0 ? Math.round((result.correctCount / result.totalWords) * 100) : 0
  const perfect = result.missedWords.length === 0
  const { speak, cancel, isSupported } = useTTS()

  // Praise out loud for a perfect score. Waits a moment so it does not talk
  // over the screen change, and is cancelled if the child leaves quickly.
  useEffect(() => {
    if (!perfect || !isSupported) return
    const timer = setTimeout(() => speak('Perfect score! You got every word right!'), 400)
    return () => {
      clearTimeout(timer)
      cancel()
    }
  }, [perfect, isSupported, speak, cancel])

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-yellow-50 to-orange-100 p-6"
    >
      {perfect && <Confetti />}

      <h1 className="mb-2 text-4xl font-extrabold text-orange-900">Test Results</h1>
      <p className="mb-4 text-xl text-gray-800">{result.wordListName}</p>

      <div className="mb-4 flex w-full max-w-md items-center justify-around gap-4 rounded-2xl bg-white p-5 shadow-md">
        <div className="text-center">
          <p className="text-5xl font-black text-orange-800">
            {result.correctCount} / {result.totalWords}
          </p>
          <p className="mt-1 text-xl text-gray-800">{percent}% correct</p>
        </div>
        <div className="text-center">
          <p className="text-3xl">
            <span aria-hidden="true">{starGlyphs(starsEarned)}</span>
            <span className="sr-only">{starLabel(starsEarned)}</span>
          </p>
          <p className="mt-1 text-lg font-bold text-amber-800">
            +{starsEarned} {starsEarned === 1 ? 'star' : 'stars'} earned
          </p>
          <p className="text-sm font-semibold text-gray-700">
            {totalStars} {totalStars === 1 ? 'star' : 'stars'} altogether
          </p>
        </div>
      </div>

      {percent < 50 && (
        <p className="mb-4 max-w-md text-center text-lg text-gray-800">
          Every word you try makes you stronger. Keep going!
        </p>
      )}

      {result.missedWords.length > 0 ? (
        <section
          aria-labelledby="missed-heading"
          className="mb-5 w-full max-w-md rounded-2xl bg-white p-5 shadow-md"
        >
          <h2 id="missed-heading" className="mb-3 text-xl font-bold text-orange-900">
            Words to practice:
          </h2>
          <ul className="space-y-2">
            {result.missedWords.map((word) => (
              <li key={word} className="flex items-center gap-2 text-lg">
                <span className="text-orange-700" aria-hidden="true">
                  ✗
                </span>
                <span className="font-semibold text-gray-900">{word}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="mb-5 rounded-2xl bg-green-100 p-5 text-center shadow-md">
          <p className="text-2xl font-bold text-green-900">
            <span aria-hidden="true">🎉 </span>Perfect score!
          </p>
          <p className="text-lg text-green-800">You got every word right!</p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {result.missedWords.length > 0 && onRetryMissed && (
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-orange-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-orange-800 active:scale-95"
            onClick={onRetryMissed}
          >
            Practice Missed Words
          </button>
        )}
        <button
          type="button"
          className="min-h-14 rounded-2xl bg-blue-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-blue-800 active:scale-95"
          onClick={() => onNavigate('test')}
        >
          Try Again
        </button>
        <button
          type="button"
          className="min-h-14 rounded-2xl bg-gray-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-gray-800 active:scale-95"
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
      </div>
    </main>
  )
}
