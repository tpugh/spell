import { useState } from 'react'
import type { WordList, View } from './types'
import { createWordList, createWord } from './useWordLists'

interface WordListManagerProps {
  lists: WordList[]
  onSave: (list: WordList) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onNavigate: (view: View) => void
}

export default function WordListManager({ lists, onSave, onDelete, onNavigate }: WordListManagerProps) {
  const [editing, setEditing] = useState<WordList | null>(null)
  const [newWordText, setNewWordText] = useState('')

  function startNew() {
    setEditing(createWordList('My List'))
  }

  function startEdit(list: WordList) {
    setEditing({ ...list, words: [...list.words] })
  }

  async function handleSave() {
    if (!editing) return
    if (!editing.name.trim()) {
      editing.name = 'My List'
    }
    if (editing.words.length === 0) return
    await onSave(editing)
    setEditing(null)
  }

  function addWord() {
    if (!editing || !newWordText.trim()) return
    const word = createWord(undefined, newWordText.trim())
    setEditing({ ...editing, words: [...editing.words, word] })
    setNewWordText('')
  }

  function removeWord(wordId: string) {
    if (!editing) return
    setEditing({ ...editing, words: editing.words.filter((w) => w.id !== wordId) })
  }

  function updateWordText(wordId: string, text: string) {
    if (!editing) return
    setEditing({
      ...editing,
      words: editing.words.map((w) => (w.id === wordId ? { ...w, text } : w)),
    })
  }

  // --- Edit view ---
  if (editing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
        <div className="mx-auto max-w-lg">
          <button
            className="mb-4 text-lg font-semibold text-purple-600 hover:text-purple-800"
            onClick={() => setEditing(null)}
          >
            ← Back
          </button>

          <h2 className="mb-4 text-3xl font-bold text-purple-700">
            {editing.createdAt === editing.updatedAt ? 'New List' : 'Edit List'}
          </h2>

          <input
            className="mb-4 w-full rounded-xl border-2 border-purple-200 px-4 py-3 text-xl font-medium focus:border-purple-400 focus:outline-none"
            placeholder="List name (e.g. Week 5)"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />

          {/* Add word */}
          <div className="mb-4 flex gap-2">
            <input
              className="flex-1 rounded-xl border-2 border-purple-200 px-4 py-3 text-lg focus:border-purple-400 focus:outline-none"
              placeholder="Type a word..."
              value={newWordText}
              onChange={(e) => setNewWordText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWord()}
            />
            <button
              className="rounded-xl bg-purple-500 px-6 py-3 text-lg font-bold text-white hover:bg-purple-600 active:scale-95"
              onClick={addWord}
            >
              Add
            </button>
          </div>

          {/* Word list */}
          <div className="mb-6 max-h-64 overflow-y-auto rounded-xl bg-white p-4 shadow-inner">
            {editing.words.length === 0 ? (
              <p className="text-center text-gray-400">No words yet. Add some above!</p>
            ) : (
              <ul className="space-y-2">
                {editing.words.map((word) => (
                  <li key={word.id} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-lg focus:border-purple-300 focus:outline-none"
                      value={word.text}
                      onChange={(e) => updateWordText(word.id, e.target.value)}
                    />
                    <button
                      className="rounded-lg bg-red-100 px-3 py-2 text-red-500 hover:bg-red-200"
                      onClick={() => removeWord(word.id)}
                      aria-label="Remove word"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            className="w-full rounded-2xl bg-green-500 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-600 active:scale-95 disabled:opacity-40"
            disabled={editing.words.length === 0}
            onClick={handleSave}
          >
            Save List ({editing.words.length} words)
          </button>
        </div>
      </div>
    )
  }

  // --- List view ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
      <div className="mx-auto max-w-lg">
        <button
          className="mb-4 text-lg font-semibold text-purple-600 hover:text-purple-800"
          onClick={() => onNavigate('home')}
        >
          ← Home
        </button>

        <h2 className="mb-6 text-3xl font-bold text-purple-700">Word Lists</h2>

        <button
          className="mb-6 w-full rounded-2xl bg-green-500 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-600 active:scale-95"
          onClick={startNew}
        >
          + New List
        </button>

        {lists.length === 0 ? (
          <p className="text-center text-gray-400">No lists yet. Create your first one!</p>
        ) : (
          <ul className="space-y-3">
            {lists.map((list) => (
              <li
                key={list.id}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-md"
              >
                <div>
                  <p className="text-xl font-bold text-gray-800">{list.name}</p>
                  <p className="text-sm text-gray-500">{list.words.length} words</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg bg-purple-100 px-4 py-2 font-semibold text-purple-600 hover:bg-purple-200"
                    onClick={() => startEdit(list)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg bg-red-100 px-4 py-2 font-semibold text-red-500 hover:bg-red-200"
                    onClick={() => onDelete(list.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}