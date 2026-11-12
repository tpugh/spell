import type { StorageAdapter } from '../db'
import type { TestResult, Word, WordList } from '../types'

/**
 * Phase 0 of the storage plan in issue #9: a plain JSON backup that works
 * without any backend, on the web app and in the Chrome extension.
 *
 * The functions here only use the StorageAdapter methods, so they work with
 * IndexedDB and chrome.storage alike.
 */

export const BACKUP_APP = 'spell'
export const BACKUP_VERSION = 1

/** Reject huge files before parsing them. Real backups are a few KB. */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024
const MAX_WORD_LISTS = 500
const MAX_TOTAL_WORDS = 20000
const MAX_TEST_RESULTS = 5000

export interface BackupFile {
  app: typeof BACKUP_APP
  version: typeof BACKUP_VERSION
  exportedAt: number
  wordLists: WordList[]
  testResults: TestResult[]
}

export type BackupParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string }

export type ImportMode = 'merge' | 'replace'

export interface ImportSummary {
  wordListsAdded: number
  wordListsKept: number
  testResultsAdded: number
  testResultsKept: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isWord(value: unknown): value is Word {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    (value.hint === undefined || typeof value.hint === 'string')
  )
}

function isWordList(value: unknown): value is WordList {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.words) &&
    value.words.every(isWord) &&
    typeof value.createdAt === 'number' &&
    Number.isFinite(value.createdAt) &&
    typeof value.updatedAt === 'number' &&
    Number.isFinite(value.updatedAt)
  )
}

function isTestResult(value: unknown): value is TestResult {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.wordListId === 'string' &&
    typeof value.wordListName === 'string' &&
    typeof value.date === 'number' &&
    Number.isFinite(value.date) &&
    typeof value.totalWords === 'number' &&
    typeof value.correctCount === 'number' &&
    Array.isArray(value.missedWords) &&
    value.missedWords.every((word) => typeof word === 'string') &&
    typeof value.durationMs === 'number'
  )
}

/** Validate an untrusted backup file. Never throws. */
export function parseBackup(text: string): BackupParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }

  if (!isRecord(data)) {
    return { ok: false, error: 'That file does not look like a Spell backup.' }
  }
  if (data.app !== BACKUP_APP) {
    return { ok: false, error: 'That file was not created by Spell.' }
  }
  if (data.version !== BACKUP_VERSION) {
    return { ok: false, error: 'That backup comes from a different version of Spell.' }
  }
  if (typeof data.exportedAt !== 'number' || !Number.isFinite(data.exportedAt)) {
    return { ok: false, error: 'That backup is missing its export date.' }
  }
  if (!Array.isArray(data.wordLists) || !data.wordLists.every(isWordList)) {
    return { ok: false, error: 'That backup has a damaged word list.' }
  }
  if (!Array.isArray(data.testResults) || !data.testResults.every(isTestResult)) {
    return { ok: false, error: 'That backup has a damaged test result.' }
  }
  if (data.wordLists.length > MAX_WORD_LISTS) {
    return { ok: false, error: `That backup has more than ${MAX_WORD_LISTS} word lists.` }
  }

  const totalWords = data.wordLists.reduce((total, list) => total + list.words.length, 0)
  if (totalWords > MAX_TOTAL_WORDS) {
    return { ok: false, error: `That backup has more than ${MAX_TOTAL_WORDS} words.` }
  }
  if (data.testResults.length > MAX_TEST_RESULTS) {
    return { ok: false, error: `That backup has more than ${MAX_TEST_RESULTS} test results.` }
  }

  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: data.exportedAt,
      wordLists: data.wordLists,
      testResults: data.testResults,
    },
  }
}

export async function exportBackup(adapter: StorageAdapter): Promise<BackupFile> {
  const [wordLists, testResults] = await Promise.all([
    adapter.getWordLists(),
    adapter.getTestResults(),
  ])
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    wordLists,
    testResults,
  }
}

export function serializeBackup(backup: BackupFile): string {
  return `${JSON.stringify(backup, null, 2)}\n`
}

export function backupFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `spell-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

/**
 * Restore a validated backup.
 * merge: keep local data and let the newest copy of each record win.
 * replace: clear everything first, then write the backup.
 */
export async function importBackup(
  adapter: StorageAdapter,
  backup: BackupFile,
  mode: ImportMode,
): Promise<ImportSummary> {
  if (mode === 'replace') await adapter.clearAll()

  const summary: ImportSummary = {
    wordListsAdded: 0,
    wordListsKept: 0,
    testResultsAdded: 0,
    testResultsKept: 0,
  }

  const existingLists = new Map((await adapter.getWordLists()).map((list) => [list.id, list]))
  for (const list of backup.wordLists) {
    const existing = existingLists.get(list.id)
    if (existing && existing.updatedAt >= list.updatedAt) {
      summary.wordListsKept += 1
      continue
    }
    await adapter.saveWordList(list)
    summary.wordListsAdded += 1
  }

  const existingResults = new Set((await adapter.getTestResults()).map((result) => result.id))
  for (const result of backup.testResults) {
    if (existingResults.has(result.id)) {
      summary.testResultsKept += 1
      continue
    }
    await adapter.saveTestResult(result)
    summary.testResultsAdded += 1
  }

  return summary
}
