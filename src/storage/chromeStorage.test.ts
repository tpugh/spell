import { describe, expect, it } from 'vitest'
import {
  TEST_RESULTS_KEY,
  WORD_LISTS_KEY,
  createChromeStorageAdapter,
  type ChromeStorageArea,
} from './chromeStorage'
import type { TestResult, WordList } from '../types'

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

  it('treats missing or malformed storage values as empty', async () => {
    const area = createFakeArea({ [WORD_LISTS_KEY]: 'not-an-array' })
    const adapter = createChromeStorageAdapter(area)
    await expect(adapter.getWordLists()).resolves.toEqual([])
  })
})
