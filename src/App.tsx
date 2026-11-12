import { useEffect, useRef, useState } from 'react'
import HomeView from './HomeView'
import WordListManager from './WordListManager'
import PracticeView from './PracticeView'
import TestView from './TestView'
import ResultsView from './ResultsView'
import BackupView from './BackupView'
import { useWordLists } from './useWordLists'
import type { WordList, View, TestResult } from './types'

const VIEW_LABELS: Record<View, string> = {
  home: 'Home',
  lists: 'Word lists',
  practice: 'Practice mode',
  test: 'Test mode',
  results: 'Test results',
  backup: 'Back up and restore',
}

export default function App() {
  const { lists, loading, save, remove, refresh } = useWordLists()
  const [view, setView] = useState<View>('home')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [activeList, setActiveList] = useState<WordList | null>(null)
  const [lastResult, setLastResult] = useState<TestResult | null>(null)

  const selectedList = selectedListId
    ? (lists.find((l) => l.id === selectedListId) ?? null)
    : null

  // Move focus to the new screen after navigation so keyboard and screen
  // reader users land at the top of the updated content. Skipped on the
  // first render so the skip link stays the first tab stop.
  const hasNavigated = useRef(false)

  useEffect(() => {
    if (loading) return
    if (!hasNavigated.current) {
      hasNavigated.current = true
      return
    }
    document.getElementById('main-content')?.focus()
  }, [view, loading])

  function navigate(next: View) {
    if ((next === 'practice' || next === 'test') && selectedList) {
      setActiveList(selectedList)
    }
    setView(next)
  }

  if (loading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-indigo-50">
        <p className="text-2xl font-bold text-indigo-800">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-5 focus:py-3 focus:text-lg focus:font-bold focus:text-indigo-900 focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div role="status" aria-live="polite" className="sr-only">
        {VIEW_LABELS[view]}
      </div>

      {view === 'home' && (
        <HomeView
          lists={lists}
          selectedList={selectedList}
          onSelectList={(list) => setSelectedListId(list.id)}
          onNavigate={navigate}
        />
      )}

      {view === 'lists' && (
        <WordListManager
          lists={lists}
          onSave={async (list) => {
            await save(list)
          }}
          onDelete={remove}
          onNavigate={setView}
        />
      )}

      {view === 'practice' && activeList && (
        <PracticeView wordList={activeList} onNavigate={setView} />
      )}

      {view === 'test' && activeList && (
        <TestView
          wordList={activeList}
          onNavigate={setView}
          onResult={(result) => {
            setLastResult(result)
            setView('results')
          }}
        />
      )}

      {view === 'results' && lastResult && (
        <ResultsView
          result={lastResult}
          onNavigate={setView}
          onRetryMissed={() => {
            if (lastResult.missedWords.length === 0) return
            const missedList: WordList = {
              id: `missed-${Date.now()}`,
              name: 'Missed Words',
              words: lastResult.missedWords.map((text) => ({
                id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
                text,
              })),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            setActiveList(missedList)
            setView('practice')
          }}
        />
      )}

      {view === 'backup' && (
        <BackupView onNavigate={setView} onRestored={() => void refresh({ silent: true })} />
      )}
    </>
  )
}
