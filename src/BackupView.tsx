import { useEffect, useState, type ChangeEvent } from 'react'
import { storage } from './db'
import {
  MAX_BACKUP_BYTES,
  backupFileName,
  exportBackup,
  importBackup,
  parseBackup,
  serializeBackup,
  type BackupFile,
  type ImportMode,
} from './storage/backup'
import type { View } from './types'

interface BackupViewProps {
  onNavigate: (view: View) => void
  onRestored?: () => void
}

interface PendingBackup {
  backup: BackupFile
  fileName: string
}

interface Status {
  tone: 'ok' | 'error'
  message: string
}

function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`
}

export default function BackupView({ onNavigate, onRestored }: BackupViewProps) {
  const [counts, setCounts] = useState<{ lists: number; results: number } | null>(null)
  const [pending, setPending] = useState<PendingBackup | null>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [lists, results] = await Promise.all([
        storage.getWordLists(),
        storage.getTestResults(),
      ])
      if (!cancelled) setCounts({ lists: lists.length, results: results.length })
    })()
    return () => {
      cancelled = true
    }
  }, [status])

  async function handleExport() {
    setBusy(true)
    setStatus(null)
    try {
      const backup = await exportBackup(storage)
      const blob = new Blob([serializeBackup(backup)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = backupFileName()
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus({
        tone: 'ok',
        message: `Backup saved with ${countLabel(backup.wordLists.length, 'word list')} and ${countLabel(backup.testResults.length, 'test result')}.`,
      })
    } catch {
      setStatus({ tone: 'error', message: 'Could not save the backup. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setStatus(null)
    setPending(null)

    if (file.size > MAX_BACKUP_BYTES) {
      setStatus({ tone: 'error', message: 'That file is too big to be a Spell backup.' })
      return
    }

    const parsed = parseBackup(await file.text())
    if (!parsed.ok) {
      setStatus({ tone: 'error', message: parsed.error })
      return
    }

    setPending({ backup: parsed.backup, fileName: file.name })
    setStatus({
      tone: 'ok',
      message: `Ready to restore ${countLabel(parsed.backup.wordLists.length, 'word list')} and ${countLabel(parsed.backup.testResults.length, 'test result')}.`,
    })
  }

  async function handleRestore() {
    if (!pending) return
    setBusy(true)
    setStatus(null)
    try {
      const summary = await importBackup(storage, pending.backup, mode)
      setPending(null)
      setStatus({
        tone: 'ok',
        message: `Restored ${countLabel(summary.wordListsAdded, 'word list')} and ${countLabel(summary.testResultsAdded, 'test result')}.`,
      })
      onRestored?.()
    } catch {
      setStatus({
        tone: 'error',
        message: 'Could not finish restoring. Check your lists before trying again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-gradient-to-b from-slate-100 to-indigo-100 p-6"
    >
      <div className="mx-auto max-w-xl">
        <button
          type="button"
          className="mb-4 min-h-12 rounded-lg px-3 py-2 text-lg font-semibold text-indigo-800 hover:bg-indigo-200"
          onClick={() => onNavigate('home')}
        >
          <span aria-hidden="true">← </span>Home
        </button>

        <h1 className="mb-2 text-3xl font-bold text-indigo-900">Back up &amp; restore</h1>
        <p className="mb-6 text-gray-700">
          For grown-ups. Keep a copy of the word lists and test results on this device, or move them
          to a new browser or the Chrome extension.
        </p>

        <section aria-labelledby="export-heading" className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h2 id="export-heading" className="mb-2 text-xl font-bold text-indigo-900">
            Save a backup
          </h2>
          <p className="mb-4 text-gray-700">
            {counts
              ? `${countLabel(counts.lists, 'word list')} and ${countLabel(counts.results, 'test result')} are saved on this device.`
              : 'Checking what is saved on this device...'}
          </p>
          <button
            type="button"
            className="min-h-14 rounded-2xl bg-indigo-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-indigo-800 active:scale-95 disabled:opacity-50"
            onClick={handleExport}
            disabled={busy}
          >
            Save a backup
          </button>
        </section>

        <section aria-labelledby="import-heading" className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h2 id="import-heading" className="mb-2 text-xl font-bold text-indigo-900">
            Restore a backup
          </h2>
          <p className="mb-4 text-gray-700">
            Choose a Spell backup file (<code>.json</code>). Nothing changes until you press
            restore.
          </p>

          <label htmlFor="backup-file" className="mb-2 block text-sm font-semibold text-gray-700">
            Backup file
          </label>
          <input
            id="backup-file"
            type="file"
            accept="application/json,.json"
            className="mb-4 block w-full rounded-xl border-2 border-indigo-300 bg-indigo-50 p-3 text-base file:mr-4 file:min-h-12 file:rounded-lg file:border-0 file:bg-indigo-700 file:px-4 file:py-2 file:text-base file:font-semibold file:text-white hover:file:bg-indigo-800"
            onChange={(event) => void handleFile(event)}
          />

          {pending && (
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="mb-3 font-semibold text-indigo-900">
                {pending.fileName}: {pending.backup.wordLists.length} word lists,{' '}
                {pending.backup.testResults.length} test results
              </p>

              <fieldset className="mb-4">
                <legend className="mb-2 text-sm font-semibold text-gray-700">
                  How should we restore?
                </legend>
                <label className="mb-2 flex min-h-12 items-center gap-3 rounded-xl border-2 border-indigo-300 bg-white px-4 py-2">
                  <input
                    type="radio"
                    name="restore-mode"
                    value="merge"
                    checked={mode === 'merge'}
                    onChange={() => setMode('merge')}
                    className="h-5 w-5"
                  />
                  <span>
                    <strong>Add to what is here</strong> — keeps current lists and adds the backup.
                  </span>
                </label>
                <label className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-red-300 bg-white px-4 py-2">
                  <input
                    type="radio"
                    name="restore-mode"
                    value="replace"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                    className="h-5 w-5"
                  />
                  <span>
                    <strong>Replace everything</strong> — deletes current lists and results first.
                  </span>
                </label>
              </fieldset>

              {mode === 'replace' && (
                <p className="mb-3 rounded-lg bg-red-100 p-3 text-red-900">
                  This cannot be undone. Save a backup first if you are not sure.
                </p>
              )}

              <button
                type="button"
                className="min-h-14 w-full rounded-2xl bg-green-700 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-green-800 active:scale-95 disabled:opacity-50"
                onClick={handleRestore}
                disabled={busy}
              >
                Restore backup
              </button>
            </div>
          )}
        </section>

        <div
          id="backup-status"
          role="status"
          aria-live="polite"
          className="min-h-12 rounded-xl px-2 py-2"
        >
          {status && (
            <p
              className={
                status.tone === 'error' ? 'font-semibold text-red-800' : 'font-semibold text-green-800'
              }
            >
              {status.message}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
