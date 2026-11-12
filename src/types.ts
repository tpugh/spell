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

export type View =
  | 'home'
  | 'lists'
  | 'practice'
  | 'test'
  | 'results'

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