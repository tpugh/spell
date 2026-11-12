import Dexie, { type Table } from 'dexie'
import type { WordList, TestResult } from './types'

// Dexie row types (mirror domain types for storage)
export interface DbWordList {
  id: string
  name: string
  words: { id: string; text: string; hint?: string }[]
  createdAt: number
  updatedAt: number
}

export interface DbTestResult {
  id: string
  wordListId: string
  wordListName: string
  date: number
  totalWords: number
  correctCount: number
  missedWords: string[]
  durationMs: number
}

class SpellDatabase extends Dexie {
  wordLists!: Table<DbWordList, string>
  testResults!: Table<DbTestResult, string>

  constructor() {
    super('spell-db')
    this.version(1).stores({
      wordLists: 'id, name, createdAt, updatedAt',
      testResults: 'id, wordListId, date',
    })
  }
}

export const db = new SpellDatabase()

// --- Storage adapter interface (allows swapping to chrome.storage later) ---

export interface StorageAdapter {
  getWordLists(): Promise<WordList[]>
  saveWordList(list: WordList): Promise<void>
  deleteWordList(id: string): Promise<void>
  getTestResults(): Promise<TestResult[]>
  saveTestResult(result: TestResult): Promise<void>
}

function toWordList(row: DbWordList): WordList {
  return {
    id: row.id,
    name: row.name,
    words: row.words.map((w) => ({ id: w.id, text: w.text, hint: w.hint })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toDbWordList(list: WordList): DbWordList {
  return {
    id: list.id,
    name: list.name,
    words: list.words.map((w) => ({ id: w.id, text: w.text, hint: w.hint })),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  }
}

export const dexieAdapter: StorageAdapter = {
  async getWordLists() {
    const rows = await db.wordLists.orderBy('updatedAt').reverse().toArray()
    return rows.map(toWordList)
  },
  async saveWordList(list) {
    await db.wordLists.put(toDbWordList(list))
  },
  async deleteWordList(id) {
    await db.wordLists.delete(id)
  },
  async getTestResults() {
    const rows = await db.testResults.orderBy('date').reverse().toArray()
    return rows.map((r) => ({
      id: r.id,
      wordListId: r.wordListId,
      wordListName: r.wordListName,
      date: r.date,
      totalWords: r.totalWords,
      correctCount: r.correctCount,
      missedWords: r.missedWords,
      durationMs: r.durationMs,
    }))
  },
  async saveTestResult(result) {
    await db.testResults.put({
      id: result.id,
      wordListId: result.wordListId,
      wordListName: result.wordListName,
      date: result.date,
      totalWords: result.totalWords,
      correctCount: result.correctCount,
      missedWords: result.missedWords,
      durationMs: result.durationMs,
    })
  },
}

// Default adapter (can be swapped for chrome.storage in extension build)
export const storage: StorageAdapter = dexieAdapter