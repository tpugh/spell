import type { WordList, View } from './types'

interface HomeViewProps {
  lists: WordList[]
  selectedList: WordList | null
  onSelectList: (list: WordList) => void
  onNavigate: (view: View) => void
}

export default function HomeView({ lists, selectedList, onSelectList, onNavigate }: HomeViewProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-100 to-purple-100 p-6">
      <h1 className="mb-2 text-5xl font-extrabold text-indigo-700">Spell</h1>
      <p className="mb-8 text-lg text-gray-600">Practice your spelling words!</p>

      {/* Selected list */}
      <div className="mb-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
        <label className="mb-2 block text-sm font-semibold text-gray-500">Your word list</label>
        {lists.length === 0 ? (
          <p className="text-gray-400">No lists yet. Create one!</p>
        ) : (
          <select
            className="w-full rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3 text-lg font-medium text-indigo-800 focus:border-indigo-400 focus:outline-none"
            value={selectedList?.id ?? ''}
            onChange={(e) => {
              const list = lists.find((l) => l.id === e.target.value)
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

      {/* Action buttons */}
      <div className="flex w-full max-w-md flex-col gap-4">
        <button
          className="rounded-2xl bg-green-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition hover:bg-green-600 active:scale-95 disabled:opacity-40"
          disabled={!selectedList || selectedList.words.length === 0}
          onClick={() => onNavigate('practice')}
        >
          Practice
        </button>
        <button
          className="rounded-2xl bg-blue-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-95 disabled:opacity-40"
          disabled={!selectedList || selectedList.words.length === 0}
          onClick={() => onNavigate('test')}
        >
          Take a Test
        </button>
        <button
          className="rounded-2xl bg-purple-400 px-8 py-4 text-xl font-semibold text-white shadow-md transition hover:bg-purple-500 active:scale-95"
          onClick={() => onNavigate('lists')}
        >
          Manage Word Lists
        </button>
      </div>
    </div>
  )
}