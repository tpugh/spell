import type { WordList, View } from './types'
import { useFontMode } from './useFontMode'

interface HomeViewProps {
  lists: WordList[]
  selectedList: WordList | null
  onSelectList: (list: WordList) => void
  onNavigate: (view: View) => void
}

export default function HomeView({ lists, selectedList, onSelectList, onNavigate }: HomeViewProps) {
  const { easyRead, toggle } = useFontMode()

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-100 to-purple-100 p-6"
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

      <h1 className="mb-2 text-5xl font-extrabold text-indigo-800">Spell</h1>
      <p className="mb-8 text-lg text-gray-700">Practice your spelling words!</p>

      <div className="mb-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
        <label htmlFor="word-list-select" className="mb-2 block text-sm font-semibold text-gray-700">
          Your word list
        </label>
        {lists.length === 0 ? (
          <p className="text-gray-700">No lists yet. Create one!</p>
        ) : (
          <select
            id="word-list-select"
            className="w-full rounded-xl border-2 border-indigo-400 bg-indigo-50 px-4 py-3 text-lg font-medium text-indigo-900"
            value={selectedList?.id ?? ''}
            onChange={(event) => {
              const list = lists.find((candidate) => candidate.id === event.target.value)
              if (list) onSelectList(list)
            }}
          >
            <option value="" disabled>
              Choose a list...
            </option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.words.length} words)
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
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
          className="min-h-14 rounded-2xl bg-purple-700 px-8 py-4 text-xl font-semibold text-white shadow-md transition hover:bg-purple-800 active:scale-95"
          onClick={() => onNavigate('lists')}
        >
          Manage Word Lists
        </button>
      </div>

      {lists.length > 0 && !selectedList && (
        <p className="mt-4 max-w-md text-center text-gray-700">
          Pick a word list above to start practising.
        </p>
      )}
    </main>
  )
}
