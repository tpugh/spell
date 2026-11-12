import type { TestResult, View } from './types'

interface ResultsViewProps {
  result: TestResult
  onNavigate: (view: View) => void
  onRetryMissed?: () => void
}

function starsForScore(correct: number, total: number): { glyph: string; label: string } {
  const ratio = total > 0 ? correct / total : 0
  if (ratio >= 0.9) return { glyph: '⭐⭐⭐', label: 'Three stars' }
  if (ratio >= 0.7) return { glyph: '⭐⭐', label: 'Two stars' }
  if (ratio >= 0.5) return { glyph: '⭐', label: 'One star' }
  return { glyph: '💪', label: 'Keep practising' }
}

export default function ResultsView({ result, onNavigate, onRetryMissed }: ResultsViewProps) {
  const stars = starsForScore(result.correctCount, result.totalWords)
  const percent =
    result.totalWords > 0 ? Math.round((result.correctCount / result.totalWords) * 100) : 0

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-orange-100 p-6"
    >
      <h1 className="mb-2 text-4xl font-extrabold text-orange-900">Test Results</h1>
      <p className="mb-6 text-xl text-gray-800">{result.wordListName}</p>

      <div className="mb-6 text-center">
        <p className="text-6xl font-black text-orange-800">
          {result.correctCount} / {result.totalWords}
        </p>
        <p className="mt-2 text-2xl text-gray-800">{percent}% correct</p>
        <p className="mt-2 text-4xl">
          <span aria-hidden="true">{stars.glyph}</span>
          <span className="sr-only">{stars.label}</span>
        </p>
      </div>

      {result.missedWords.length > 0 ? (
        <section
          aria-labelledby="missed-heading"
          className="mb-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-md"
        >
          <h2 id="missed-heading" className="mb-3 text-xl font-bold text-red-700">
            Words to practice:
          </h2>
          <ul className="space-y-2">
            {result.missedWords.map((word) => (
              <li key={word} className="flex items-center gap-2 text-lg">
                <span className="text-red-700" aria-hidden="true">
                  ✗
                </span>
                <span className="font-semibold text-gray-900">{word}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="mb-6 rounded-2xl bg-green-100 p-6 text-center shadow-md">
          <p className="text-2xl font-bold text-green-900">
            <span aria-hidden="true">🎉 </span>Perfect score!
          </p>
          <p className="text-lg text-green-800">You got every word right!</p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
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
          className="min-h-14 rounded-2xl bg-gray-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-gray-700 active:scale-95"
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
      </div>
    </main>
  )
}
