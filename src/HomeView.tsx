import type { Progress, WordList, View } from './types'
import WordListSelect from './components/WordListSelect'
import { useFontMode } from './useFontMode'
import { useTTS } from './hooks/useTTS'
import { wordOfTheDay } from './progress'

interface HomeViewProps {
  lists: WordList[]
  selectedList: WordList | null
  progress: Progress
  onSelectList: (list: WordList) => void
  onNavigate: (view: View) => void
}

export default function HomeView({
  lists,
  selectedList,
  progress,
  onSelectList,
  onNavigate,
}: HomeViewProps) {
  const { easyRead, toggle } = useFontMode()
  const { speak } = useTTS()
  const dayWord = wordOfTheDay(lists)

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-indigo-100 to-purple-100 p-6"
    >
      <button
        type="button"
        aria-pressed={easyRead}
        title="Easy-read text"
        onClick={toggle}
        className="absolute right-4 top-4 min-h-12 rounded-xl border-2 border-indigo-400 bg-white px-4 py-3 text-lg font-bold text-indigo-900 shadow-sm hover:bg-indigo-50"
      >
        <span aria-hidden="true">Aa</span>
        <span className="sr-only">Easy-read text</span>
      </button>

      <div className="my-auto flex w-full max-w-md flex-col items-center">
        <h1 className="mb-2 mt-12 text-5xl font-extrabold text-indigo-800 md:mt-0">Spell</h1>
        <p className="mb-5 text-lg text-gray-700">Practice your spelling words!</p>

        <div className="mb-5 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-3 text-center shadow-md">
            <p className="text-2xl" aria-hidden="true">
              ⭐
            </p>
            <p id="progress-stars" className="text-3xl font-black text-amber-700">
              {progress.stars}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {progress.stars === 1 ? 'star earned' : 'stars earned'}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center shadow-md">
            <p className="text-2xl" aria-hidden="true">
              🔥
            </p>
            <p id="progress-streak" className="text-3xl font-black text-orange-700">
              {progress.streakDays}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {progress.streakDays === 0
                ? 'practice today to start'
                : `day${progress.streakDays === 1 ? '' : 's'} in a row`}
            </p>
          </div>
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {`You have ${progress.stars} ${progress.stars === 1 ? 'star' : 'stars'} and a ${progress.streakDays} day streak.`}
        </div>

        {dayWord && (
          <section
            aria-labelledby="word-of-day-heading"
            className="mb-5 w-full rounded-2xl bg-gradient-to-r from-amber-100 to-yellow-100 p-4 shadow-md"
          >
            <h2
              id="word-of-day-heading"
              className="text-sm font-bold uppercase tracking-wide text-amber-900"
            >
              Word of the day
            </h2>
            <div className="mt-1 flex items-center justify-between gap-4">
              <p className="text-3xl font-extrabold text-gray-900">{dayWord.text}</p>
              <button
                type="button"
                className="min-h-12 min-w-12 rounded-xl bg-amber-700 px-4 py-3 text-xl text-white shadow-md hover:bg-amber-800 active:scale-95"
                onClick={() => speak(dayWord.text)}
                aria-label={`Hear the word of the day: ${dayWord.text}`}
              >
                <span aria-hidden="true">🔊</span>
              </button>
            </div>
          </section>
        )}

        <WordListSelect
          id="word-list-select"
          label="Your word list"
          lists={lists}
          selectedList={selectedList}
          onSelectList={onSelectList}
          emptyMessage="No lists yet. Create one!"
        />

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            className="min-h-16 rounded-2xl bg-green-700 px-8 py-5 text-2xl font-bold text-white shadow-lg transition hover:bg-green-800 active:scale-95 disabled:opacity-50"
            disabled={!selectedList || selectedList.words.length === 0}
            onClick={() => onNavigate('practice')}
          >
            Practice
          </button>
          <button
            type="button"
            className="min-h-16 rounded-2xl bg-blue-700 px-8 py-5 text-2xl font-bold text-white shadow-lg transition hover:bg-blue-800 active:scale-95 disabled:opacity-50"
            disabled={!selectedList || selectedList.words.length === 0}
            onClick={() => onNavigate('test')}
          >
            Take a Test
          </button>
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-orange-700 px-8 py-4 text-xl font-semibold text-white shadow-md transition hover:bg-orange-800 active:scale-95"
            onClick={() => onNavigate('games')}
          >
            <span aria-hidden="true">🎮 </span>Games
          </button>
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-purple-700 px-8 py-4 text-xl font-semibold text-white shadow-md transition hover:bg-purple-800 active:scale-95"
            onClick={() => onNavigate('lists')}
          >
            Manage Word Lists
          </button>
        </div>

        {lists.length > 0 && !selectedList && (
          <p className="mt-4 text-center text-gray-700">
            Pick a word list above to start practising.
          </p>
        )}

        <button
          type="button"
          className="mt-6 min-h-12 rounded-lg px-3 py-2 text-base font-semibold text-indigo-800 underline-offset-4 hover:bg-indigo-200 hover:underline"
          onClick={() => onNavigate('backup')}
        >
          Grown-ups: back up &amp; restore
        </button>
      </div>
    </main>
  )
}
