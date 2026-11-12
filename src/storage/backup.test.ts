import { describe, expect, it } from 'vitest'
import type { StorageAdapter } from '../db'
import { EMPTY_PROGRESS } from '../progress'
import type { GameSession, Progress, TestResult, WordList } from '../types'
import {
  backupFileName,
  exportBackup,
  importBackup,
  parseBackup,
  serializeBackup,
  type BackupFile,
} from './backup'

interface MemoryAdapter extends StorageAdapter {
  lists: Map<string, WordList>
  results: Map<string, TestResult>
  games: Map<string, GameSession>
  progress: Progress
  stats: { clearCalls: number }
}

function memoryAdapter(initial?: {
  lists?: WordList[]
  results?: TestResult[]
}): MemoryAdapter {
  const lists = new Map((initial?.lists ?? []).map((list) => [list.id, list]))
  const results = new Map((initial?.results ?? []).map((result) => [result.id, result]))
  const games = new Map<string, GameSession>()
  const progress = { ...EMPTY_PROGRESS }
  const stats = { clearCalls: 0 }

  return {
    lists,
    results,
    games,
    progress,
    stats,
    async getWordLists() {
      return [...lists.values()].sort((a, b) => b.updatedAt - a.updatedAt)
    },
    async saveWordList(list) {
      lists.set(list.id, list)
    },
    async deleteWordList(id) {
      lists.delete(id)
    },
    async getTestResults() {
      return [...results.values()].sort((a, b) => b.date - a.date)
    },
    async saveTestResult(result) {
      results.set(result.id, result)
    },
    async getGameSessions() {
      return [...games.values()].sort((a, b) => b.date - a.date)
    },
    async saveGameSession(session) {
      games.set(session.id, session)
    },
    async getProgress() {
      return { ...progress }
    },
    async saveProgress(next) {
      Object.assign(progress, next)
    },
    async clearAll() {
      stats.clearCalls += 1
      lists.clear()
      results.clear()
      games.clear()
    },
  }
}

function makeList(id: string, updatedAt: number, name = 'Week 1'): WordList {
  return {
    id,
    name,
    words: [{ id: `${id}-word`, text: 'cat' }],
    createdAt: 1,
    updatedAt,
  }
}

function makeResult(id: string, date: number): TestResult {
  return {
    id,
    wordListId: 'list-1',
    wordListName: 'Week 1',
    date,
    totalWords: 3,
    correctCount: 2,
    missedWords: ['dog'],
    durationMs: 5000,
  }
}

function validBackup(overrides: Partial<BackupFile> = {}): BackupFile {
  return {
    app: 'spell',
    version: 1,
    exportedAt: 1700000000000,
    wordLists: [makeList('list-1', 100)],
    testResults: [makeResult('result-1', 200)],
    ...overrides,
  }
}

describe('backup format', () => {
  it('round-trips through export, serialize and parse', async () => {
    const adapter = memoryAdapter({
      lists: [makeList('list-1', 100)],
      results: [makeResult('result-1', 200)],
    })

    const backup = await exportBackup(adapter)
    expect(backup.app).toBe('spell')
    expect(backup.version).toBe(1)
    expect(backup.wordLists).toHaveLength(1)
    expect(backup.testResults).toHaveLength(1)

    const parsed = parseBackup(serializeBackup(backup))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.backup.wordLists[0].id).toBe('list-1')
      expect(parsed.backup.testResults[0].id).toBe('result-1')
    }
  })

  it('names backups by local date', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('spell-backup-2026-01-05.json')
  })

  it('rejects invalid JSON', () => {
    const parsed = parseBackup('{not json')
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toMatch(/not valid JSON/i)
  })

  it('rejects files from other apps and versions', () => {
    expect(parseBackup(JSON.stringify({ ...validBackup(), app: 'other' })).ok).toBe(false)
    expect(parseBackup(JSON.stringify({ ...validBackup(), version: 99 })).ok).toBe(false)
  })

  it('rejects damaged word lists and results', () => {
    const badList = JSON.stringify({
      ...validBackup(),
      wordLists: [{ id: 'x', name: 'Week 1', words: 'nope' }],
    })
    expect(parseBackup(badList).ok).toBe(false)

    const badResult = JSON.stringify({
      ...validBackup(),
      testResults: [{ id: 'r', missedWords: [1] }],
    })
    expect(parseBackup(badResult).ok).toBe(false)
  })
})

describe('importBackup', () => {
  it('adds new records and keeps the newest copy of a list on merge', async () => {
    const adapter = memoryAdapter({
      lists: [makeList('list-1', 300, 'Newer local')],
      results: [makeResult('result-1', 100)],
    })

    const summary = await importBackup(
      adapter,
      validBackup({
        wordLists: [makeList('list-1', 100, 'Older backup'), makeList('list-2', 400, 'From backup')],
        testResults: [makeResult('result-1', 100), makeResult('result-2', 500)],
      }),
      'merge',
    )

    expect(summary.wordListsKept).toBe(1)
    expect(summary.wordListsAdded).toBe(1)
    expect(summary.testResultsKept).toBe(1)
    expect(summary.testResultsAdded).toBe(1)
    expect(adapter.lists.get('list-1')?.name).toBe('Newer local')
    expect(adapter.lists.get('list-2')?.name).toBe('From backup')
    expect(adapter.stats.clearCalls).toBe(0)
  })

  it('replaces an older local list with the newer backup copy on merge', async () => {
    const adapter = memoryAdapter({ lists: [makeList('list-1', 50, 'Old local')] })

    const summary = await importBackup(adapter, validBackup(), 'merge')

    expect(summary.wordListsAdded).toBe(1)
    expect(adapter.lists.get('list-1')?.name).toBe('Week 1')
  })

  it('clears existing data first when replacing', async () => {
    const adapter = memoryAdapter({
      lists: [makeList('old-list', 100, 'Should go')],
      results: [makeResult('old-result', 100)],
    })

    const summary = await importBackup(adapter, validBackup(), 'replace')

    expect(adapter.stats.clearCalls).toBe(1)
    expect([...adapter.lists.keys()]).toEqual(['list-1'])
    expect([...adapter.results.keys()]).toEqual(['result-1'])
    expect(summary.wordListsAdded).toBe(1)
    expect(summary.testResultsAdded).toBe(1)
  })
})
