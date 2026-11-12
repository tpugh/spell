import type { ReactNode } from 'react'
import type { WordList } from '../types'

interface WordListSelectProps {
  /** Unique id so home and games can each have their own label target. */
  id: string
  label: string
  lists: WordList[]
  selectedList: WordList | null
  onSelectList: (list: WordList) => void
  emptyMessage?: ReactNode
  hint?: ReactNode
}

/**
 * The "which list?" chooser, shared by home and the games screen so both
 * always mean the same thing.
 */
export default function WordListSelect({
  id,
  label,
  lists,
  selectedList,
  onSelectList,
  emptyMessage,
  hint,
}: WordListSelectProps) {
  return (
    <div className="mb-5 w-full rounded-2xl bg-white p-5 text-gray-900 shadow-md">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {lists.length === 0 ? (
        <p className="text-gray-700">{emptyMessage ?? 'No lists yet. Create one!'}</p>
      ) : (
        <select
          id={id}
          className="min-h-12 w-full rounded-xl border-2 border-indigo-400 bg-indigo-50 px-4 py-3 text-lg font-medium text-indigo-900"
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

      {hint && lists.length > 0 && <p className="mt-2 text-sm text-gray-600">{hint}</p>}
    </div>
  )
}
