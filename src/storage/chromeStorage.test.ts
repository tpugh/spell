import { describe, expect, it } from 'vitest'
import {
  GAME_SESSIONS_KEY,
  PROGRESS_KEY,
  TEST_RESULTS_KEY,
  WORD_LISTS_KEY,
  createChromeStorageAdapter,
  type ChromeStorageArea,
} from './chromeStorage'
import { EMPTY_PROGRESS } from '../progress'
import type { GameSession, TestResult, WordList } from '../types'

function createFakeArea(initial: Record<string, unknown> = {}): ChromeStorageArea & {
  data: Record<string, unknown>
} {
  const data: Record<string, unknown> = { ...initial }
  return {
    data,
    async get(keys) {
      const wanted = Array.isArray(keys) ? keys : [keys]
      const result: Record<string, unknown> = {}
      for (const key of wanted) {
        if (key in data) result[key] = data[key]
      }
      return result
    },
    async set(items) {
      Object.assign(data, items)
    },
  }
}

function makeList(id: string, name: string, updatedAt: number): WordList {
  return {
    id,
    name,
    words: [{ id: `${id}-word`, text: 'cat' }],
    createdAt: 1,
    updatedAt,
  }
}

describe('chrome.storage adapter', () => {
  it('saves word lists and returns them newest first', async () => {
    const area = createFakeArea()
    const adapter = createChromeStorageAdapter(area)

    await adapter.saveWordList(makeList('a', 'Week 1', 100))
    await adapter.saveWordList(makeList('b', 'Week 2', 200))

    const lists = await adapter.getWordLists()
    expect(lists.map((list) => list.id)).toEqual(['b', 'a'])
    expect((area.data[WORD_LISTS_KEY] as WordList[]).length).toBe(2)
  })

  it('replaces an existing word list instead of duplicating it', async () => {
    const area = createFakeArea()
    const adapter = createChromeStorageAdapter(area)

    await adapter.saveWordList(makeList('a', 'Week 1', 100))
    await adapter.saveWordList({ ...makeList('a', 'Week 1 (edited)', 300) })

    const lists = await adapter.getWordLists()
    expect(lists).toHaveLength(1)
    expect(lists[0].name).toBe('Week 1 (edited)')
  })

  it('deletes a word list', async () => {
    const area = createFakeArea()
    const adapter = createChromeStorageAdapter(area)

    await adapter.saveWordList(makeList('a', 'Week 1', 100))
    await adapter.saveWordList(makeList('b', 'Week 2', 200))
    await adapter.deleteWordList('a')

    const lists = await adapter.getWordLists()
    expect(lists.map((list) => list.id)).toEqual(['b'])
  })

  it('stores and reads test results newest first', async () => {
    const area = createFakeArea()
    const adapter = createChromeStorageAdapter(area)

    const result = (id: string, date: number): TestResult => ({
      id,
      wordListId: 'a',
      wordListName: 'Week 1',
      date,
      totalWords: 3,
      correctCount: 2,
      missedWords: ['cat'],
      durationMs: 1000,
    })

    await adapter.saveTestResult(result('old', 10))
    await adapter.saveTestResult(result('new', 20))

    const results = await adapter.getTestResults()
    expect(results.map((item) => item.id)).toEqual(['new', 'old'])
    expect((area.data[TEST_RESULTS_KEY] as TestResult[]).length).toBe(2)

    await adapter.saveTestResult({ ...result('new', 20), correctCount: 3, missedWords: [] })
    expect(await adapter.getTestResults()).toHaveLength(2)
  })

  it('clears word lists and results for backup replace', async () => {
    const area = createFakeArea()
    const adapter = createChromeStorageAdapter(area)

    await adapter.saveWordList(makeList('a', 'Week 1', 100))
    await adapter.clearAll()

    expect(await adapter.getWordLists()).toEqual([])
    expect(await adapter.getTestResults()).toEqual([])
  })

  it('treats missing or malformed storage values as empty', async () => {
    const area = createFakeArea({ [WORD_LISTS_KEY]: 'not-an-array' })
    const adapter = createChromeStorageAdapter(area)
    await expect(adapter.getWordLists()).resolves.toEqual([])
  })

  it('stores stars and streaks and keeps them when lists are cleared', async () => {
    const area = createFakeArea()
    const adapter = createChromeStorageAdapter(area)

    await expect(adapter.getProgress()).resolves.toEqual(EMPTY_PROGRESS)

    const progress = {
      stars: 7,
      streakDays: 3,
      bestStreak: 4,
      lastPracticeDay: '2026-11-12',
      totalSessions: 5,
      gameStars: 2,
      gameStarsDay: '2026-11-12',
    }
    await adapter.saveProgress(progress)

    await expect(adapter.getProgress()).resolves.toEqual(progress)
    expect(area.data[PROGRESS_KEY]).toEqual(progress)

    await adapter.clearAll()
    await expect(adapter.getProgress()).resolves.toEqual(progress)
  })

  it('fills in game fields for progress saved by an older version', async () => {
    const area = createFakeArea({
      [PROGRESS_KEY]: {
        stars: 4,
        streakDays: 2,
        bestStreak: 3,
        lastPracticeDay: '2026-11-10',
        totalSessions: 5,
      },
    })
    const adapter = createChromeStorageAdapter(area)

    await expect(adapter.getProgress()).resolves.toEqual({
      stars: 4,
      streakDays: 2,
      bestStreak: 3,
      lastPracticeDay: '2026-11-10',
      totalSessions: 5,
      gameStars: 0,
      gameStarsDay: null,
    })
  })

  it('falls back to empty progress when the stored value is malformed', async () => {
    const area = createFakeArea({ [PROGRESS_KEY]: { stars: 'lots' } })
    const adapter = createChromeStorageAdapter(area)
    await expect(adapter.getProgress()).resolves.toEqual(EMPTY_PROGRESS)
  })

  it('stores game sessions newest first and drops malformed entries', async () => {
    const area = createFakeArea()
    const adapter = createChromeStorageAdapter(area)

    const session = (id: string, date: number): GameSession => ({
      id,
      gameId: 'word-worm',
      wordListId: 'list-1',
      wordListName: 'Week 1',
      date,
      wordsCompleted: 4,
      wordsAttempted: 5,
      missedWords: ['dog'],
    })

    await adapter.saveGameSession(session('old', 10))
    await adapter.saveGameSession(session('new', 20))
    await adapter.saveGameSession(session('new', 20))

    const sessions = await adapter.getGameSessions()
    expect(sessions.map((item) => item.id)).toEqual(['new', 'old'])
    expect((area.data[GAME_SESSIONS_KEY] as GameSession[]).length).toBe(2)

    const malformed = createFakeArea({ [GAME_SESSIONS_KEY]: [{ id: 'broken' }, session('ok', 5)] })
    const other = createChromeStorageAdapter(malformed)
    await expect(other.getGameSessions()).resolves.toHaveLength(1)
  })

  it('clears game sessions when a backup replaces everything', async () => {
    const area = createFakeArea()
    const adapter = createChromeStorageAdapter(area)

    await adapter.saveGameSession({
      id: 'game-1',
      gameId: 'word-worm',
      wordListId: 'list-1',
      wordListName: 'Week 1',
      date: 10,
      wordsCompleted: 1,
      wordsAttempted: 1,
      missedWords: [],
    })
    await adapter.clearAll()

    await expect(adapter.getGameSessions()).resolves.toEqual([])
  })
})
