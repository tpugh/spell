import type { StorageAdapter } from '../db'
import { EMPTY_PROGRESS } from '../progress'
import type { Progress, TestResult, WordList } from '../types'

/**
 * The subset of chrome.storage.local this app needs.
 * Typed locally so the web build does not depend on @types/chrome.
 */
export interface ChromeStorageArea {
  get(keys: string | string[]): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

interface ChromeLike {
  storage?: {
    local?: ChromeStorageArea
  }
}

export const WORD_LISTS_KEY = 'spell:wordLists'
export const TEST_RESULTS_KEY = 'spell:testResults'
export const PROGRESS_KEY = 'spell:progress'

function isProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) return false
  const progress = value as Record<string, unknown>
  return (
    typeof progress.stars === 'number' &&
    typeof progress.streakDays === 'number' &&
    typeof progress.bestStreak === 'number' &&
    typeof progress.totalSessions === 'number' &&
    (progress.lastPracticeDay === null || typeof progress.lastPracticeDay === 'string')
  )
}

/** Returns chrome.storage.local when running inside the extension, else null. */
export function getChromeStorage(): ChromeStorageArea | null {
  const runtime = (globalThis as { chrome?: ChromeLike }).chrome
  return runtime?.storage?.local ?? null
}

async function readArray<T>(area: ChromeStorageArea, key: string): Promise<T[]> {
  const stored = await area.get(key)
  const value = stored[key]
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * StorageAdapter backed by chrome.storage.local.
 * Mirrors dexieAdapter's ordering so the UI behaves identically.
 */
export function createChromeStorageAdapter(area: ChromeStorageArea): StorageAdapter {
  return {
    async getWordLists() {
      const lists = await readArray<WordList>(area, WORD_LISTS_KEY)
      return [...lists].sort((a, b) => b.updatedAt - a.updatedAt)
    },

    async saveWordList(list) {
      const lists = await readArray<WordList>(area, WORD_LISTS_KEY)
      const next = lists.filter((item) => item.id !== list.id)
      next.push(list)
      await area.set({ [WORD_LISTS_KEY]: next })
    },

    async deleteWordList(id) {
      const lists = await readArray<WordList>(area, WORD_LISTS_KEY)
      await area.set({ [WORD_LISTS_KEY]: lists.filter((item) => item.id !== id) })
    },

    async getTestResults() {
      const results = await readArray<TestResult>(area, TEST_RESULTS_KEY)
      return [...results].sort((a, b) => b.date - a.date)
    },

    async saveTestResult(result) {
      const results = await readArray<TestResult>(area, TEST_RESULTS_KEY)
      const next = results.filter((item) => item.id !== result.id)
      next.push(result)
      await area.set({ [TEST_RESULTS_KEY]: next })
    },

    async clearAll() {
      await area.set({ [WORD_LISTS_KEY]: [], [TEST_RESULTS_KEY]: [] })
    },

    async getProgress() {
      const stored = await area.get(PROGRESS_KEY)
      const value = stored[PROGRESS_KEY]
      return isProgress(value) ? value : EMPTY_PROGRESS
    },

    async saveProgress(progress) {
      await area.set({ [PROGRESS_KEY]: progress })
    },
  }
}
