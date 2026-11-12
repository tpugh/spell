import { useState, useEffect, useRef } from 'react'
import { useTTS } from './useTTS'
import type { WordList, View, TestResult } from './types'
import { storage } from './db'

interface TestViewProps {
  wordList: WordList
  onNavigate: (view: View) => void
  onResult: (result: TestResult) => void
}

export default function TestView({ wordList, onNavigate, onResult }: TestViewProps) {
  const { speak, cancel } = useTTS()
  const words = wordList.words
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const startTime = useRef(Date.now())

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  useEffect(() => {
    if (currentWord && !submitted) {
      const timer = setTimeout(() => speak(currentWord.text), 300)
      return () => {
        clearTimeout(timer)
        cancel()
      }
    }
  }, [currentIndex, currentWord, submitted, speak, cancel])

  function saveAnswer() {
    setAnswers((prev) => ({ ...prev, [currentWord.id]: input.trim() }))
  }

  function next() {
    saveAnswer()
    setInput('')
    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      finish()
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
        correct++
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

  if (submitted) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-6">
      <button
        className="mb-4 self-start text-lg font-semibold text-blue-600 hover:text-blue-800"
        onClick={() => {
          if (confirm('Quit the test? Your progress will be lost.')) onNavigate('home')
        }}
      >
        ← Quit
      </button>

      {/* Progress */}
      <div className="mb-6 w-full max-w-md">
        <div className="mb-1 flex justify-between text-sm text-gray-500">
          <span>
            Word {currentIndex + 1} of {words.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-blue-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Speaker button */}
      <button
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 text-4xl text-white shadow-lg transition hover:bg-blue-600 active:scale-95"
        onClick={() => speak(currentWord.text)}
        aria-label="Play word"
      >
        🔊
      </button>

      <p className="mb-4 text-lg text-gray-500">Listen, then type the word</p>

      {/* Input */}
      <input
        className="mb-6 w-full max-w-md rounded-2xl border-3 border-blue-300 px-6 py-4 text-center text-3xl font-bold tracking-wider focus:border-blue-500 focus:outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && next()}
        placeholder="type here..."
        autoFocus
      />

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          className="rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-blue-600 active:scale-95 disabled:opacity-40"
          disabled={!input.trim()}
          onClick={next}
        >
          {currentIndex < words.length - 1 ? 'Next →' : 'Finish Test 🏁'}
        </button>
      </div>
    </div>
  )
}