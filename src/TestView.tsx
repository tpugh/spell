import { useEffect, useRef, useState } from 'react'
import { useTTS } from './hooks/useTTS'
import type { TestResult, WordList, View } from './types'
import { storage } from './db'

interface TestViewProps {
  wordList: WordList
  onNavigate: (view: View) => void
  onResult: (result: TestResult) => void
}

export default function TestView({ wordList, onNavigate, onResult }: TestViewProps) {
  const { speak, cancel, isSupported } = useTTS()
  const words = wordList.words
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const startTime = useRef(Date.now())

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  useEffect(() => {
    if (currentWord) {
      const timer = setTimeout(() => speak(currentWord.text), 300)
      return () => {
        clearTimeout(timer)
        cancel()
      }
    }
  }, [currentIndex, currentWord, speak, cancel])

  function saveAnswer() {
    setAnswers((previous) => ({ ...previous, [currentWord.id]: input.trim() }))
  }

  function next() {
    saveAnswer()
    setInput('')
    if (currentIndex < words.length - 1) {
      setCurrentIndex((index) => index + 1)
    } else {
      void finish()
    }
  }

  async function finish() {
    saveAnswer()
    const finalAnswers = { ...answers, [currentWord.id]: input.trim() }
    const missed: string[] = []
    let correct = 0

    for (const word of words) {
      const answer = (finalAnswers[word.id] ?? '').toLowerCase()
      if (answer === word.text.toLowerCase()) {
        correct += 1
      } else {
        missed.push(word.text)
      }
    }

    const result: TestResult = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      wordListId: wordList.id,
      wordListName: wordList.name,
      date: Date.now(),
      totalWords: words.length,
      correctCount: correct,
      missedWords: missed,
      durationMs: Date.now() - startTime.current,
    }

    await storage.saveTestResult(result)
    onResult(result)
  }

  function quit() {
    if (window.confirm('Quit the test? Your progress will be lost.')) onNavigate('home')
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-6"
    >
      <h1 className="sr-only">Test mode</h1>

      <button
        type="button"
        className="mb-4 min-h-12 self-start rounded-lg px-3 py-2 text-lg font-semibold text-blue-800 hover:bg-blue-100"
        onClick={quit}
      >
        <span aria-hidden="true">← </span>Quit
      </button>

      <div className="mb-6 w-full max-w-md">
        <div className="mb-1 flex justify-between text-sm text-gray-700">
          <span>
            Word {currentIndex + 1} of {words.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Test progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-3 overflow-hidden rounded-full bg-blue-200"
        >
          <div
            className="h-full rounded-full bg-blue-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-700 text-4xl text-white shadow-lg transition hover:bg-blue-800 active:scale-95"
        onClick={() => speak(currentWord.text)}
        aria-label="Play the word again"
      >
        <span aria-hidden="true">🔊</span>
      </button>

      {!isSupported && (
        <p className="mb-4 max-w-md rounded-xl bg-amber-100 p-3 text-center text-base text-amber-900">
          Audio isn&apos;t available on this device. Ask a grown-up to read the word aloud.
        </p>
      )}

      <label htmlFor="test-answer" className="mb-2 text-center text-lg text-gray-800">
        Listen, then type the word
      </label>
      <input
        id="test-answer"
        className="mb-6 w-full max-w-md rounded-2xl border-4 border-blue-400 px-6 py-4 text-center text-3xl font-bold tracking-wider focus:border-blue-700"
        value={input}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            next()
          }
        }}
        placeholder="type here..."
        autoFocus
      />

      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          className="min-h-14 rounded-2xl bg-blue-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-blue-800 active:scale-95 disabled:opacity-50"
          disabled={!input.trim()}
          onClick={next}
        >
          {currentIndex < words.length - 1 ? (
            <>
              Next <span aria-hidden="true">→</span>
            </>
          ) : (
            <>
              Finish Test <span aria-hidden="true">🏁</span>
            </>
          )}
        </button>
      </div>

      <p className="mt-6 max-w-md text-center text-sm text-gray-700" aria-live="polite">
        {Object.keys(answers).length} of {words.length} answers saved
      </p>
    </main>
  )
}
