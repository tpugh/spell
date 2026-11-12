// Shared domain types for Spell

export interface Word {
  id: string
  text: string
  hint?: string
}

export interface WordList {
  id: string
  name: string
  words: Word[]
  createdAt: number
  updatedAt: number
}

export interface TestResult {
  id: string
  wordListId: string
  wordListName: string
  date: number
  totalWords: number
  correctCount: number
  missedWords: string[]
  durationMs: number
}

/** Device-local motivation progress (stars + daily streak). */
export interface Progress {
  stars: number
  streakDays: number
  bestStreak: number
  /** Local calendar day of the last finished session, e.g. "2026-11-12". */
  lastPracticeDay: string | null
  totalSessions: number
}

export type View =
  | 'home'
  | 'lists'
  | 'practice'
  | 'test'
  | 'results'
  | 'backup'

export interface PracticeState {
  wordList: WordList
  currentIndex: number
  attempts: Record<string, number>
  completed: boolean
}

export interface TestState {
  wordList: WordList
  currentIndex: number
  answers: Record<string, string>
  submitted: boolean
  startTime: number
}
