import { useState } from 'react'
import type { WordList, View } from './types'
import { createWord, createWordList } from './useWordLists'

interface WordListManagerProps {
  lists: WordList[]
  onSave: (list: WordList) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onNavigate: (view: View) => void
}

export default function WordListManager({
  lists,
  onSave,
  onDelete,
  onNavigate,
}: WordListManagerProps) {
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
    const name = editing.name.trim() || 'My List'
    await onSave({ ...editing, name })
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
    setEditing({ ...editing, words: editing.words.filter((word) => word.id !== wordId) })
  }

  function updateWordText(wordId: string, text: string) {
    if (!editing) return
    setEditing({
      ...editing,
      words: editing.words.map((word) => (word.id === wordId ? { ...word, text } : word)),
    })
  }

  async function handleDelete(list: WordList) {
    const confirmed = window.confirm(`Delete the list “${list.name}”? This cannot be undone.`)
    if (confirmed) await onDelete(list.id)
  }

  // --- Edit view ---
  if (editing) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6"
      >
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            className="mb-4 min-h-12 rounded-lg px-3 py-2 text-lg font-semibold text-purple-800 hover:bg-purple-200"
            onClick={() => setEditing(null)}
          >
            <span aria-hidden="true">← </span>Back
          </button>

          <h1 className="mb-4 text-3xl font-bold text-purple-900">
            {editing.createdAt === editing.updatedAt ? 'New List' : 'Edit List'}
          </h1>

          <label htmlFor="list-name" className="mb-1 block text-sm font-semibold text-gray-700">
            List name
          </label>
          <input
            id="list-name"
            className="mb-4 w-full rounded-xl border-2 border-purple-400 px-4 py-3 text-xl font-medium placeholder:text-gray-500"
            placeholder="e.g. Week 5"
            value={editing.name}
            onChange={(event) => setEditing({ ...editing, name: event.target.value })}
          />

          <label htmlFor="new-word" className="mb-1 block text-sm font-semibold text-gray-700">
            Add a word
          </label>
          <div className="mb-4 flex gap-2">
            <input
              id="new-word"
              className="min-w-0 flex-1 rounded-xl border-2 border-purple-400 px-4 py-3 text-lg placeholder:text-gray-500"
              placeholder="Type a word..."
              value={newWordText}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(event) => setNewWordText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addWord()
                }
              }}
            />
            <button
              type="button"
              className="min-h-12 rounded-xl bg-purple-700 px-6 py-3 text-lg font-bold text-white hover:bg-purple-800 active:scale-95"
              onClick={addWord}
            >
              Add
            </button>
          </div>

          <h2 className="mb-2 text-lg font-semibold text-purple-900">
            Words ({editing.words.length})
          </h2>
          <div className="mb-6 max-h-64 overflow-y-auto rounded-xl bg-white p-4 shadow-inner">
            {editing.words.length === 0 ? (
              <p className="text-center text-gray-700">No words yet. Add some above!</p>
            ) : (
              <ul className="space-y-2">
                {editing.words.map((word, index) => (
                  <li key={word.id} className="flex items-center gap-2">
                    <label htmlFor={`word-${word.id}`} className="sr-only">
                      Word {index + 1}
                    </label>
                    <input
                      id={`word-${word.id}`}
                      className="min-w-0 flex-1 rounded-lg border border-gray-400 px-3 py-2 text-lg"
                      value={word.text}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      onChange={(event) => updateWordText(word.id, event.target.value)}
                    />
                    <button
                      type="button"
                      className="min-h-12 min-w-12 rounded-lg bg-red-100 px-3 py-2 text-lg text-red-800 hover:bg-red-200"
                      onClick={() => removeWord(word.id)}
                      aria-label={`Remove ${word.text || `word ${index + 1}`}`}
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            className="min-h-14 w-full rounded-2xl bg-green-700 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-800 active:scale-95 disabled:opacity-50"
            disabled={editing.words.length === 0}
            onClick={handleSave}
          >
            Save List ({editing.words.length} words)
          </button>
          {editing.words.length === 0 && (
            <p className="mt-2 text-center text-gray-700">Add at least one word to save.</p>
          )}
        </div>
      </main>
    )
  }

  // --- List view ---
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6"
    >
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          className="mb-4 min-h-12 rounded-lg px-3 py-2 text-lg font-semibold text-purple-800 hover:bg-purple-200"
          onClick={() => onNavigate('home')}
        >
          <span aria-hidden="true">← </span>Home
        </button>

        <h1 className="mb-6 text-3xl font-bold text-purple-900">Word Lists</h1>

        <button
          type="button"
          className="mb-6 min-h-14 w-full rounded-2xl bg-green-700 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-800 active:scale-95"
          onClick={startNew}
        >
          + New List
        </button>

        {lists.length === 0 ? (
          <p className="text-center text-gray-700">No lists yet. Create your first one!</p>
        ) : (
          <ul className="space-y-3">
            {lists.map((list) => (
              <li
                key={list.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-md"
              >
                <div>
                  <p className="text-xl font-bold text-gray-900">{list.name}</p>
                  <p className="text-sm text-gray-700">{list.words.length} words</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="min-h-12 rounded-lg bg-purple-100 px-4 py-2 font-semibold text-purple-800 hover:bg-purple-200"
                    onClick={() => startEdit(list)}
                    aria-label={`Edit ${list.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="min-h-12 rounded-lg bg-red-100 px-4 py-2 font-semibold text-red-800 hover:bg-red-200"
                    onClick={() => handleDelete(list)}
                    aria-label={`Delete ${list.name}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
