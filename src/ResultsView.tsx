import type { TestResult, View } from './types'

interface ResultsViewProps {
  result: TestResult
  onNavigate: (view: View) => void
  onRetryMissed?: () => void
}

function starsForScore(correct: number, total: number): string {
  const pct = total > 0 ? correct / total : 0
  if (pct >= 0.9) return '⭐⭐⭐'
  if (pct >= 0.7) return '⭐⭐'
  if (pct >= 0.5) return '⭐'
  return '💪'
}

export default function ResultsView({ result, onNavigate, onRetryMissed }: ResultsViewProps) {
  const stars = starsForScore(result.correctCount, result.totalWords)
  const pct = result.totalWords > 0 ? Math.round((result.correctCount / result.totalWords) * 100) : 0

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-orange-100 p-6">
      <h2 className="mb-2 text-4xl font-extrabold text-orange-700">Test Results</h2>
      <p className="mb-6 text-xl text-gray-600">{result.wordListName}</p>

      {/* Score */}
      <div className="mb-6 text-center">
        <div className="text-6xl font-black text-orange-600">
          {result.correctCount} / {result.totalWords}
        </div>
        <div className="mt-2 text-2xl text-gray-600">{pct}% correct</div>
        <div className="mt-2 text-4xl">{stars}</div>
      </div>

      {/* Missed words */}
      {result.missedWords.length > 0 && (
        <div className="mb-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
          <h3 className="mb-3 text-xl font-bold text-red-600">Words to practice:</h3>
          <ul className="space-y-2">
            {result.missedWords.map((word, i) => (
              <li key={i} className="flex items-center gap-2 text-lg">
                <span className="text-red-400">✗</span>
                <span className="font-semibold text-gray-800">{word}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.missedWords.length === 0 && (
        <div className="mb-6 rounded-2xl bg-green-100 p-6 text-center shadow-md">
          <p className="text-2xl font-bold text-green-700">Perfect score! 🎉</p>
          <p className="text-lg text-green-600">You got every word right!</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        {result.missedWords.length > 0 && onRetryMissed && (
          <button
            className="rounded-2xl bg-orange-500 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-orange-600 active:scale-95"
            onClick={onRetryMissed}
          >
            Practice Missed Words
          </button>
        )}
        <button
          className="rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-blue-600 active:scale-95"
          onClick={() => onNavigate('test')}
        >
          Try Again
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