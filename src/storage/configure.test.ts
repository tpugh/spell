import { afterEach, describe, expect, it } from 'vitest'
import { dexieAdapter, setStorageAdapter, storage } from '../db'
import { configureStorage } from './configure'
import { WORD_LISTS_KEY, type ChromeStorageArea } from './chromeStorage'

function installFakeChrome(area: ChromeStorageArea): void {
  const runtime = globalThis as { chrome?: unknown }
  runtime.chrome = { storage: { local: area } }
}

afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome
  setStorageAdapter(dexieAdapter)
})

describe('configureStorage', () => {
  it('keeps IndexedDB on the web', async () => {
    configureStorage()
    await expect(storage.getWordLists()).resolves.toEqual([])
  })

  it('switches the app storage to chrome.storage.local when available', async () => {
    const data: Record<string, unknown> = {}
    const area: ChromeStorageArea = {
      async get(keys) {
        const wanted = Array.isArray(keys) ? keys : [keys]
        const result: Record<string, unknown> = {}
        for (const key of wanted) if (key in data) result[key] = data[key]
        return result
      },
      async set(items) {
        Object.assign(data, items)
      },
    }

    installFakeChrome(area)
    configureStorage()

    await storage.saveWordList({
      id: 'list-1',
      name: 'Week 1',
      words: [{ id: 'w1', text: 'cat' }],
      createdAt: 1,
      updatedAt: 2,
    })

    expect(data[WORD_LISTS_KEY]).toHaveLength(1)
    await expect(storage.getWordLists()).resolves.toHaveLength(1)
  })
})
