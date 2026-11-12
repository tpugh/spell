import { useState, useCallback } from 'react'
import HomeView from './HomeView'
import WordListManager from './WordListManager'
import PracticeView from './PracticeView'
import TestView from './TestView'
import ResultsView from './ResultsView'
import { useWordLists } from './useWordLists'
import type { WordList, View, TestResult } from './types'

export default function App() {
  const { lists, loading, save, remove } = useWordLists()
  const [view, setView] = useState<View>('home')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [activeList, setActiveList] = useState<WordList | null>(null)
  const [lastResult, setLastResult] = useState<TestResult | null>(null)

  const selectedList = selectedListId
    ? lists.find((l) => l.id === selectedListId) ?? null
    : null

  const handleSelectList = useCallback((list: WordList) => {
    setSelectedListId(list.id)
  }, [])

  const handleNavigate = useCallback((v: View) => {
    if (v === 'practice' && selectedList) {
      setActiveList(selectedList)
    }
    if (v === 'test' && selectedList) {
      setActiveList(selectedList)
    }
    setView(v)
  }, [selectedList])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-indigo-50">
        <p className="text-2xl font-bold text-indigo-600">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {view === 'home' && (
        <HomeView
          lists={lists}
          selectedList={selectedList}
          onSelectList={handleSelectList}
          onNavigate={handleNavigate}
        />
      )}
      {view === 'lists' && (
        <WordListManager
          lists={lists}
          onSave={async (list) => { await save(list) }}
          onDelete={remove}
          onNavigate={setView}
        />
      )}
      {view === 'practice' && activeList && (
        <PracticeView
          wordList={activeList}
          onNavigate={setView}
        />
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
            if (lastResult.missedWords.length > 0) {
              const missedList: WordList = {
                id: 'missed-' + Date.now(),
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
            }
          }}
        />
      )}
    </>
  )
}